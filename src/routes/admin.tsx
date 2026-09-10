import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, KINDS, productImage, type Product } from "@/lib/shop";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Витрина — заявки и товары · Лилия" },
      { name: "description", content: "Панель мастерской «Лилия»: заявки покупателей и каталог." },
      { property: "og:title", content: "Витрина · Лилия" },
      { property: "og:description", content: "Панель мастерской «Лилия»." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  delivery_date: string | null;
  delivery_slot: string;
  comment: string;
  items: { name: string; qty: number; price: number }[];
  delivery_price: number;
  total: number;
  status: string;
  created_at: string;
};

const STATUSES: Record<string, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  delivered: "Доставлена",
  cancelled: "Отменена",
};

const emptyDraft = {
  slug: "",
  name: "",
  kind: "Ориентальная",
  color: "",
  description: "",
  price: 1000,
  stems: 5,
  height_cm: 60,
  vase_days: 10,
  image_url: "",
  is_active: true,
  sort_order: 100,
};

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

  if (!ready) {
    return <Shell>Загружаем панель…</Shell>;
  }

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
  const qc = useQueryClient();
  const [claiming, setClaiming] = useState(false);

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

  const isAdmin = roleQuery.data === true;

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    enabled: isAdmin,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const productsAdminQuery = useQuery({
    queryKey: ["products", "admin"],
    enabled: isAdmin,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const [draft, setDraft] = useState<typeof emptyDraft & { id?: string }>(emptyDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");

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

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    const payload = {
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      kind: draft.kind,
      color: draft.color,
      description: draft.description,
      price: Number(draft.price),
      stems: Number(draft.stems),
      height_cm: Number(draft.height_cm),
      vase_days: Number(draft.vase_days),
      image_url: draft.image_url.trim(),
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order),
    };

    const { error } = draft.id
      ? await supabase.from("products").update(payload).eq("id", draft.id)
      : await supabase.from("products").insert(payload);

    if (error) {
      setFormError("Не удалось сохранить. Проверьте, что адрес-ссылка уникальна.");
      return;
    }
    setFormOpen(false);
    setDraft(emptyDraft);
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Удалить позицию из каталога?")) return;
    await supabase.from("products").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const setStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  if (roleQuery.isLoading) return <Shell>Проверяем доступ…</Shell>;

  if (!isAdmin) {
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

  const orders = ordersQuery.data ?? [];
  const products = productsAdminQuery.data ?? [];
  const fresh = orders.filter((o) => o.status === "new").length;

  return (
    <section className="min-h-screen bg-sage/15">
      <div className="mx-auto max-w-[1360px] px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label-caps mb-2">Витрина · админка</p>
            <h1 className="font-display text-4xl text-ink">Заявки и товары</h1>
            <p className="mt-2 text-[13px] text-inksoft">{email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(emptyDraft);
                setFormOpen(true);
              }}
              className="rounded-full bg-ink px-4 py-2 text-[13px] text-cream hover:bg-inksoft"
            >
              + Добавить товар
            </button>
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

        {formOpen && (
          <form
            onSubmit={saveProduct}
            className="mb-8 rounded-2xl border border-ink/5 bg-card/80 p-6"
          >
            <h2 className="mb-4 font-display text-2xl text-ink">
              {draft.id ? `Редактируем: ${draft.name}` : "Новая позиция"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Название">
                <input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Адрес-ссылка (латиницей)">
                <input required value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Вид">
                <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} className={inputClass}>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Оттенок">
                <input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Цена, ₽">
                <input type="number" min={0} value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Стеблей">
                <input type="number" min={1} value={draft.stems} onChange={(e) => setDraft({ ...draft, stems: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Высота, см">
                <input type="number" min={1} value={draft.height_cm} onChange={(e) => setDraft({ ...draft, height_cm: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Стойкость, дней">
                <input type="number" min={1} value={draft.vase_days} onChange={(e) => setDraft({ ...draft, vase_days: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Ссылка на фото">
                <input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://…" className={inputClass} />
              </Field>
              <Field label="Порядок вывода">
                <input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Показывать на сайте">
                <select value={draft.is_active ? "1" : "0"} onChange={(e) => setDraft({ ...draft, is_active: e.target.value === "1" })} className={inputClass}>
                  <option value="1">Да</option>
                  <option value="0">Нет</option>
                </select>
              </Field>
              <Field label="Описание">
                <textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={inputClass} />
              </Field>
            </div>
            {formError && <p className="mt-4 text-sm text-destructive">{formError}</p>}
            <div className="mt-5 flex gap-2">
              <button type="submit" className="rounded-full bg-ink px-6 py-2.5 text-[13px] text-cream hover:bg-inksoft">
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setDraft(emptyDraft);
                }}
                className="rounded-full border border-ink/20 px-6 py-2.5 text-[13px] text-ink hover:bg-cream"
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-ink/5 bg-card/70 p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Заявки</h2>
              <span className="text-[12px] text-inksoft">
                {fresh > 0 ? `${fresh} новых` : "новых нет"}
              </span>
            </div>
            {ordersQuery.isLoading ? (
              <p className="text-[13px] text-inksoft">Загружаем…</p>
            ) : orders.length === 0 ? (
              <p className="text-[13px] text-inksoft">Заявок пока нет.</p>
            ) : (
              <div className="divide-y divide-ink/5">
                {orders.map((order) => (
                  <div key={order.id} className="py-4 text-[13px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-ink">
                        {order.customer_name} · {order.phone}
                      </p>
                      <span className="text-inksoft">
                        {new Date(order.created_at).toLocaleString("ru-RU")}
                      </span>
                    </div>
                    <p className="mt-1 text-inksoft">
                      {order.address}
                      {order.delivery_date ? ` · ${order.delivery_date}` : ""}
                      {order.delivery_slot ? `, ${order.delivery_slot}` : ""}
                    </p>
                    <p className="mt-1 text-inksoft">
                      {(order.items ?? []).map((i) => `${i.name} ×${i.qty}`).join(", ")}
                    </p>
                    {order.comment && (
                      <p className="mt-1 italic text-inksoft">«{order.comment}»</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="font-medium text-ink">{formatPrice(order.total)}</span>
                      <span className="text-inksoft">
                        доставка{" "}
                        {order.delivery_price === 0 ? "бесплатно" : formatPrice(order.delivery_price)}
                      </span>
                      <select
                        aria-label="Статус заявки"
                        value={order.status}
                        onChange={(e) => setStatus(order.id, e.target.value)}
                        className="rounded-full border border-ink/15 bg-cream/60 px-3 py-1 text-[12px]"
                      >
                        {Object.entries(STATUSES).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-ink/5 bg-card/70 p-5">
            <h2 className="mb-4 font-display text-xl text-ink">Товары</h2>
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <img
                    src={productImage(product)}
                    alt={product.name}
                    loading="lazy"
                    width={80}
                    height={80}
                    className="size-10 shrink-0 rounded-lg object-cover"
                  />
                  <p className="flex-1 text-[13px] text-ink">
                    {product.name}{" "}
                    <span className="text-inksoft">· {formatPrice(product.price)}</span>
                    {!product.is_active && <span className="text-inksoft"> · скрыт</span>}
                  </p>
                  <button
                    type="button"
                    aria-label={`Редактировать ${product.name}`}
                    onClick={() => {
                      setDraft({
                        id: product.id,
                        slug: product.slug,
                        name: product.name,
                        kind: product.kind,
                        color: product.color,
                        description: product.description,
                        price: product.price,
                        stems: product.stems,
                        height_cm: product.height_cm,
                        vase_days: product.vase_days,
                        image_url: product.image_url,
                        is_active: product.is_active,
                        sort_order: product.sort_order,
                      });
                      setFormOpen(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-[12px] text-inksoft hover:text-ink"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    aria-label={`Удалить ${product.name}`}
                    onClick={() => removeProduct(product.id)}
                    className="text-[12px] text-inksoft hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft(emptyDraft);
                setFormOpen(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-4 w-full rounded-full border border-dashed border-ink/25 py-2.5 text-[13px] text-inksoft transition-colors hover:text-ink"
            >
              Добавить позицию
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-cream/60 px-3 py-2 text-[13px] focus:border-ink/40 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-widest text-inksoft">{label}</span>
      {children}
    </label>
  );
}
