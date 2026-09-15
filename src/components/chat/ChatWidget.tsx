import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import chatLily from "@/assets/chat-lily.png";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";

import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  pollChatMessages,
  sendChatMessage,
  startChatSession,
  type PublicChatMessage,
} from "@/lib/chat.functions";

const TOKEN_KEY = "liliya-chat-token";

export function ChatWidget() {
  const start = useServerFn(startChatSession);
  const send = useServerFn(sendChatMessage);
  const poll = useServerFn(pollChatMessages);

  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [needsOperator, setNeedsOperator] = useState(false);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ customer_name: "", phone: "", consent: false });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!open || !token) return;
    textareaRef.current?.focus();
  }, [open, token, sending]);

  useEffect(() => {
    if (!token || !open) return;
    let stopped = false;
    const tick = async () => {
      try {
        const result = await poll({ data: { token } });
        if (stopped) return;
        setNeedsOperator(result.needsOperator);
        setMessages((current) =>
          result.messages.length >= current.length ? result.messages : current,
        );
      } catch {
        /* тихо повторим на следующем шаге */
      }
    };
    void tick();
    const id = setInterval(tick, 5000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [token, open, poll]);

  const beginChat = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStarting(true);
    try {
      const result = await start({
        data: {
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          consent: true as const,
        },
      });
      window.sessionStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      setMessages(result.messages);
    } catch {
      setError("Не удалось открыть чат. Попробуйте ещё раз или позвоните нам.");
    } finally {
      setStarting(false);
    }
  };

  const queueRef = useRef<string[]>([]);
  const drainingRef = useRef(false);

  const drainQueue = async (activeToken: string) => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    setSending(true);
    try {
      while (queueRef.current.length > 0) {
        const draft = queueRef.current[0]!;
        try {
          const result = await send({ data: { token: activeToken, text: draft } });
          queueRef.current.shift();
          const pending = queueRef.current.map((draft2, index) => ({
            id: `local-pending-${index}`,
            role: "user",
            content: draft2,
            created_at: new Date().toISOString(),
          }));
          setMessages([...result.messages, ...pending]);
          setError("");
        } catch {
          queueRef.current.shift();
          setError("Сообщение не отправилось. Напишите ещё раз, пожалуйста.");
        }
      }
    } finally {
      drainingRef.current = false;
      setSending(false);
    }
  };

  const submitMessage = (text: string) => {
    const draft = text.trim();
    if (!token || !draft) return;
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}-${current.length}`,
        role: "user",
        content: draft,
        created_at: new Date().toISOString(),
      },
    ]);
    queueRef.current.push(draft);
    void drainQueue(token);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть чат с флористом"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm text-cream shadow-lg transition-colors hover:bg-inksoft"
        >
          <MessageCircle aria-hidden="true" className="size-5" />
          <span className="hidden sm:inline">Подобрать букет</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex max-h-[80vh] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-ink/10 bg-cream shadow-2xl">
          <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
            <img src={chatLily} alt="" width={36} height={36} className="size-9 rounded-full" />
            <div className="flex-1">
              <p className="font-display text-lg leading-tight text-ink">Лиля, флорист</p>
              <p className="text-[11px] text-inksoft">
                {needsOperator ? "Флорист скоро подключится" : "Подберёт букет и посчитает доставку"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрыть чат"
              className="grid size-8 place-items-center rounded-full text-inksoft transition-colors hover:bg-paper hover:text-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          {!token ? (
            <form onSubmit={beginChat} className="flex flex-col gap-3 px-4 py-5">
              <p className="text-[13px] leading-relaxed text-inksoft">
                Оставьте имя и телефон — так флорист сможет продолжить разговор и оформить заявку.
              </p>
              <input
                required
                placeholder="Имя"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="rounded-xl border border-ink/15 bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-inksoft focus:border-ink/40 focus:outline-none"
              />
              <input
                required
                type="tel"
                placeholder="Телефон"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-xl border border-ink/15 bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-inksoft focus:border-ink/40 focus:outline-none"
              />
              <label className="flex items-start gap-2 text-[12px] leading-relaxed text-inksoft">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  className="mt-0.5 size-4 accent-[color:var(--petaldeep,#D494A6)]"
                />
                <span>
                  Согласен с{" "}
                  <Link to="/privacy" className="underline underline-offset-2">
                    политикой конфиденциальности
                  </Link>
                </span>
              </label>
              {error && <p className="text-[12px] text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={!form.consent || starting}
                className="rounded-full bg-petaldeep px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-petal disabled:opacity-50"
              >
                {starting ? "Открываем чат…" : "Начать чат"}
              </button>
            </form>
          ) : (
            <>
              <div
                ref={scrollRef}
                role="log"
                className="flex min-h-[240px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
              >
                {messages
                  .filter((message) => message.role !== "system")
                  .map((message) => (
                    <Message key={message.id} from={message.role === "user" ? "user" : "assistant"}>
                      <MessageContent
                        className={
                          message.role === "user" ? "bg-ink text-cream" : "bg-transparent text-ink"
                        }
                      >
                        {message.role === "operator" && (
                          <p className="mb-1 text-[10px] uppercase tracking-widest text-sagedeep">
                            Флорист мастерской
                          </p>
                        )}
                        <MessageResponse>{message.content}</MessageResponse>
                      </MessageContent>
                    </Message>
                  ))}
                {sending && <Shimmer className="px-1 text-[13px]">Лиля подбирает букет…</Shimmer>}
              </div>


              {error && <p className="px-4 text-[12px] text-destructive">{error}</p>}

              <div className="border-t border-ink/10 p-3">
                <PromptInput
                  onSubmit={(message) => {
                    submitMessage(message.text ?? "");
                  }}
                >
                  <PromptInputTextarea
                    ref={textareaRef}
                    className="max-h-24 min-h-11"
                    placeholder="Например: букет для мамы до 4 000 ₽"
                  />

                  <PromptInputFooter className="justify-end">
                    <PromptInputSubmit {...(sending ? { status: "submitted" as const } : {})} />
                  </PromptInputFooter>
                </PromptInput>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
