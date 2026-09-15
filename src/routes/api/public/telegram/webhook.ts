import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { webhookSecret, safeEqual, telegramCall, notifyPendingOrders } = await import(
          "@/lib/telegram.server"
        );
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(provided, webhookSecret())) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json()) as {
          message?: {
            text?: string;
            chat?: { id?: number; title?: string; first_name?: string; username?: string };
          };
        };
        const message = update.message;
        const chat = message?.chat;
        if (!chat?.id) return Response.json({ ok: true, ignored: true });

        const text = (message?.text ?? "").trim().toLowerCase();
        const title = chat.title ?? chat.first_name ?? chat.username ?? "";

        // Telegram повторяет доставку при любой ошибке — отвечаем 200 всегда.
        const say = async (body: string) => {
          try {
            await telegramCall("sendMessage", { chat_id: chat.id, text: body });
          } catch (error) {
            console.error("[telegram] reply failed", error);
          }
        };

        try {
          if (text.startsWith("/start")) {
            await supabaseAdmin
              .from("telegram_subscribers")
              .upsert({ chat_id: chat.id, title }, { onConflict: "chat_id" });
            await say(
              "Готово! Буду присылать сюда новые заявки с сайта «Лилия». Чтобы отключить уведомления, напишите /stop.",
            );
            try {
              await notifyPendingOrders();
            } catch (error) {
              console.error("[telegram] pending notify failed", error);
            }
            return Response.json({ ok: true });
          }

          if (text.startsWith("/stop")) {
            await supabaseAdmin.from("telegram_subscribers").delete().eq("chat_id", chat.id);
            await say("Уведомления отключены. Напишите /start, чтобы снова получать заявки.");
            return Response.json({ ok: true });
          }

          await say(
            "Я присылаю новые заявки с сайта «Лилия». /start — включить уведомления, /stop — отключить.",
          );
        } catch (error) {
          console.error("[telegram] webhook error", error);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
