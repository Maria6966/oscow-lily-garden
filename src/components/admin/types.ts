export type OrderItem = { name: string; qty: number; price: number };

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  delivery_date: string | null;
  delivery_slot: string;
  comment: string;
  items: OrderItem[];
  delivery_price: number;
  total: number;
  status: string;
  created_at: string;
};

export const STATUSES: Record<string, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  delivered: "Доставлена",
  cancelled: "Отменена",
};

export const STATUS_STYLE: Record<string, string> = {
  new: "bg-petal/40 text-ink",
  confirmed: "bg-butter/50 text-ink",
  delivered: "bg-sage/50 text-ink",
  cancelled: "bg-ink/10 text-inksoft",
};

export const inputClass =
  "w-full rounded-xl border border-ink/15 bg-cream/60 px-3 py-2 text-[13px] text-ink focus:border-ink/40 focus:outline-none";
