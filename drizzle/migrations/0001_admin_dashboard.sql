-- Brands
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brands TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active brands" ON public.brands FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.brands (name) SELECT DISTINCT brand FROM public.products WHERE brand <> '' ON CONFLICT DO NOTHING;

-- Low-stock threshold per product
ALTER TABLE public.products ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0);

-- Admin allowlist: only editable by the project owner via backend SQL (no client grants, no policies).
CREATE TABLE public.admin_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_allowlist TO service_role;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

-- A signed-in user with a VERIFIED email that is on the allowlist can claim admin.
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _email text; _confirmed timestamptz;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  SELECT email, email_confirmed_at INTO _email, _confirmed FROM auth.users WHERE id = _uid;
  IF _confirmed IS NULL OR NOT EXISTS (SELECT 1 FROM public.admin_allowlist a WHERE lower(a.email) = lower(_email)) THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

-- Guard order updates made through the app: admins may only change fulfilment status.
CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN RETURN NEW; END IF; -- server/service code
  IF NEW.paid_at IS DISTINCT FROM OLD.paid_at OR NEW.payment_provider IS DISTINCT FROM OLD.payment_provider
     OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference OR NEW.total <> OLD.total
     OR NEW.subtotal <> OLD.subtotal OR NEW.shipping <> OLD.shipping OR NEW.user_id <> OLD.user_id
     OR NEW.order_number <> OLD.order_number OR NEW.shipping_address IS DISTINCT FROM OLD.shipping_address THEN
    RAISE EXCEPTION 'Only fulfilment status can be changed here';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('paid', 'refunded', 'pending_payment') THEN
      RAISE EXCEPTION 'Payment status can only be changed by the payment provider';
    END IF;
    IF NEW.status IN ('processing', 'shipped', 'delivered') AND OLD.paid_at IS NULL THEN
      RAISE EXCEPTION 'Unpaid orders cannot be fulfilled';
    END IF;
    IF OLD.status IN ('delivered', 'cancelled', 'refunded') THEN
      RAISE EXCEPTION 'This order is closed';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_order_update BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();