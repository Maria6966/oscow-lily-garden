import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { notifyNewOrder } from "@/lib/notify.functions";
import { formatPrice, FREE_DELIVERY_FROM, productImage } from "@/lib/shop";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Корзина и оформление заявки · Лилия, Москва" },
      {
        name: "description",
        content:
          "Проверьте состав букета и оставьте заявку: имя, телефон, адрес и удобная дата доставки по Москве.",
      },
      { property: "og:title", content: "Корзина · Лилия" },
      {
        property: "og:description",
        content: "Оформление заявки на доставку лилий по Москве без предоплаты.",
      },
    ],
  }),
  component: CartPage,
});

const slots = ["09:00–13:00", "13:00–17:00", "17:00–21:00"];

function CartPage() {
  const { items, subtotal, delivery, total, setQty, remove, clear } = useCart();
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    delivery_date: "",
    delivery_slot: "13:00–17:00",
    comment: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("sending");
    setError("");
    const { data: created, error: insertError } = await supabase.from("orders").insert({
      customer_name: form.customer_name,
      phone: form.phone,
      address: form.address,
      delivery_date: form.delivery_date || null,
      delivery_slot: form.delivery_slot,
      comment: form.comment,
      items: items.map((i) => ({
        slug: i.slug,
        name: i.name,
        qty: i.qty,
        price: i.price,
        stems: i.stems,
      })),
      delivery_price: delivery,
      total,
    }).select("id").single();

    if (insertError) {
      setError("Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.");
      setState("error");
      return;
    }
    if (created?.id) {
      notifyNewOrder({ data: { orderId: created.id } }).catch(() => {});
    }
    clear();
    setState("done");
  };

  if (state === "done") {
    return (
      <section className="mx-auto max-w-[720px] px-6 py-24 text-center">
        <p className="label-caps mb-3">Заявка принята</p>
        <h1 className="font-display text-5xl text-ink">Спасибо!</h1>
        <p className="mt-4 text-inksoft">
          Флорист перезвонит в течение 15 минут, чтобы подтвердить состав букета и время доставки.
        </p>
        <Link
          to="/catalog"
          className="mt-8 inline-flex rounded-full bg-ink px-7 py-3 text-sm text-cream hover:bg-inksoft"
        >
          Вернуться в каталог
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1360px] px-6 py-12">
      <p className="label-caps mb-2">Оформление</p>
      <h1 className="mb-8 font-display text-4xl text-ink">Ваша корзина</h1>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-ink/5 bg-paper/50 p-12 text-center">
          <p className="font-display text-2xl text-ink">Корзина пуста</p>
          <p className="mt-2 text-inksoft">Добавьте лилии из каталога — соберём букет в день доставки.</p>
          <Link
            to="/catalog"
            className="mt-6 inline-flex rounded-full bg-ink px-7 py-3 text-sm text-cream hover:bg-inksoft"
          >
            В каталог
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-ink p-7 text-cream lg:p-9">
              <div className="divide-y divide-cream/15">
                {items.map((item) => (
                  <div key={item.slug} className="flex items-center gap-4 py-4">
                    <img
                      src={productImage(item)}
                      alt={item.name}
                      loading="lazy"
                      width={112}
                      height={112}
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-[12px] text-cream/60">
                        {item.kind} · {item.stems} стеблей
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Меньше"
                        onClick={() => setQty(item.slug, item.qty - 1)}
                        className="text-cream/60 hover:text-cream"
                      >
                        −
                      </button>
                      <span className="text-sm">{item.qty}</span>
                      <button
                        type="button"
                        aria-label="Больше"
                        onClick={() => setQty(item.slug, item.qty + 1)}
                        className="text-cream/60 hover:text-cream"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-24 text-right font-medium">
                      {formatPrice(item.price * item.qty)}
                    </p>
                    <button
                      type="button"
                      aria-label={`Убрать ${item.name}`}
                      onClick={() => remove(item.slug)}
                      className="text-cream/40 hover:text-cream"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-cream/15 pt-6">
                <div>
                  <p className="text-[12px] text-cream/60">Доставка по Москве</p>
                  <p className="font-display text-2xl">
                    {delivery === 0 ? "Бесплатно" : formatPrice(delivery)}
                  </p>
                  {delivery > 0 && (
                    <p className="mt-1 text-[12px] text-cream/50">
                      Бесплатно от {formatPrice(FREE_DELIVERY_FROM)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-cream/60">Букеты: {formatPrice(subtotal)}</p>
                  <p className="text-[12px] text-cream/60">Итого</p>
                  <p className="font-display text-3xl">{formatPrice(total)}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="lg:col-span-5">
            <div className="rounded-3xl border border-ink/5 bg-card/70 p-7">
              <p className="label-caps mb-5">Детали доставки</p>
              <div className="flex flex-col gap-4">
                <input
                  required
                  placeholder="Имя"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-sm placeholder:text-inksoft focus:border-ink/40 focus:outline-none"
                />
                <input
                  required
                  type="tel"
                  placeholder="Телефон"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-sm placeholder:text-inksoft focus:border-ink/40 focus:outline-none"
                />
                <input
                  required
                  placeholder="Адрес в Москве"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-sm placeholder:text-inksoft focus:border-ink/40 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    aria-label="Дата доставки"
                    value={form.delivery_date}
                    onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                    className="rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-sm focus:border-ink/40 focus:outline-none"
                  />
                  <select
                    aria-label="Время доставки"
                    value={form.delivery_slot}
                    onChange={(e) => setForm({ ...form, delivery_slot: e.target.value })}
                    className="rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-sm focus:border-ink/40 focus:outline-none"
                  >
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  rows={3}
                  placeholder="Комментарий: подъезд, открытка, пожелания"
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-sm placeholder:text-inksoft focus:border-ink/40 focus:outline-none"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="mt-2 rounded-full bg-petaldeep px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-petal disabled:opacity-60"
                >
                  {state === "sending" ? "Отправляем…" : `Оформить заявку · ${formatPrice(total)}`}
                </button>
                <p className="text-[11px] leading-relaxed text-inksoft">
                  Нажимая кнопку, вы соглашаетесь с{" "}
                  <Link to="/privacy" className="underline underline-offset-2">
                    политикой конфиденциальности
                  </Link>{" "}
                  и{" "}
                  <Link to="/offer" className="underline underline-offset-2">
                    условиями оферты
                  </Link>
                  .
                </p>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
