CREATE TABLE public.investment_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email text NOT NULL CHECK (char_length(email) <= 255),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 30),
  company text CHECK (company IS NULL OR char_length(company) <= 120),
  message text CHECK (message IS NULL OR char_length(message) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.investment_inquiries TO service_role;
ALTER TABLE public.investment_inquiries ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.set_investment_inquiries_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER investment_inquiries_updated_at BEFORE UPDATE ON public.investment_inquiries FOR EACH ROW EXECUTE FUNCTION public.set_investment_inquiries_updated_at();