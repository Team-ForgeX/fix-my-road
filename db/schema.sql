-- Essential SQL Schema for Fix My Road (Cost-Optimized & Minimal)
-- Only standard PostgreSQL features used (no expensive PostGIS/Vector extensions required)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Minimal User profiles table
-- Connected directly to auth.users(id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);




-- 2. Municipal Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Aggregated Incidents (Grouped issues)
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  problem_type TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
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

-- 4. Citizen Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  duplicate_of_report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
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

-- Idempotent column additions for existing installations
ALTER TABLE reports ADD COLUMN IF NOT EXISTS problem_type TEXT DEFAULT 'general';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ml_analysis JSONB;

-- 5. Uploaded Report Media Files
CREATE TABLE IF NOT EXISTS report_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  storage_bucket TEXT NOT NULL DEFAULT 'report-media',
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Deduplication Decisions Audit Log
CREATE TABLE IF NOT EXISTS dedupe_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  matched_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  decision TEXT NOT NULL CHECK (decision IN ('new', 'linked', 'duplicate', 'rejected', 'review')),
  decided_by TEXT NOT NULL CHECK (decided_by IN ('system', 'ML', 'human')),
  final_score NUMERIC,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Department & Officer Incident Assignments
CREATE TABLE IF NOT EXISTS incident_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 8. Status History Audit Log
CREATE TABLE IF NOT EXISTS incident_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Notifications for Citizens
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Standard Indexes (Fast & Low Storage Overhead)
CREATE INDEX IF NOT EXISTS idx_incidents_lat_lng ON incidents(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_lat_lng ON reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_incident_id ON reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

-- Lightweight Spatial Haversine Distance Function (Meters) - Pure SQL, Zero Cost Extensions
CREATE OR REPLACE FUNCTION haversine_distance_meters(
  lat1 NUMERIC, lng1 NUMERIC,
  lat2 NUMERIC, lng2 NUMERIC
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  r CONSTANT DOUBLE PRECISION := 6371000; -- Earth radius in meters
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

-- Automatic Multi-Factor Report Deduplication & Incident Aggregation
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

  -- Search for existing active incident matching problem_type, locality/city or geographical proximity (multi-factor score)
  SELECT id INTO v_matching_incident_id
  FROM incidents
  WHERE status IN ('open', 'assigned', 'in_progress')
    AND (
      -- 1. Exact or matching problem type in same locality/city or within proximity threshold
      (
        LOWER(COALESCE(problem_type, 'general')) = LOWER(COALESCE(v_report.problem_type, 'general'))
        AND (
          (v_report.locality IS NOT NULL AND LOWER(COALESCE(locality, '')) = LOWER(v_report.locality)) OR
          (v_report.city IS NOT NULL AND LOWER(COALESCE(city, '')) = LOWER(v_report.city)) OR
          haversine_distance_meters(latitude, longitude, v_report.latitude, v_report.longitude) <= p_radius_meters
        )
      )
      OR
      -- 2. Immediate geographical proximity regardless of text category label
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

-- Storage Bucket Setup (Safe & Idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-media', 'report-media', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS Enablement & Policies for Safe Multi-user Usage
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE dedupe_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active incidents
DROP POLICY IF EXISTS "Public select incidents" ON incidents;
CREATE POLICY "Public select incidents" ON incidents FOR SELECT USING (true);

-- Allow authenticated users to view profiles & insert their own
DROP POLICY IF EXISTS "Allow user profile access" ON public.profiles;
CREATE POLICY "Allow user profile access" ON public.profiles FOR ALL USING (true);

-- Allow citizens to insert & select reports
DROP POLICY IF EXISTS "Citizen reports access" ON reports;
CREATE POLICY "Citizen reports access" ON reports FOR ALL USING (true);

-- Allow access to report media
DROP POLICY IF EXISTS "Report media access" ON report_media;
CREATE POLICY "Report media access" ON report_media FOR ALL USING (true);

-- Allow access to dedupe decisions, incident history, assignments, and notifications
DROP POLICY IF EXISTS "Dedupe decisions access" ON dedupe_decisions;
CREATE POLICY "Dedupe decisions access" ON dedupe_decisions FOR ALL USING (true);

DROP POLICY IF EXISTS "Incident history access" ON incident_status_history;
CREATE POLICY "Incident history access" ON incident_status_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Incident assignments access" ON incident_assignments;
CREATE POLICY "Incident assignments access" ON incident_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Notifications access" ON notifications;
CREATE POLICY "Notifications access" ON notifications FOR ALL USING (true);

