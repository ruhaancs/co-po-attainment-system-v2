-- Production upgrade migration (run on existing Supabase project)
-- Safe to re-run: uses IF NOT EXISTS / conditional alters

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- PROFILES (users table = canonical profile store)
-- -----------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Expand profiles view
CREATE OR REPLACE VIEW profiles AS
  SELECT id, email, full_name, role, phone, is_active, avatar_url, email_verified_at, created_at, updated_at
  FROM users;

-- -----------------------------------------------------------------------------
-- TEACHER APPROVAL
-- -----------------------------------------------------------------------------
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS approval_status approval_status NOT NULL DEFAULT 'approved';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- New teacher registrations default to pending (via app); existing rows stay approved
UPDATE teachers SET approval_status = 'approved' WHERE approval_status IS NULL;

-- -----------------------------------------------------------------------------
-- ATTAINMENT RESULTS (rename from attainment_reports if exists)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attainment_reports')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attainment_results') THEN
    ALTER TABLE attainment_reports RENAME TO attainment_results;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS attainment_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id             UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  generated_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  report_title          TEXT NOT NULL,
  semester              TEXT NOT NULL,
  co_attainment         JSONB NOT NULL DEFAULT '[]',
  po_attainment         JSONB NOT NULL DEFAULT '[]',
  avg_co_attainment     DECIMAL(4,3),
  cos_met_count         INTEGER NOT NULL DEFAULT 0,
  cos_total_count       INTEGER NOT NULL DEFAULT 0,
  students_evaluated    INTEGER NOT NULL DEFAULT 0,
  notes                 TEXT,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attainment_results_course ON attainment_results(course_id);

-- -----------------------------------------------------------------------------
-- ROLE SYNC: auto-create teacher/student rows on signup & role change
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_role_extension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dept_id UUID;
BEGIN
  SELECT id INTO dept_id FROM departments ORDER BY created_at LIMIT 1;

  IF NEW.role = 'teacher' AND NOT EXISTS (SELECT 1 FROM teachers WHERE profile_id = NEW.id) THEN
    INSERT INTO teachers (profile_id, employee_id, department_id, approval_status)
    VALUES (
      NEW.id,
      'EMP-' || UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8)),
      dept_id,
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_sync_role_extension ON users;
CREATE TRIGGER users_sync_role_extension
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION sync_role_extension();

-- -----------------------------------------------------------------------------
-- UPDATED handle_new_user (registration metadata)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r user_role;
  fname TEXT;
BEGIN
  fname := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  r := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student');

  INSERT INTO users (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    fname,
    r,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  -- Student row if roll_number + program_id in metadata
  IF r = 'student'
     AND NEW.raw_user_meta_data->>'roll_number' IS NOT NULL
     AND NEW.raw_user_meta_data->>'program_id' IS NOT NULL THEN
    INSERT INTO students (profile_id, roll_number, program_id, batch_year)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'roll_number',
      (NEW.raw_user_meta_data->>'program_id')::UUID,
      COALESCE((NEW.raw_user_meta_data->>'batch_year')::INTEGER, EXTRACT(YEAR FROM NOW())::INTEGER)
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- RLS: attainment_results + teacher approval reads
-- -----------------------------------------------------------------------------
ALTER TABLE attainment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attainment_results_select" ON attainment_results;
CREATE POLICY "attainment_results_select" ON attainment_results
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "attainment_results_write" ON attainment_results;
CREATE POLICY "attainment_results_write" ON attainment_results
  FOR ALL USING (get_user_role() IN ('admin', 'teacher'));

-- Teachers: only approved can write courses/marks (optional strict mode)
DROP POLICY IF EXISTS "teachers_select_auth" ON teachers;
CREATE POLICY "teachers_select_auth" ON teachers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "teachers_update_admin" ON teachers;
CREATE POLICY "teachers_approve_admin" ON teachers FOR UPDATE
  USING (get_user_role() = 'admin');

-- Allow users to read own teacher approval status
DROP POLICY IF EXISTS "teachers_select_own" ON teachers;
CREATE POLICY "teachers_select_own" ON teachers FOR SELECT
  USING (profile_id = auth.uid());

-- Students can insert own row on registration (service role used in app instead)
DROP POLICY IF EXISTS "students_insert_own" ON students;
CREATE POLICY "students_insert_own" ON students FOR INSERT
  WITH CHECK (profile_id = auth.uid() AND get_user_role() = 'student');

-- -----------------------------------------------------------------------------
-- Allow public read programs/departments for registration dropdown
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "departments_select" ON departments;
CREATE POLICY "departments_select" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "programs_select" ON programs;
CREATE POLICY "programs_select" ON programs FOR SELECT USING (true);
