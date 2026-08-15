-- ============================================================
-- FIX MY ROAD - SINGLE CONSOLIDATED MASTER SQL SCRIPT
-- Run this complete file once in Supabase -> SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 2. CLEANUP PREVIOUS TRIGGERS, FUNCTIONS & POLICIES
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.handle_verified_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.validate_admin_signup_code(text) CASCADE;
DROP FUNCTION IF EXISTS public.upgrade_to_admin(text) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- ------------------------------------------------------------
-- 3. TABLE DEFINITIONS
-- ------------------------------------------------------------

-- User Profiles (Linked directly to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Access Codes
CREATE TABLE IF NOT EXISTS public.admin_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Municipal Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aggregated Incidents
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  problem_type TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open',
  description TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT,
  landmark TEXT,
  locality TEXT,
  ward TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  report_count INTEGER NOT NULL DEFAULT 1,
  first_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Citizen Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  duplicate_of_report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  problem_type TEXT DEFAULT 'general',
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT,
  landmark TEXT,
  locality TEXT,
  ward TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  source_type TEXT NOT NULL DEFAULT 'web',
  processing_state TEXT NOT NULL DEFAULT 'pending',
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  ml_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Report Media
CREATE TABLE IF NOT EXISTS public.report_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  storage_bucket TEXT NOT NULL DEFAULT 'report-media',
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deduplication Decisions Audit Log
CREATE TABLE IF NOT EXISTS public.dedupe_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  matched_incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  decision TEXT NOT NULL CHECK (decision IN ('new', 'linked', 'duplicate', 'rejected', 'review')),
  decided_by TEXT NOT NULL CHECK (decided_by IN ('system', 'ML', 'human')),
  final_score NUMERIC,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incident Assignments
CREATE TABLE IF NOT EXISTS public.incident_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Incident Status History
CREATE TABLE IF NOT EXISTS public.incident_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 4. INDEXES & SEED DATA
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_incidents_lat_lng ON public.incidents(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_lat_lng ON public.reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_incident_id ON public.reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_report_media_report_id ON public.report_media(report_id);
CREATE INDEX IF NOT EXISTS idx_assignments_incident_id ON public.incident_assignments(incident_id);

-- Seed default admin code hash for 'ADMIN2024FIX'
INSERT INTO public.admin_access_codes (code_hash)
VALUES (crypt('ADMIN2024FIX', gen_salt('bf', 12)))
ON CONFLICT (code_hash) DO NOTHING;

-- Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-media', 'report-media', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 5. FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------

-- Check if current authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Validate admin signup code
CREATE OR REPLACE FUNCTION public.validate_admin_signup_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_match BOOLEAN := FALSE;
BEGIN
  IF p_code IS NULL OR TRIM(p_code) = '' THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_access_codes
    WHERE is_active = TRUE
      AND code_hash = crypt(TRIM(p_code), code_hash)
  ) INTO v_match;

  RETURN v_match;
END;
$$;

-- Upgrade authenticated user to admin
CREATE OR REPLACE FUNCTION public.upgrade_to_admin(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_valid BOOLEAN;
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  v_valid := public.validate_admin_signup_code(p_code);
  IF v_valid THEN
    UPDATE public.profiles
    SET role = 'admin', updated_at = now()
    WHERE id = v_uid;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Verified user profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_verified_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_requested_role TEXT;
  v_final_role TEXT := 'client';
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  THEN
    v_requested_role := COALESCE(NEW.raw_user_meta_data->>'requested_role', NEW.raw_user_meta_data->>'role');
    IF v_requested_role = 'admin' THEN
      v_final_role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone',
      v_final_role
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, profiles.phone);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_verified_user();

-- Haversine distance calculator
CREATE OR REPLACE FUNCTION haversine_distance_meters(
  lat1 NUMERIC, lng1 NUMERIC,
  lat2 NUMERIC, lng2 NUMERIC
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  r CONSTANT DOUBLE PRECISION := 6371000;
  dlat DOUBLE PRECISION;
  dlng DOUBLE PRECISION;
  a DOUBLE PRECISION;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN 99999999;
  END IF;
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);
  a := SIN(dlat / 2) * SIN(dlat / 2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlng / 2) * SIN(dlng / 2);
  RETURN r * 2 * ATAN2(SQRT(a), SQRT(1 - a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Multi-Factor Report Deduplication & Incident Aggregation Function
CREATE OR REPLACE FUNCTION process_report_deduplication(
  p_report_id UUID,
  p_radius_meters DOUBLE PRECISION DEFAULT 500.0
)
RETURNS UUID AS $$
DECLARE
  v_report RECORD;
  v_matching_incident_id UUID;
  v_new_incident_id UUID;
BEGIN
  SELECT * INTO v_report FROM reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report % not found', p_report_id;
  END IF;

  -- Search for existing active incident matching problem_type, locality/city or geographical proximity
  SELECT id INTO v_matching_incident_id
  FROM incidents
  WHERE status IN ('open', 'assigned', 'in_progress')
    AND (
      (
        LOWER(COALESCE(problem_type, 'general')) = LOWER(COALESCE(v_report.problem_type, 'general'))
        AND (
          (v_report.locality IS NOT NULL AND LOWER(COALESCE(locality, '')) = LOWER(v_report.locality)) OR
          (v_report.city IS NOT NULL AND LOWER(COALESCE(city, '')) = LOWER(v_report.city)) OR
          haversine_distance_meters(latitude, longitude, v_report.latitude, v_report.longitude) <= p_radius_meters
        )
      )
      OR
      haversine_distance_meters(latitude, longitude, v_report.latitude, v_report.longitude) <= p_radius_meters
    )
  ORDER BY 
    CASE WHEN LOWER(COALESCE(problem_type, 'general')) = LOWER(COALESCE(v_report.problem_type, 'general')) THEN 0 ELSE 1 END,
    haversine_distance_meters(latitude, longitude, v_report.latitude, v_report.longitude) ASC
  LIMIT 1;

  IF v_matching_incident_id IS NOT NULL THEN
    -- Link duplicate report to existing incident
    UPDATE reports 
    SET incident_id = v_matching_incident_id,
        is_duplicate = TRUE,
        processing_state = 'linked',
        updated_at = now()
    WHERE id = p_report_id;

    UPDATE incidents
    SET report_count = report_count + 1,
        last_reported_at = now(),
        severity = CASE 
          WHEN v_report.severity = 'critical' THEN 'critical'
          WHEN v_report.severity = 'high' AND severity IN ('low', 'medium') THEN 'high'
          WHEN v_report.severity = 'medium' AND severity = 'low' THEN 'medium'
          ELSE severity
        END,
        updated_at = now()
    WHERE id = v_matching_incident_id;

    INSERT INTO dedupe_decisions (
      report_id, matched_incident_id, decision, decided_by, reason
    ) VALUES (
      p_report_id, v_matching_incident_id, 'linked', 'system', 'Linked via multi-factor category/locality/proximity matching'
    );

    RETURN v_matching_incident_id;
  ELSE
    -- Create new aggregated incident
    INSERT INTO incidents (
      title, problem_type, severity, status, description,
      latitude, longitude, address, landmark, locality, ward, city, district, state, pincode,
      report_count, first_reported_at, last_reported_at
    ) VALUES (
      COALESCE(v_report.address, 'Reported Issue'),
      COALESCE(v_report.problem_type, 'general'),
      COALESCE(v_report.severity, 'medium'),
      'open',
      v_report.description,
      v_report.latitude, v_report.longitude,
      v_report.address, v_report.landmark, v_report.locality, v_report.ward, v_report.city, v_report.district, v_report.state, v_report.pincode,
      1, v_report.created_at, v_report.created_at
    ) RETURNING id INTO v_new_incident_id;

    UPDATE reports 
    SET incident_id = v_new_incident_id,
        is_duplicate = FALSE,
        processing_state = 'processed',
        updated_at = now()
    WHERE id = p_report_id;

    INSERT INTO dedupe_decisions (
      report_id, matched_incident_id, decision, decided_by, reason
    ) VALUES (
      p_report_id, v_new_incident_id, 'new', 'system', 'Created new incident'
    );

    RETURN v_new_incident_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow user profile access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Incidents RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select incidents" ON public.incidents;
DROP POLICY IF EXISTS "Authenticated can view incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can manage incidents" ON public.incidents;

CREATE POLICY "Authenticated can view incidents"
ON public.incidents FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage incidents"
ON public.incidents FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Reports RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Citizen reports access" ON public.reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

CREATE POLICY "Users can insert own reports"
ON public.reports FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own reports"
ON public.reports FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own reports"
ON public.reports FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Report Media RLS
ALTER TABLE public.report_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Report media access" ON public.report_media;
DROP POLICY IF EXISTS "Users can view own report media" ON public.report_media;
DROP POLICY IF EXISTS "Users can insert own report media" ON public.report_media;
DROP POLICY IF EXISTS "Users can delete own report media" ON public.report_media;

CREATE POLICY "Users can view own report media"
ON public.report_media FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_media.report_id
      AND (r.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Users can insert own report media"
ON public.report_media FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_media.report_id
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own report media"
ON public.report_media FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_media.report_id
      AND (r.user_id = auth.uid() OR public.is_admin())
  )
);

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Notifications access" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users and Admins can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Dedupe Decisions RLS
ALTER TABLE public.dedupe_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dedupe decisions access" ON public.dedupe_decisions;
DROP POLICY IF EXISTS "Admins can view dedupe decisions" ON public.dedupe_decisions;

CREATE POLICY "Admins can view dedupe decisions"
ON public.dedupe_decisions FOR SELECT TO authenticated
USING (public.is_admin());

-- Incident Assignments RLS
ALTER TABLE public.incident_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Incident assignments access" ON public.incident_assignments;
DROP POLICY IF EXISTS "Admins can manage incident assignments" ON public.incident_assignments;

CREATE POLICY "Admins can manage incident assignments"
ON public.incident_assignments FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Incident Status History RLS
ALTER TABLE public.incident_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Incident history access" ON public.incident_status_history;
DROP POLICY IF EXISTS "Admins can view incident history" ON public.incident_status_history;
DROP POLICY IF EXISTS "Admins can create incident history" ON public.incident_status_history;

CREATE POLICY "Admins can view incident history"
ON public.incident_status_history FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can create incident history"
ON public.incident_status_history FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- User Preferences RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
