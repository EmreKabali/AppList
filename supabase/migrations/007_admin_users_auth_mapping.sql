ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_users_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.admin_users
    ADD CONSTRAINT admin_users_auth_user_id_fkey
    FOREIGN KEY (auth_user_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_auth_user_id
ON public.admin_users(auth_user_id)
WHERE auth_user_id IS NOT NULL;
