import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";

const nav = [
  { to: "/catalog", label: "Каталог" },
  { to: "/delivery", label: "Доставка" },
  { to: "/privacy", label: "Конфиденциальность" },
  { to: "/offer", label: "Оферта" },
] as const;

export function SiteHeader() {
  const { count } = useCart();

  return (
    <header className="border-b border-ink/10 bg-cream">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tracking-tight text-ink">
            Лилия<span className="text-petaldeep">.</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-inksoft">Москва</span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] text-inksoft md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="transition-colors hover:text-ink"
              activeProps={{ className: "text-ink" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/cart"
          className="rounded-full border border-ink/20 px-4 py-2 text-[13px] text-ink transition-colors hover:bg-ink hover:text-cream"
        >
          Корзина{count > 0 ? ` · ${count}` : ""}
        </Link>
      </div>
    </header>
  );
}
