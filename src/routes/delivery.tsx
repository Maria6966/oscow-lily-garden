import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Доставка лилий по Москве — сроки и цены · Лилия" },
      {
        name: "description",
        content:
          "Доставка по Москве от 500 ₽, за МКАД до 30 км — 700 ₽, бесплатно от 5 000 ₽. Три интервала в день, оплата курьеру.",
      },
      { property: "og:title", content: "Доставка по Москве · Лилия" },
      {
        property: "og:description",
        content: "Сроки, интервалы и стоимость доставки букетов лилий по Москве.",
      },
    ],
  }),
  component: DeliveryPage,
});

const tariffs = [
  { price: "500 ₽", area: "По городу в пределах МКАД", note: "Три интервала: 9–13, 13–17, 17–21" },
  { price: "700 ₽", area: "За МКАД, до 30 км", note: "Интервал согласуем по телефону" },
  { price: "Бесплатно", area: "При заказе от 5 000 ₽", note: "Любой адрес в пределах зоны" },
];

function DeliveryPage() {
  return (
    <section className="mx-auto max-w-[1360px] px-6 py-14">
      <div className="grid gap-8 lg:grid-cols-3">
        <div>
          <p className="label-caps mb-2">Доставка</p>
          <h1 className="font-display text-4xl text-ink">Довезём свежим</h1>
          <p className="mt-4 text-[14px] leading-relaxed text-inksoft">
            Собственная курьерская служба по Москве и ближнему Подмосковью. Букеты едут в термокоробе
            с влажной губкой, чтобы стебли не пересохли и не помялись в пути.
          </p>
          <Link
            to="/catalog"
            className="mt-6 inline-flex rounded-full bg-ink px-7 py-3 text-sm text-cream hover:bg-inksoft"
          >
            Выбрать букет
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
          {tariffs.map((t) => (
            <div key={t.area} className="rounded-2xl border border-ink/5 bg-card/70 p-5">
              <p className="font-display text-2xl text-ink">{t.price}</p>
              <p className="mt-1 text-[12px] text-inksoft">{t.area}</p>
              <p className="mt-3 text-[12px] text-sagedeep">{t.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl bg-paper/60 p-8">
          <h2 className="font-display text-2xl text-ink">Сроки</h2>
          <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-inksoft">
            <li>Заявка до 16:00 — доставим на следующий день в выбранный интервал.</li>
            <li>Срочная доставка «в день заказа» — по согласованию с флористом, +500 ₽.</li>
            <li>Курьер звонит за час до приезда.</li>
          </ul>
        </div>
        <div className="rounded-3xl bg-paper/60 p-8">
          <h2 className="font-display text-2xl text-ink">Оплата</h2>
          <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-inksoft">
            <li>Наличными или картой курьеру при получении — без предоплаты.</li>
            <li>Для организаций — счёт и закрывающие документы.</li>
            <li>Если букет не понравился, заменим на месте или вернём деньги.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
