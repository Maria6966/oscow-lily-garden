import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto grid max-w-[1360px] gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-3xl">
            Лилия<span className="text-petaldeep">.</span>
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-cream/60">
            Флористическая мастерская в Москве. Редкие сорта лилий из собственных теплиц.
          </p>
        </div>
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-widest text-cream/50">Навигация</p>
          <ul className="space-y-2 text-[13px] text-cream/80">
            <li><Link to="/catalog" className="hover:text-cream">Каталог</Link></li>
            <li><Link to="/cart" className="hover:text-cream">Корзина</Link></li>
            <li><Link to="/delivery" className="hover:text-cream">Доставка</Link></li>
            <li><Link to="/admin" className="hover:text-cream">Витрина</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-widest text-cream/50">Документы</p>
          <ul className="space-y-2 text-[13px] text-cream/80">
            <li><Link to="/privacy" className="hover:text-cream">Политика конфиденциальности</Link></li>
            <li><Link to="/offer" className="hover:text-cream">Публичная оферта</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-widest text-cream/50">Контакты</p>
          <p className="text-[13px] leading-relaxed text-cream/80">
            Москва, ул. Флористов, 12
            <br />
            +7 (495) 123-45-67
            <br />
            hello@lilya.studio
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-2 px-6 py-5 text-[12px] text-cream/50">
          <p>© 2026 Лилия · Все права защищены</p>
          <p>Сделано с любовью к цветам · Москва</p>
        </div>
      </div>
    </footer>
  );
}
