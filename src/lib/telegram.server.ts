import { createHash, timingSafeEqual } from "crypto";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function keys() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const telegramKey = process.env["TELEGRAM_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!telegramKey) throw new Error("TELEGRAM_API_KEY is not configured");
  return { lovableKey, telegramKey };
}

/** Секрет для проверки запросов Telegram к вебхуку. */
export function webhookSecret(): string {
  const { telegramKey } = keys();
  return createHash("sha256").update(`telegram-webhook:${telegramKey}`).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Вызов Bot API через шлюз Lovable. */
export async function telegramCall(method: string, body: Record<string, unknown>) {
  const { lovableKey, telegramKey } = keys();
  const response = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`[telegram] ${method} failed [${response.status}]: ${text}`);
    throw new Error(`Telegram request failed [${response.status}]: ${text}`);
  }
  const data = JSON.parse(text) as { ok: boolean; error_code?: number; description?: string; result?: unknown };
  if (!data.ok) {
    console.error(`[telegram] ${method} returned not ok: ${text}`);
  }
  return data;
}

type OrderItem = { name?: string; qty?: number; price?: number };

type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  delivery_date: string | null;
  delivery_slot: string | null;
  comment: string | null;
  items: OrderItem[] | null;
  delivery_price: number;
  total: number;
  source: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export function orderMessage(order: OrderRow): string {
  const items = (order.items ?? [])
    .map((item) => `• ${escapeHtml(item.name ?? "позиция")} ×${item.qty ?? 1} — ${formatRub((item.price ?? 0) * (item.qty ?? 1))}`)
    .join("\n");
  const when = [order.delivery_date ?? "дата не указана", order.delivery_slot || null]
    .filter(Boolean)
    .join(", ");
  return [
    `🌸 <b>Новая заявка</b>${order.source === "chat" ? " (из чата с Лилей)" : ""}`,
    ``,
    `<b>${escapeHtml(order.customer_name)}</b>`,
    `📞 ${escapeHtml(order.phone)}`,
    `📍 ${escapeHtml(order.address)}`,
    `🕒 ${escapeHtml(when)}`,
    order.comment ? `💬 ${escapeHtml(order.comment)}` : "",
    ``,
    items || "• состав не указан",
    ``,
    `Доставка: ${order.delivery_price === 0 ? "бесплатно" : formatRub(order.delivery_price)}`,
    `<b>Итого: ${formatRub(order.total)}</b>`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/** Отправить уведомление о заявке всем подписчикам бота (один раз). */
export async function notifyOrder(orderId: string): Promise<{ sent: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "id, customer_name, phone, address, delivery_date, delivery_slot, comment, items, delivery_price, total, source, notified_at",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order || (order as { notified_at: string | null }).notified_at) return { sent: 0 };

  const { data: subscribers } = await supabaseAdmin
    .from("telegram_subscribers")
    .select("chat_id");

  const chatIds = (subscribers ?? []).map((row) => (row as { chat_id: number }).chat_id);
  const text = orderMessage(order as unknown as OrderRow);

  let sent = 0;
  for (const chatId of chatIds) {
    try {
      await telegramCall("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
      sent += 1;
    } catch (error) {
      console.error("[telegram] notify failed", error);
    }
  }

  await supabaseAdmin
    .from("orders")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", orderId);

  return { sent };
}
