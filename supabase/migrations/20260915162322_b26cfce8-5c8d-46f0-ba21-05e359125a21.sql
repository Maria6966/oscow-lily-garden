CREATE TABLE public.telegram_subscribers (
  chat_id BIGINT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_subscribers TO authenticated;
GRANT ALL ON public.telegram_subscribers TO service_role;
ALTER TABLE public.telegram_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage telegram subscribers" ON public.telegram_subscribers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;