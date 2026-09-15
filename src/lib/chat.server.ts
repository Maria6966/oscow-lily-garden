import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

export type ChatRole = "user" | "assistant" | "operator" | "system";

export type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

type ProductRow = {
  slug: string;
  name: string;
  kind: string;
  color: string;
  description: string;
  price: number;
  stems: number;
  height_cm: number;
  vase_days: number;
};

const DELIVERY_PRICE = 500;
const FREE_DELIVERY_FROM = 5000;

function deliveryPrice(subtotal: number) {
  return subtotal >= FREE_DELIVERY_FROM || subtotal === 0 ? 0 : DELIVERY_PRICE;
}

/** Сервисный клиент базы: только внутри серверных обработчиков. */
export async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function catalogLine(p: ProductRow) {
  return `- ${p.name} (код ${p.slug}): ${p.kind}, ${p.color}, ${p.stems} стеблей, ${p.height_cm} см, стойкость ${p.vase_days} дн., ${p.price} ₽. ${p.description}`;
}

const SYSTEM_RULES = `Ты — Лиля, флорист-консультант московской мастерской «Лилия». Отвечай по-русски, тепло, коротко (2–5 предложений), без канцелярита и без markdown-таблиц.

Что ты умеешь:
- подобрать букет из каталога под повод, бюджет, цвет и стойкость;
- собрать составной букет из нескольких позиций каталога и посчитать стоимость инструментом quote_bouquet (никогда не считай цены в голове);
- оформить заявку инструментом create_order, но только после того как покупатель подтвердил состав и назвал адрес доставки в Москве;
- позвать живого флориста инструментом request_operator, если вопрос вне каталога, покупатель просит человека, жалуется или ты не уверена.

Правила:
- Доставка по Москве 500 ₽, бесплатно от 5 000 ₽; за МКАД (до 30 км) 700 ₽. Оплата курьеру, предоплаты нет.
- Предлагай только позиции из каталога ниже, по их кодам.
- Перед оформлением обязательно уточни адрес; дату и время — если покупатель их не назвал (слоты 09:00–13:00, 13:00–17:00, 17:00–21:00).
- Имя и телефон покупателя уже известны, повторно не спрашивай.
- После успешного оформления скажи, что флорист перезвонит в течение 15 минут для подтверждения.`;

/** Ответ ИИ на последнее сообщение покупателя. */
export async function generateAssistantReply(params: {
  sessionId: string;
  customerName: string;
  phone: string;
  history: { role: string; content: string }[];
}): Promise<{ text: string; needsOperator: boolean; orderId: string | null }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const db = await adminDb();
  const { data: productData } = await db
    .from("products")
    .select("slug, name, kind, color, description, price, stems, height_cm, vase_days")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const products = (productData ?? []) as ProductRow[];
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  let needsOperator = false;
  let orderId: string | null = null;

  const priceItems = (items: { slug: string; qty: number }[]) => {
    const lines = items
      .map(({ slug, qty }) => {
        const product = bySlug.get(slug);
        if (!product) return null;
        const count = Math.max(1, Math.round(qty));
        return {
          slug: product.slug,
          name: product.name,
          stems: product.stems,
          qty: count,
          price: product.price,
          sum: product.price * count,
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
    const subtotal = lines.reduce((acc, line) => acc + line.sum, 0);
    const delivery = deliveryPrice(subtotal);
    return { lines, subtotal, delivery, total: subtotal + delivery };
  };

  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

  const result = streamText({
    model: lovable.responses("openai/gpt-6-astra"),
    system: `${SYSTEM_RULES}

Покупатель: ${params.customerName}, телефон ${params.phone}.

Каталог мастерской:
${products.map(catalogLine).join("\n")}`,
    messages: params.history.map((message) => ({
      role: message.role === "user" ? ("user" as const) : ("assistant" as const),
      content: message.content,
    })),
    stopWhen: stepCountIs(50),
    tools: {
      search_products: tool({
        description: "Найти подходящие букеты в каталоге мастерской.",
        inputSchema: z.object({
          query: z.string().nullable().describe("Повод, цвет или сорт; null — весь каталог"),
          max_price: z.number().nullable().describe("Максимальная цена букета в рублях или null"),
        }),
        execute: async ({ query, max_price }) => {
          const needle = (query ?? "").toLowerCase();
          return products
            .filter((p) => (max_price === null ? true : p.price <= max_price))
            .filter((p) =>
              needle
                ? `${p.name} ${p.kind} ${p.color} ${p.description}`.toLowerCase().includes(needle)
                : true,
            )
            .slice(0, 8);
        },
      }),
      quote_bouquet: tool({
        description: "Посчитать стоимость букета или composition из позиций каталога с доставкой.",
        inputSchema: z.object({
          items: z.array(
            z.object({
              slug: z.string().describe("Код позиции каталога"),
              qty: z.number().describe("Количество букетов"),
            }),
          ),
        }),
        execute: async ({ items }) => priceItems(items),
      }),
      create_order: tool({
        description:
          "Оформить заявку после подтверждения состава покупателем. Возвращает итоговую сумму.",
        inputSchema: z.object({
          address: z.string().describe("Адрес доставки"),
          delivery_date: z.string().nullable().describe("Дата в формате ГГГГ-ММ-ДД или null"),
          delivery_slot: z.string().nullable().describe("Интервал времени или null"),
          comment: z.string().nullable().describe("Пожелания покупателя или null"),
          items: z.array(
            z.object({
              slug: z.string(),
              qty: z.number(),
            }),
          ),
        }),
        execute: async ({ address, delivery_date, delivery_slot, comment, items }) => {
          const quote = priceItems(items);
          if (quote.lines.length === 0) return { ok: false, error: "Позиции не найдены" };
          const { data, error } = await db
            .from("orders")
            .insert({
              customer_name: params.customerName,
              phone: params.phone,
              address,
              delivery_date: delivery_date || null,
              delivery_slot: delivery_slot ?? "",
              comment: comment ?? "",
              items: quote.lines,
              delivery_price: quote.delivery,
              total: quote.total,
              source: "chat",
            })
            .select("id")
            .single();
          if (error || !data) return { ok: false, error: "Не удалось сохранить заявку" };
          orderId = data.id;
          await db
            .from("chat_sessions")
            .update({ order_id: data.id })
            .eq("id", params.sessionId);
          return { ok: true, total: quote.total, delivery: quote.delivery, items: quote.lines };
        },
      }),
      request_operator: tool({
        description: "Позвать живого флориста и создать тикет в панели мастерской.",
        inputSchema: z.object({
          reason: z.string().describe("Коротко: с чем нужна помощь человека"),
        }),
        execute: async ({ reason }) => {
          needsOperator = true;
          await db
            .from("chat_sessions")
            .update({ needs_operator: true, resolved: false })
            .eq("id", params.sessionId);
          await db.from("chat_messages").insert({
            session_id: params.sessionId,
            role: "system",
            content: `Нужен флорист: ${reason}`,
          });
          return { ok: true };
        },
      }),
    },
    providerOptions: {
      openai: {
        store: false,
        include: ["reasoning.encrypted_content"],
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
      },
    },
  });

  const text = (await result.text).trim();
  return { text, needsOperator, orderId };
}
