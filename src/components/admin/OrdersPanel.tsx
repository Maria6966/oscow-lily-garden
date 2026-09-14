import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Copy, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/shop";
import { inputClass, STATUS_STYLE, STATUSES, type Order } from "./types";

/** Заказы: сводка, фильтры, состав и статусы. */
export function OrdersPanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const orders = ordersQuery.data ?? [];

  const stats = useMemo(() => {
    const monthAgo = Date.now() - 30 * 24 * 3600 * 1000;
    return {
      new: orders.filter((o) => o.status === "new").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      revenue: orders
        .filter((o) => o.status !== "cancelled" && new Date(o.created_at).getTime() >= monthAgo)
        .reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (!q ||
          o.customer_name.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.address.toLowerCase().includes(q)),
    );
  }, [orders, status, search]);

  const setOrderStatus = async (id: string, next: string) => {
    await supabase.from("orders").update({ status: next }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  const remove = async (order: Order) => {
    if (!confirm(`Удалить заказ ${order.customer_name}?`)) return;
    await supabase.from("orders").delete().eq("id", order.id);
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Новые" value={String(stats.new)} />
        <Tile label="Подтверждены" value={String(stats.confirmed)} />
        <Tile label="Доставлены" value={String(stats.delivered)} />
        <Tile label="Сумма за 30 дней" value={formatPrice(stats.revenue)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} max-w-[200px]`}>
          <option value="all">Все статусы</option>
          {Object.entries(STATUSES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Имя, телефон или адрес"
          className={`${inputClass} max-w-xs`}
        />
        <span className="text-[12px] text-inksoft">{visible.length} из {orders.length}</span>
      </div>

      {ordersQuery.isLoading ? (
        <p className="text-[13px] text-inksoft">Загружаем заказы…</p>
      ) : visible.length === 0 ? (
        <p className="text-[13px] text-inksoft">Заказов пока нет.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => {
            const expanded = open === order.id;
            return (
              <article key={order.id} className="rounded-2xl border border-ink/5 bg-card/70 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] ${STATUS_STYLE[order.status] ?? ""}`}>
                    {STATUSES[order.status] ?? order.status}
                  </span>
                  <p className="font-medium text-ink">{order.customer_name}</p>
                  <a href={`tel:${order.phone.replace(/[^+\d]/g, "")}`} className="text-[13px] text-inksoft hover:text-ink">
                    {order.phone}
                  </a>
                  <span className="text-[13px] font-medium text-ink">{formatPrice(order.total)}</span>
                  <span className="ml-auto text-[12px] text-inksoft">
                    {new Date(order.created_at).toLocaleString("ru-RU")}
                  </span>
                  <button
                    type="button"
                    aria-label="Подробности заказа"
                    onClick={() => setOpen(expanded ? null : order.id)}
                    className="rounded-full border border-ink/15 p-1.5 text-inksoft hover:text-ink"
                  >
                    <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {expanded && (
                  <div className="mt-4 grid gap-4 border-t border-ink/5 pt-4 text-[13px] lg:grid-cols-2">
                    <div>
                      <p className="label-caps mb-2">Доставка</p>
                      <p className="text-ink">{order.address}</p>
                      <p className="text-inksoft">
                        {order.delivery_date ?? "дата не указана"}
                        {order.delivery_slot ? `, ${order.delivery_slot}` : ""}
                      </p>
                      <p className="mt-1 text-inksoft">
                        Доставка:{" "}
                        {order.delivery_price === 0 ? "бесплатно" : formatPrice(order.delivery_price)}
                      </p>
                      {order.comment && <p className="mt-2 italic text-inksoft">«{order.comment}»</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(order.address)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 text-[12px] text-inksoft hover:text-ink"
                        >
                          <Copy className="size-3.5" /> Скопировать адрес
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(order)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 text-[12px] text-inksoft hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" /> Удалить заказ
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="label-caps mb-2">Состав</p>
                      <ul className="space-y-1">
                        {(order.items ?? []).map((item, index) => (
                          <li key={index} className="flex justify-between gap-3 text-inksoft">
                            <span>
                              {item.name} ×{item.qty}
                            </span>
                            <span className="text-ink">{formatPrice(item.price * item.qty)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 flex justify-between border-t border-ink/5 pt-2 font-medium text-ink">
                        <span>Итого</span>
                        <span>{formatPrice(order.total)}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(STATUSES).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setOrderStatus(order.id, value)}
                            className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
                              order.status === value
                                ? STATUS_STYLE[value]
                                : "border border-ink/15 text-inksoft hover:text-ink"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
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

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-card/70 p-4">
      <p className="label-caps mb-1">{label}</p>
      <p className="font-display text-3xl text-ink">{value}</p>
    </div>
  );
}
