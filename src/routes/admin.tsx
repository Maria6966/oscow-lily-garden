import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { ProductsPanel } from "@/components/admin/ProductsPanel";
import { ChatsPanel } from "@/components/admin/ChatsPanel";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Витрина — заказы и товары · Лилия" },
      { name: "description", content: "Панель мастерской «Лилия»: заказы покупателей и каталог." },
      { property: "og:title", content: "Витрина · Лилия" },
      { property: "og:description", content: "Панель мастерской «Лилия»." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <Shell>Загружаем панель…</Shell>;

  if (!session) {
    return (
      <Shell>
        <p className="text-inksoft">Панель доступна сотрудникам мастерской.</p>
        <Link
          to="/auth"
          className="mt-5 inline-flex rounded-full bg-ink px-7 py-3 text-sm text-cream hover:bg-inksoft"
        >
          Войти
        </Link>
      </Shell>
    );
  }

  return <AdminContent userId={session.user.id} email={session.user.email ?? ""} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="label-caps mb-2">Витрина</p>
      <h1 className="mb-4 font-display text-4xl text-ink">Панель мастерской</h1>
      {children}
      <div className="mt-8">
        <Link to="/" className="text-[13px] text-inksoft hover:text-ink">
          ← На сайт
        </Link>
      </div>
    </section>
  );
}

function AdminContent({ userId, email }: { userId: string; email: string }) {
  const [claiming, setClaiming] = useState(false);
  const [tab, setTab] = useState<"orders" | "products" | "chats">("orders");

  const roleQuery = useQuery({
    queryKey: ["admin-role", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

  const claimAdmin = async () => {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_admin");
    setClaiming(false);
    if (error || data !== true) {
      alert("Права администратора уже кому-то выданы. Попросите коллегу добавить вас.");
      return;
    }
    roleQuery.refetch();
  };

  if (roleQuery.isLoading) return <Shell>Проверяем доступ…</Shell>;

  if (roleQuery.data !== true) {
    return (
      <Shell>
        <p className="text-inksoft">
          У аккаунта {email} пока нет прав администратора. Если вы настраиваете магазин впервые,
          назначьте себя администратором.
        </p>
        <button
          type="button"
          onClick={claimAdmin}
          disabled={claiming}
          className="mt-5 rounded-full bg-ink px-7 py-3 text-sm text-cream hover:bg-inksoft disabled:opacity-60"
        >
          {claiming ? "Секунду…" : "Стать администратором"}
        </button>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-4 block w-full text-[13px] text-inksoft underline underline-offset-4 hover:text-ink"
        >
          Выйти из аккаунта
        </button>
      </Shell>
    );
  }

  return (
    <section className="min-h-screen bg-sage/15">
      <div className="mx-auto max-w-[1360px] px-6 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-caps mb-2">Витрина · админка</p>
            <h1 className="font-display text-4xl text-ink">Заказы и ассортимент</h1>
            <p className="mt-2 text-[13px] text-inksoft">{email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="rounded-full border border-ink/20 px-4 py-2 text-[13px] text-ink hover:bg-cream"
            >
              На сайт
            </Link>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-full border border-ink/20 px-4 py-2 text-[13px] text-ink hover:bg-cream"
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="mb-8 inline-flex rounded-full border border-ink/10 bg-card/70 p-1">
          {([
            ["orders", "Заказы"],
            ["products", "Товары"],
            ["chats", "Чаты"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-full px-6 py-2 text-[13px] transition-colors ${
                tab === value ? "bg-ink text-cream" : "text-inksoft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "orders" ? <OrdersPanel /> : tab === "products" ? <ProductsPanel /> : <ChatsPanel />}
      </div>
    </section>
  );
}
