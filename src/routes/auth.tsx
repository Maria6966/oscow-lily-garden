import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход для сотрудников · Лилия" },
      {
        name: "description",
        content: "Служебный вход в панель мастерской «Лилия»: заявки и управление каталогом.",
      },
      { property: "og:title", content: "Вход для сотрудников · Лилия" },
      { property: "og:description", content: "Служебный вход в панель мастерской «Лилия»." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setMessage(
          "Не удалось войти. Если вы ещё не создавали аккаунт, нажмите «Первый вход — создать аккаунт» ниже.",
        );
        return;
      }
      navigate({ to: "/admin" });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) {
      setMessage(
        error.message.includes("already")
          ? "Такая почта уже зарегистрирована — войдите."
          : "Не удалось создать аккаунт. Пароль должен быть не короче 6 символов.",
      );
      return;
    }
    if (data.session) {
      navigate({ to: "/admin" });
      return;
    }
    setMessage("Аккаунт создан. Теперь войдите с этой почтой и паролем.");
    setMode("in");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="font-display text-3xl text-ink">
          Лилия<span className="text-petaldeep">.</span>
        </Link>
        <div className="mt-6 rounded-3xl border border-ink/5 bg-card/80 p-8">
          <p className="label-caps mb-2">Служебный вход</p>
          <h1 className="font-display text-3xl text-ink">
            {mode === "in" ? "Вход в панель" : "Новый сотрудник"}
          </h1>
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <input
              required
              type="email"
              placeholder="Рабочая почта"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-sm placeholder:text-inksoft focus:border-ink/40 focus:outline-none"
            />
            <input
              required
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-sm placeholder:text-inksoft focus:border-ink/40 focus:outline-none"
            />
            {message && <p className="text-sm text-inksoft">{message}</p>}
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-ink px-6 py-3 text-sm text-cream transition-colors hover:bg-inksoft disabled:opacity-60"
            >
              {busy ? "Секунду…" : mode === "in" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="mt-5 text-[13px] text-inksoft underline underline-offset-4 hover:text-ink"
          >
            {mode === "in" ? "Первый вход — создать аккаунт" : "У меня уже есть аккаунт"}
          </button>
        </div>
        <Link to="/" className="mt-6 inline-block text-[13px] text-inksoft hover:text-ink">
          ← На сайт
        </Link>
      </div>
    </section>
  );
}
