ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('android', 'ios'));
