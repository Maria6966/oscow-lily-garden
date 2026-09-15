import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inputClass } from "./types";

type ChatSession = {
  id: string;
  customer_name: string;
  phone: string;
  needs_operator: boolean;
  resolved: boolean;
  order_id: string | null;
  created_at: string;
};

type ChatMessage = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
};

const ROLE_LABEL: Record<string, string> = {
  user: "Покупатель",
  assistant: "Помощник",
  operator: "Флорист",
  system: "Служебное",
};

function timeLabel(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Чаты покупателей с помощником: переписка, тикеты и ответы флориста. */
export function ChatsPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "operator" | "order">("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async (): Promise<ChatSession[]> => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("id, customer_name, phone, needs_operator, resolved, order_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChatSession[];
    },
    refetchInterval: 15000,
  });

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", openId],
    enabled: Boolean(openId),
    refetchInterval: 10000,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, session_id, role, content, created_at")
        .eq("session_id", openId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    },
  });

  const sessions = sessionsQuery.data ?? [];

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter(
      (s) =>
        (filter === "all" ||
          (filter === "operator" && s.needs_operator && !s.resolved) ||
          (filter === "order" && s.order_id)) &&
        (!q || s.customer_name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q)),
    );
  }, [sessions, filter, search]);

  const sendReply = async (sessionId: string) => {
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase
      .from("chat_messages")
      .insert({ session_id: sessionId, role: "operator", content: text });
    setSending(false);
    if (error) {
      alert("Не удалось отправить ответ. Попробуйте ещё раз.");
      return;
    }
    setReply("");
    qc.invalidateQueries({ queryKey: ["chat-messages", sessionId] });
  };

  const markResolved = async (session: ChatSession) => {
    await supabase
      .from("chat_sessions")
      .update({ resolved: true, needs_operator: false })
      .eq("id", session.id);
    qc.invalidateQueries({ queryKey: ["chat-sessions"] });
  };

  const removeSession = async (session: ChatSession) => {
    if (!confirm(`Удалить чат с ${session.customer_name}?`)) return;
    await supabase.from("chat_sessions").delete().eq("id", session.id);
    if (openId === session.id) setOpenId(null);
    qc.invalidateQueries({ queryKey: ["chat-sessions"] });
  };

  const waiting = sessions.filter((s) => s.needs_operator && !s.resolved).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Всего чатов", String(sessions.length)],
          ["Ждут флориста", String(waiting)],
          ["С заявкой", String(sessions.filter((s) => s.order_id).length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-ink/5 bg-card/70 p-5">
            <p className="text-[11px] uppercase tracking-widest text-inksoft">{label}</p>
            <p className="mt-1 font-display text-3xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-ink/10 bg-card/70 p-1">
          {(
            [
              ["all", "Все"],
              ["operator", "Ждут флориста"],
              ["order", "С заявкой"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
                filter === value ? "bg-ink text-cream" : "text-inksoft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          placeholder="Поиск по имени или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} max-w-xs`}
        />
      </div>

      {sessionsQuery.isLoading ? (
        <p className="text-inksoft">Загружаем чаты…</p>
      ) : visible.length === 0 ? (
        <p className="text-inksoft">Пока нет чатов по этому фильтру.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((session) => {
            const isOpen = openId === session.id;
            return (
              <article key={session.id} className="rounded-2xl border border-ink/5 bg-card/70">
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : session.id)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-ink">
                      {session.customer_name}{" "}
                      <span className="text-[13px] font-normal text-inksoft">{session.phone}</span>
                    </p>
                    <p className="text-[12px] text-inksoft">{timeLabel(session.created_at)}</p>
                  </button>
                  {session.needs_operator && !session.resolved && (
                    <span className="rounded-full bg-petal/50 px-3 py-1 text-[11px] text-ink">
                      Нужен флорист
                    </span>
                  )}
                  {session.order_id && (
                    <span className="rounded-full bg-sage/50 px-3 py-1 text-[11px] text-ink">
                      Оформлена заявка
                    </span>
                  )}
                  <a
                    href={`tel:${session.phone}`}
                    className="rounded-full border border-ink/20 px-3 py-1 text-[12px] text-ink hover:bg-cream"
                  >
                    Позвонить
                  </a>
                  <button
                    type="button"
                    onClick={() => removeSession(session)}
                    aria-label="Удалить чат"
                    className="text-inksoft hover:text-destructive"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-ink/10 px-5 py-4">
                    {messagesQuery.isLoading ? (
                      <p className="text-[13px] text-inksoft">Загружаем переписку…</p>
                    ) : (
                      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
                        {(messagesQuery.data ?? []).map((message) => (
                          <div key={message.id}>
                            <p className="text-[10px] uppercase tracking-widest text-inksoft">
                              {ROLE_LABEL[message.role] ?? message.role} · {timeLabel(message.created_at)}
                            </p>
                            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                              {message.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2">
                      <textarea
                        rows={3}
                        placeholder="Ответ покупателю — он увидит его в чате на сайте"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        className={inputClass}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => sendReply(session.id)}
                          disabled={sending || !reply.trim()}
                          className="rounded-full bg-ink px-5 py-2 text-[13px] text-cream hover:bg-inksoft disabled:opacity-50"
                        >
                          {sending ? "Отправляем…" : "Ответить"}
                        </button>
                        {session.needs_operator && !session.resolved && (
                          <button
                            type="button"
                            onClick={() => markResolved(session)}
                            className="rounded-full border border-ink/20 px-5 py-2 text-[13px] text-ink hover:bg-cream"
                          >
                            Вопрос решён
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
