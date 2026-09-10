import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности · Лилия, Москва" },
      {
        name: "description",
        content:
          "Как мастерская «Лилия» собирает и обрабатывает персональные данные покупателей: цели, состав данных, сроки хранения и права клиента.",
      },
      { property: "og:title", content: "Политика конфиденциальности · Лилия" },
      {
        property: "og:description",
        content: "Обработка персональных данных покупателей мастерской «Лилия».",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[820px] px-6 py-14">
      <p className="label-caps mb-2">Документы</p>
      <h1 className="font-display text-4xl text-ink">Политика конфиденциальности</h1>
      <p className="mt-3 text-[13px] text-inksoft">Редакция от 1 марта 2026 года</p>

      <div className="mt-8 space-y-8 text-[14px] leading-relaxed text-inksoft">
        <section>
          <h2 className="mb-2 font-display text-2xl text-ink">1. Общие положения</h2>
          <p>
            Политика описывает, как флористическая мастерская «Лилия» (далее — Продавец) обрабатывает
            персональные данные посетителей сайта. Оставляя заявку, вы подтверждаете согласие с
            условиями этой политики.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-2xl text-ink">2. Какие данные мы собираем</h2>
          <p>
            Имя, номер телефона, адрес доставки, желаемая дата и интервал доставки, комментарий к
            заказу. Мы не запрашиваем паспортные данные и не собираем платёжную информацию: оплата
            проходит при получении букета.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-2xl text-ink">3. Зачем нам эти данные</h2>
          <p>
            Только для обработки и доставки заказа: связаться с вами, согласовать состав букета,
            передать адрес курьеру и уточнить время. Рассылок без отдельного согласия мы не делаем.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-2xl text-ink">4. Передача третьим лицам</h2>
          <p>
            Данные передаются только курьеру, который выполняет вашу доставку, в минимально
            необходимом объёме. Мы не продаём и не передаём данные для рекламы.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-2xl text-ink">5. Хранение и защита</h2>
          <p>
            Заявки хранятся в защищённой базе с ограниченным доступом сотрудников мастерской не
            дольше трёх лет с момента заказа, после чего удаляются.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-2xl text-ink">6. Ваши права</h2>
          <p>
            Вы можете запросить сведения о своих данных, исправить их или потребовать удаления,
            написав на hello@lilya.studio или позвонив по телефону +7 (495) 123-45-67. Мы ответим в
            течение десяти рабочих дней.
          </p>
        </section>
      </div>
    </article>
  );
}
