CREATE INDEX IF NOT EXISTS idx_apps_status_submission_type
ON public.apps(status, submission_type);

CREATE INDEX IF NOT EXISTS idx_apps_status_submission_type_platform
ON public.apps(status, submission_type, platform);

CREATE INDEX IF NOT EXISTS idx_apps_status_submission_type_end_date
ON public.apps(status, submission_type, end_date);
