-- Apps RLS Policies

-- Policy: Public users can only see approved apps
CREATE POLICY "Public can view approved apps"
    ON public.apps FOR SELECT
    USING (status = 'approved');

-- Policy: Admins can view all apps
CREATE POLICY "Admins can view all apps"
    ON public.apps FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid()
        )
    );

-- Policy: Authenticated users can create apps
CREATE POLICY "Authenticated users can create apps"
    ON public.apps FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Admins can update any app
CREATE POLICY "Admins can update apps"
    ON public.apps FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid()
        )
    );

-- Policy: Admins can delete apps
CREATE POLICY "Admins can delete apps"
    ON public.apps FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid()
        )
    );

-- Admin Users RLS Policies

-- Policy: Only super admins can manage admin users
CREATE POLICY "Super admins can manage admin users"
    ON public.admin_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.id = auth.uid()
            AND au.role = 'super_admin'
        )
    );

-- Policy: Admins can view admin users list
CREATE POLICY "Admins can view admin users"
    ON public.admin_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid()
        )
    );
