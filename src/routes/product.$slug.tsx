import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { productsQuery } from "@/lib/queries";
import { formatPrice, productImage } from "@/lib/shop";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: ({ params }) => ({
    meta: [
      { title: `Лилия ${params.slug} — купить букет в Москве · Лилия` },
      {
        name: "description",
        content:
          "Свежесрезанный букет лилий из мастерской «Лилия»: состав, высота стебля, стойкость и доставка по Москве.",
      },
      { property: "og:title", content: "Букет лилий · Лилия, Москва" },
      {
        property: "og:description",
        content: "Состав букета, высота стебля и стойкость. Доставка по Москве за 24 часа.",
      },
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-[1360px] px-6 py-20 text-center">
      <h1 className="font-display text-4xl text-ink">Сорт не найден</h1>
      <p className="mt-3 text-inksoft">Возможно, он уже не в сезоне.</p>
      <Link
        to="/catalog"
        className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm text-cream hover:bg-inksoft"
      >
        В каталог
      </Link>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const product = products.find((p) => p.slug === slug);
  if (!product) throw notFound();

  const others = products.filter((p) => p.slug !== slug).slice(0, 4);

  return (
    <>
      <section className="bg-paper/60">
        <div className="mx-auto max-w-[1360px] px-6 py-14">
          <Link to="/catalog" className="text-[12px] text-inksoft hover:text-ink">
            ← Каталог
          </Link>
          <div className="mt-4 grid items-center gap-10 lg:grid-cols-2">
            <img
              src={productImage(product)}
              alt={`Букет лилий ${product.name}`}
              width={912}
              height={912}
              className="aspect-square w-full rounded-3xl object-cover"
            />
            <div>
              <p className="label-caps">{product.kind}</p>
              <h1 className="mt-2 font-display text-5xl text-ink">{product.name}</h1>
              <p className="mt-2 font-display text-3xl text-petaldeep">
                {formatPrice(product.price)}{" "}
                <span className="font-sans text-base text-inksoft">
                  за букет из {product.stems} стеблей
                </span>
              </p>
              <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-inksoft">
                {product.description}
              </p>

              <dl className="mt-6 grid max-w-md grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
                <div className="flex justify-between border-b border-ink/10 pb-1">
                  <dt className="text-inksoft">Высота стебля</dt>
                  <dd className="font-medium text-ink">{product.height_cm} см</dd>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-1">
                  <dt className="text-inksoft">Стеблей в букете</dt>
                  <dd className="font-medium text-ink">{product.stems}</dd>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-1">
                  <dt className="text-inksoft">Стойкость</dt>
                  <dd className="font-medium text-ink">{product.vase_days} дней</dd>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-1">
                  <dt className="text-inksoft">Оттенок</dt>
                  <dd className="font-medium text-ink">{product.color}</dd>
                </div>
              </dl>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <div className="flex items-center overflow-hidden rounded-full border border-ink/20">
                  <button
                    type="button"
                    aria-label="Убрать один букет"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-4 py-2 text-sm text-ink hover:bg-paper"
                  >
                    −
                  </button>
                  <span className="min-w-[3ch] px-2 text-center text-sm">{qty}</span>
                  <button
                    type="button"
                    aria-label="Добавить один букет"
                    onClick={() => setQty((q) => q + 1)}
                    className="px-4 py-2 text-sm text-ink hover:bg-paper"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    add(
                      {
                        slug: product.slug,
                        name: product.name,
                        kind: product.kind,
                        stems: product.stems,
                        price: product.price,
                      },
                      qty,
                    );
                    setAdded(true);
                  }}
                  className="rounded-full bg-ink px-8 py-3 text-sm text-cream transition-colors hover:bg-inksoft"
                >
                  Добавить в корзину · {formatPrice(product.price * qty)}
                </button>
                {added && (
                  <Link
                    to="/cart"
                    className="rounded-full border border-ink/20 px-6 py-3 text-sm text-ink hover:bg-cream"
                  >
                    Перейти в корзину
                  </Link>
                )}
              </div>
              <p className="mt-4 text-[12px] text-inksoft">
                Доставка по Москве за 24 часа · оплата курьеру при получении
              </p>
            </div>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="mx-auto max-w-[1360px] px-6 py-12">
          <h2 className="mb-6 font-display text-3xl text-ink">Смотрите также</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {others.map((p) => (
              <Link
                key={p.id}
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="rounded-2xl border border-ink/5 bg-card/70 p-3 transition-colors hover:border-petaldeep/40"
              >
                <img
                  src={productImage(p)}
                  alt={`Букет лилий ${p.name}`}
                  loading="lazy"
                  width={912}
                  height={912}
                  className="mb-3 aspect-square w-full rounded-xl object-cover"
                />
                <h3 className="font-display text-xl text-ink">{p.name}</h3>
                <p className="text-[13px] text-inksoft">{formatPrice(p.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
