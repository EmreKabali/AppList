ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS submission_type TEXT NOT NULL DEFAULT 'test' CHECK (submission_type IN ('test', 'live')),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS icon_url TEXT;
