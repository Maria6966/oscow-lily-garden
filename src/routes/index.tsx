import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { productsQuery } from "@/lib/queries";
import { formatPrice, FREE_DELIVERY_FROM } from "@/lib/shop";
import heroImage from "@/assets/hero-lilies.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => ({
    meta: [
      { title: "Лилия — свежие лилии с доставкой по Москве за 24 часа" },
      {
        name: "description",
        content:
          "Флористическая мастерская «Лилия»: ориентальные, азиатские лилии и пастельные композиции. Доставка по Москве от 500 ₽, бесплатно от 5 000 ₽.",
      },
      { property: "og:title", content: "Лилия — свежие лилии с доставкой по Москве" },
      {
        property: "og:description",
        content: "Редкие сорта лилий из собственных теплиц и доставка по Москве за 24 часа.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const featured = products.slice(0, 4);

  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto grid max-w-[1360px] gap-8 px-6 py-12 lg:grid-cols-12 lg:py-16">
          <div className="flex flex-col justify-center lg:col-span-5">
            <p className="label-caps mb-4">Флористическая мастерская · с 2019</p>
            <h1 className="font-display text-6xl leading-[0.95] text-ink lg:text-7xl">
              Лилии,
              <br />
              выращенные
              <br />
              с&nbsp;нежностью
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-inksoft">
              Редкие сорта из собственных теплиц. Свежие стебли к вашему порогу в Москве
              за&nbsp;24&nbsp;часа — доставка от&nbsp;500&nbsp;₽.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/catalog"
                className="rounded-full bg-ink px-7 py-3 text-sm text-cream transition-colors hover:bg-inksoft"
              >
                Смотреть каталог
              </Link>
              <Link
                to="/delivery"
                className="rounded-full border border-ink/20 px-7 py-3 text-sm text-ink transition-colors hover:bg-paper"
              >
                Условия доставки
              </Link>
            </div>
            <dl className="mt-10 flex gap-8">
              <div>
                <dd className="font-display text-3xl text-ink">120+</dd>
                <dt className="text-[11px] uppercase tracking-widest text-inksoft">
                  сортов в сезоне
                </dt>
              </div>
              <div>
                <dd className="font-display text-3xl text-ink">24ч</dd>
                <dt className="text-[11px] uppercase tracking-widest text-inksoft">
                  доставка по городу
                </dt>
              </div>
              <div>
                <dd className="font-display text-3xl text-ink">4.9</dd>
                <dt className="text-[11px] uppercase tracking-widest text-inksoft">
                  оценка 2 400 клиентов
                </dt>
              </div>
            </dl>
          </div>
          <div className="lg:col-span-7">
            <img
              src={heroImage}
              alt="Пастельные лилии в керамической вазе на льняной скатерти"
              width={1200}
              height={1312}
              className="aspect-[12/13] w-full rounded-3xl object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-6 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-caps mb-2">Сезонная витрина</p>
            <h2 className="font-display text-4xl text-ink">Букеты недели</h2>
          </div>
          <Link to="/catalog" className="text-[13px] text-inksoft underline underline-offset-4 hover:text-ink">
            Весь каталог
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-paper/60">
        <div className="mx-auto max-w-[1360px] px-6 py-14">
          <p className="label-caps mb-2">Как мы работаем</p>
          <h2 className="font-display text-4xl text-ink">Три шага до утреннего букета</h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Выбор сорта",
                d: "Каталог с фильтром по виду лилии, цвету и высоте стебля.",
              },
              {
                n: "02",
                t: "Срез и сборка",
                d: "Срезаем в ночь перед доставкой, ставим в прохладную воду, убираем пыльцу.",
              },
              {
                n: "03",
                t: "Доставка",
                d: `По Москве за 24 часа. Бесплатно при заказе от ${formatPrice(FREE_DELIVERY_FROM)}.`,
              },
            ].map((step) => (
              <li key={step.n} className="rounded-2xl border border-ink/5 bg-cream p-6">
                <p className="font-display text-3xl text-petaldeep">{step.n}</p>
                <h3 className="mt-3 font-display text-2xl text-ink">{step.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-inksoft">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
