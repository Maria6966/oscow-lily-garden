import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Отправляет уведомление о новой заявке в Telegram-бот мастерской. */
export const notifyNewOrder = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { notifyOrder } = await import("./telegram.server");
    try {
      return await notifyOrder(data.orderId);
    } catch (error) {
      console.error("[notifyNewOrder]", error);
      return { sent: 0 };
    }
  });
