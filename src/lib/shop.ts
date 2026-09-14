import stargazer from "@/assets/lily-stargazer.jpg";
import concord from "@/assets/lily-concord.jpg";
import goldenSpring from "@/assets/lily-golden-spring.jpg";
import violetVelvet from "@/assets/lily-violet-velvet.jpg";
import atelier from "@/assets/lily-atelier.jpg";
import morningBreeze from "@/assets/lily-morning-breeze.jpg";
import royalPink from "@/assets/lily-royal-pink.jpg";
import gardenMilk from "@/assets/lily-garden-milk.jpg";

export type Product = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  color: string;
  description: string;
  price: number;
  stems: number;
  height_cm: number;
  vase_days: number;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

const bundled: Record<string, string> = {
  stargazer,
  concord,
  "golden-spring": goldenSpring,
  "violet-velvet": violetVelvet,
  atelier,
  "morning-breeze": morningBreeze,
  "royal-pink": royalPink,
  "garden-milk": gardenMilk,
};

/** Публичный адрес фотографии, загруженной в хранилище магазина. */
export function storageImageUrl(path: string) {
  return `/api/public/product-image/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Картинка товара: загруженное фото, встроенная фотография ателье либо внешняя ссылка. */
export function productImage(product: { image_url?: string | null; slug?: string }) {
  const key = product.image_url ?? "";
  if (key.startsWith("storage:")) return storageImageUrl(key.slice("storage:".length));
  if (bundled[key]) return bundled[key];
  if (product.slug && bundled[product.slug]) return bundled[product.slug];
  if (key.startsWith("http")) return key;
  return atelier;
}


export const KINDS = ["Ориентальная", "Азиатская", "Смесовая", "Композиция"];

export const DELIVERY_PRICE = 500;
export const FREE_DELIVERY_FROM = 5000;

export function deliveryPrice(subtotal: number) {
  return subtotal >= FREE_DELIVERY_FROM || subtotal === 0 ? 0 : DELIVERY_PRICE;
}

export function formatPrice(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}
