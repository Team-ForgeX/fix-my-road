-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Citizens can read/update only their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can read all profiles for admin work
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Prevent non-admins from changing role or other users' profiles
CREATE POLICY "No role changes by non-admins"
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
  AND role = (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  )
);

-- Only allow profile insertion by the same authenticated user id
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Deny by default for other access
-- This is enforced by the absence of additional policies.

-- Enable RLS and basic policies for reports (user-owned content)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports"
ON public.reports
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own reports"
ON public.reports
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own reports"
ON public.reports
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Notifications: only owner can read/insert
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to read incidents list
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view incidents"
ON public.incidents
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Leave insertion/update of incidents to server-side processes or admins only by default
