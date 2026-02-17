-- Apps table
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    play_url TEXT,
    test_url TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_apps_status ON public.apps(status);
CREATE INDEX idx_apps_created_at ON public.apps(created_at DESC);
CREATE INDEX idx_apps_created_by ON public.apps(created_by);

-- Enable RLS
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
