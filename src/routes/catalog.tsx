import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/catalog")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => ({
    meta: [
      { title: "Каталог лилий — сорта и композиции · Лилия, Москва" },
      {
        name: "description",
        content:
          "Ориентальные и азиатские лилии, пастельные композиции с эвкалиптом. Цены от 880 ₽ за букет, доставка по Москве.",
      },
      { property: "og:title", content: "Каталог лилий · Лилия, Москва" },
      {
        property: "og:description",
        content: "Сорта лилий и авторские композиции мастерской «Лилия» с доставкой по Москве.",
      },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const [filter, setFilter] = useState<string>("Все");

  const kinds = ["Все", ...Array.from(new Set(products.map((p) => p.kind)))];
  const visible = filter === "Все" ? products : products.filter((p) => p.kind === filter);

  return (
    <section className="mx-auto max-w-[1360px] px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps mb-2">Сезонная витрина</p>
          <h1 className="font-display text-4xl text-ink">Каталог лилий</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-inksoft">Фильтр:</span>
          {kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setFilter(kind)}
              className={`rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                filter === kind ? "bg-ink text-cream" : "bg-paper text-ink hover:bg-petal/50"
              }`}
            >
              {kind}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-inksoft">В этой категории пока нет позиций.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
