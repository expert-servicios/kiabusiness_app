-- Add email column to profiles (email lives in auth.users; this is a searchable copy)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
