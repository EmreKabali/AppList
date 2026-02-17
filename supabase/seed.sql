-- Seed data for development

-- Insert super admin (password: admin123 - hashed with bcrypt)
-- Note: In production, use proper password hashing
INSERT INTO public.admin_users (email, password_hash, role, created_by)
VALUES (
    'muhammett.celebi@gmail.com',
    '$2a$10$YourBcryptHashHereReplaceInProduction',
    'super_admin',
    '00000000-0000-0000-0000-000000000000'::UUID
) ON CONFLICT (email) DO NOTHING;

-- Sample apps for testing
INSERT INTO public.apps (name, play_url, test_url, status, start_date, created_by)
VALUES
    ('Sample App 1', 'https://play.google.com/store/apps/details?id=com.sample1', 'https://test.example.com/app1', 'approved', '2024-01-15', '00000000-0000-0000-0000-000000000000'::UUID),
    ('Sample App 2', 'https://play.google.com/store/apps/details?id=com.sample2', NULL, 'pending', '2024-02-01', '00000000-0000-0000-0000-000000000000'::UUID)
ON CONFLICT DO NOTHING;
