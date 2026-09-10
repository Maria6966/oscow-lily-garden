CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'Ориентальная',
  color text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  stems integer NOT NULL DEFAULT 5,
  height_cm integer NOT NULL DEFAULT 60,
  vase_days integer NOT NULL DEFAULT 10,
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  delivery_date date,
  delivery_slot text NOT NULL DEFAULT '',
  comment text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_price integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders public create" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.products (slug, name, kind, color, description, price, stems, height_cm, vase_days, image_url, sort_order) VALUES
('stargazer','Старгейтер','Ориентальная','Белый','Королева аромата. Крупные белые лепестки с нежным розовым отливом и характерным «звёздным» горлом.',1200,5,60,12,'stargazer',1),
('concord','Конкорд','Азиатская','Розовый','Плотные розовые бутоны почти без аромата — деликатный вариант для дома и офиса.',950,5,45,10,'concord',2),
('golden-spring','Голден Спринг','Смесовая','Золотистый','Золотисто-жёлтые лепестки с тёплым медовым тоном. Самый весенний сорт нашей витрины.',1100,5,55,11,'golden-spring',3),
('violet-velvet','Вайолет Вельвет','Ориентальная','Сливовый','Глубокий сливовый цвет с бархатной текстурой лепестка и тёмной серединой.',1450,5,60,12,'violet-velvet',4),
('atelier','Букет Ателье','Композиция','Пастельный микс','Сборный букет из десяти пастельных стеблей: белые, розовые и кремовые лилии в крафте.',2300,10,55,10,'atelier',5),
('morning-breeze','Морнинг Бриз','Азиатская','Бледно-розовый','Едва раскрытые бутоны бледно-розового тона — букет распустится у вас на глазах.',880,5,40,10,'morning-breeze',6),
('royal-pink','Роял Пинк','Ориентальная','Розовый','Редкий высокий сорт с крупным цветком и насыщенным ароматом. Ограниченная срезка.',1600,5,65,12,'royal-pink',7),
('garden-milk','Гарден Милк','Композиция','Белый + эвкалипт','Двенадцать белых стеблей с ветками эвкалипта — воздушная композиция для больших ваз.',2750,12,60,11,'garden-milk',8);