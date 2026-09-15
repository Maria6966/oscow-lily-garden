import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const StartInput = z.object({
  customer_name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(5).max(40),
  consent: z.literal(true),
});

const SendInput = z.object({
  token: z.string().min(10).max(80),
  text: z.string().trim().min(1).max(2000),
});

const PollInput = z.object({
  token: z.string().min(10).max(80),
});

export type PublicChatMessage = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

const GREETING =
  "Здравствуйте! Я Лиля, флорист мастерской «Лилия». Расскажите, для кого букет, какой бюджет и настроение — подберу лилии и посчитаю доставку.";

export const startChatSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => StartInput.parse(input))
  .handler(async ({ data }) => {
    const { adminDb } = await import("./chat.server");
    const db = await adminDb();
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().slice(0, 8);

    const { data: session, error } = await db
      .from("chat_sessions")
      .insert({
        token,
        customer_name: data.customer_name,
        phone: data.phone,
        consent: true,
      })
      .select("id")
      .single();
    if (error || !session) throw new Error("Не удалось начать чат");

    const { data: message } = await db
      .from("chat_messages")
      .insert({ session_id: session.id, role: "assistant", content: GREETING })
      .select("id, role, content, created_at")
      .single();

    return {
      token,
      messages: (message ? [message] : []) as PublicChatMessage[],
    };
  });

async function sessionByToken(token: string) {
  const { adminDb } = await import("./chat.server");
  const db = await adminDb();
  const { data } = await db
    .from("chat_sessions")
    .select("id, customer_name, phone, needs_operator")
    .eq("token", token)
    .maybeSingle();
  return { db, session: data };
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SendInput.parse(input))
  .handler(async ({ data }) => {
    const { db, session } = await sessionByToken(data.token);
    if (!session) throw new Error("Чат не найден");

    await db
      .from("chat_messages")
      .insert({ session_id: session.id, role: "user", content: data.text });

    const { data: rows } = await db
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });
    const history = (rows ?? []).filter((row) => row.role !== "system");

    try {
      const { generateAssistantReply } = await import("./chat.server");
      const reply = await generateAssistantReply({
        sessionId: session.id,
        customerName: session.customer_name,
        phone: session.phone,
        history: history.map((row) => ({
          role: row.role === "user" ? "user" : "assistant",
          content: row.content,
        })),
      });

      if (reply.text) {
        await db
          .from("chat_messages")
          .insert({ session_id: session.id, role: "assistant", content: reply.text });
      }
    } catch (error) {
      console.error("chat assistant failed", error);
      await db
        .from("chat_sessions")
        .update({ needs_operator: true, resolved: false })
        .eq("id", session.id);
      await db.from("chat_messages").insert({
        session_id: session.id,
        role: "assistant",
        content:
          "Извините, помощник сейчас недоступен. Я передала разговор живому флористу — он ответит здесь в ближайшее время.",
      });
    }

    const { data: fresh } = await db
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    return { messages: (fresh ?? []) as PublicChatMessage[] };
  });

export const pollChatMessages = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PollInput.parse(input))
  .handler(async ({ data }) => {
    const { db, session } = await sessionByToken(data.token);
    if (!session) return { messages: [] as PublicChatMessage[], needsOperator: false };

    const { data: rows } = await db
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    return {
      messages: (rows ?? []) as PublicChatMessage[],
      needsOperator: Boolean(session.needs_operator),
    };
  });
