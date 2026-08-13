-- Secure Database Trigger for Profile Creation on Email Verification
-- Run this script in your Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.handle_verified_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Only create profile when email_confirmed_at becomes non-null
  IF NEW.email_confirmed_at IS NOT NULL
     AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  THEN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      NEW.raw_user_meta_data->>'phone',
      'client'  -- ALWAYS default to 'client', never trust metadata for role
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;

CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_verified_user();
