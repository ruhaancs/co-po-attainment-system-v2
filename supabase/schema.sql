-- =============================================================================
-- CO-PO Attainment System — Supabase PostgreSQL Schema
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- -----------------------------------------------------------------------------
-- USERS (extends Supabase Auth)
-- One row per auth.users account; role drives portal access
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'student',
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward-compatible view for existing app code referencing "profiles"
CREATE OR REPLACE VIEW profiles AS
  SELECT id, email, full_name, role, created_at FROM users;

-- -----------------------------------------------------------------------------
-- ORGANIZATION (supporting tables)
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE programs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  code            TEXT NOT NULL UNIQUE,
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TEACHERS
-- Extends users with role = 'teacher'
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE teachers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employee_id     TEXT NOT NULL UNIQUE,
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  designation     TEXT DEFAULT 'Assistant Professor',
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  joined_at       DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- STUDENTS
-- Extends users with role = 'student'
-- -----------------------------------------------------------------------------
CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  roll_number     TEXT NOT NULL UNIQUE,
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  batch_year      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- COURSES
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  credits         INTEGER NOT NULL DEFAULT 3 CHECK (credits > 0),
  semester        TEXT NOT NULL,
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  teacher_id      UUID REFERENCES teachers(id) ON DELETE SET NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code, semester)
);

-- Course Outcomes (CO) — required for co_po_mapping
CREATE TABLE course_outcomes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  co_number           TEXT NOT NULL,
  description         TEXT NOT NULL,
  target_attainment   DECIMAL(4,3) NOT NULL DEFAULT 0.600
                        CHECK (target_attainment >= 0 AND target_attainment <= 1),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, co_number)
);

-- Program Outcomes (PO) — mapping target
CREATE TABLE program_outcomes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  po_number       TEXT NOT NULL,
  description     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, po_number)
);

-- -----------------------------------------------------------------------------
-- CO-PO MAPPING
-- Links each Course Outcome to Program Outcomes with correlation strength 1–3
-- -----------------------------------------------------------------------------
CREATE TABLE co_po_mapping (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co_id               UUID NOT NULL REFERENCES course_outcomes(id) ON DELETE CASCADE,
  po_id               UUID NOT NULL REFERENCES program_outcomes(id) ON DELETE CASCADE,
  correlation_level   INTEGER NOT NULL CHECK (correlation_level BETWEEN 1 AND 3),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (co_id, po_id)
);

-- Legacy alias (app references co_po_mappings)
CREATE OR REPLACE VIEW co_po_mappings AS SELECT * FROM co_po_mapping;

CREATE OR REPLACE FUNCTION co_po_mappings_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO co_po_mapping (co_id, po_id, correlation_level, notes)
  VALUES (NEW.co_id, NEW.po_id, NEW.correlation_level, NEW.notes);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION co_po_mappings_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM co_po_mapping WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER co_po_mappings_insert_trigger
  INSTEAD OF INSERT ON co_po_mappings
  FOR EACH ROW EXECUTE FUNCTION co_po_mappings_insert();

CREATE TRIGGER co_po_mappings_delete_trigger
  INSTEAD OF DELETE ON co_po_mappings
  FOR EACH ROW EXECUTE FUNCTION co_po_mappings_delete();

-- Updatable profiles view (app reads/writes profiles)
CREATE OR REPLACE FUNCTION profiles_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET
    email = COALESCE(NEW.email, email),
    full_name = COALESCE(NEW.full_name, full_name),
    role = COALESCE(NEW.role, role)
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_update_trigger
  INSTEAD OF UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION profiles_update();

-- -----------------------------------------------------------------------------
-- ENROLLMENTS & ASSESSMENTS (required for marks)
-- -----------------------------------------------------------------------------
CREATE TABLE enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

CREATE TABLE assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  max_marks       DECIMAL(8,2) NOT NULL CHECK (max_marks > 0),
  weight          DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (weight > 0),
  co_id           UUID REFERENCES course_outcomes(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- MARKS
-- -----------------------------------------------------------------------------
CREATE TABLE marks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_id     UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  marks_obtained    DECIMAL(8,2) NOT NULL DEFAULT 0 CHECK (marks_obtained >= 0),
  entered_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, assessment_id)
);

-- -----------------------------------------------------------------------------
-- ATTAINMENT REPORTS
-- Persisted snapshots after calculation / PDF export
-- -----------------------------------------------------------------------------
CREATE TABLE attainment_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id             UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  generated_by          UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
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

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_teachers_department ON teachers(department_id);
CREATE INDEX idx_students_program ON students(program_id);
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_program ON courses(program_id);
CREATE INDEX idx_course_outcomes_course ON course_outcomes(course_id);
CREATE INDEX idx_co_po_mapping_co ON co_po_mapping(co_id);
CREATE INDEX idx_co_po_mapping_po ON co_po_mapping(po_id);
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_assessment ON marks(assessment_id);
CREATE INDEX idx_attainment_reports_course ON attainment_reports(course_id);
CREATE INDEX idx_attainment_reports_generated_at ON attainment_reports(generated_at DESC);

-- -----------------------------------------------------------------------------
-- TRIGGERS
-- -----------------------------------------------------------------------------

-- Auto-create user row on Supabase Auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER marks_updated_at
  BEFORE UPDATE ON marks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create teacher/student extension row when role is set
CREATE OR REPLACE FUNCTION sync_role_extension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'teacher' AND NOT EXISTS (SELECT 1 FROM teachers WHERE profile_id = NEW.id) THEN
    INSERT INTO teachers (profile_id, employee_id, department_id, approval_status)
    VALUES (
      NEW.id,
      'EMP-' || UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8)),
      (SELECT id FROM departments ORDER BY created_at LIMIT 1),
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Validate teacher/student rows match user role
CREATE OR REPLACE FUNCTION validate_teacher_user_role()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.profile_id AND role = 'teacher') THEN
    RAISE EXCEPTION 'profile_id must reference a user with role = teacher';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_student_user_role()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.profile_id AND role = 'student') THEN
    RAISE EXCEPTION 'profile_id must reference a user with role = student';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER teachers_validate_role
  BEFORE INSERT OR UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION validate_teacher_user_role();

CREATE TRIGGER students_validate_role
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION validate_student_user_role();

-- -----------------------------------------------------------------------------
-- RLS HELPERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_po_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attainment_reports ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_update_admin" ON users FOR UPDATE USING (get_user_role() = 'admin');

-- TEACHERS
CREATE POLICY "teachers_select_auth" ON teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "teachers_manage_admin" ON teachers FOR ALL USING (get_user_role() = 'admin');

-- STUDENTS
CREATE POLICY "students_select_auth" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "students_select_own" ON students FOR SELECT
  USING (profile_id = auth.uid());
CREATE POLICY "students_manage_admin" ON students FOR ALL USING (get_user_role() = 'admin');

-- ACADEMIC DATA (read: all authenticated; write: admin + teacher)
-- Public read so registration dropdowns work before sign-in
CREATE POLICY "departments_select" ON departments FOR SELECT USING (true);
CREATE POLICY "departments_write" ON departments FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'))
  WITH CHECK (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "programs_select" ON programs FOR SELECT USING (true);
CREATE POLICY "programs_write" ON programs FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'))
  WITH CHECK (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "courses_select" ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "courses_write" ON courses FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "course_outcomes_select" ON course_outcomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "course_outcomes_write" ON course_outcomes FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "program_outcomes_select" ON program_outcomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "program_outcomes_admin" ON program_outcomes FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "co_po_mapping_select" ON co_po_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY "co_po_mapping_write" ON co_po_mapping FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "enrollments_select" ON enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY "enrollments_write" ON enrollments FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "assessments_select" ON assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "assessments_write" ON assessments FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "marks_select" ON marks FOR SELECT TO authenticated USING (true);
CREATE POLICY "marks_write" ON marks FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "marks_select_own" ON marks FOR SELECT
  USING (
    get_user_role() = 'student' AND
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

CREATE POLICY "attainment_reports_select" ON attainment_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "attainment_reports_write" ON attainment_reports FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

-- -----------------------------------------------------------------------------
-- ENTITY RELATIONSHIP SUMMARY
-- -----------------------------------------------------------------------------
-- auth.users 1──1 users
-- users 1──0..1 teachers (profile_id, role = teacher)
-- users 1──0..1 students (profile_id, role = student)
-- departments 1──* programs
-- programs 1──* students, courses, program_outcomes
-- teachers 1──* courses
-- courses 1──* course_outcomes, assessments, enrollments, attainment_reports
-- course_outcomes *──* program_outcomes via co_po_mapping
-- students *──* courses via enrollments
-- assessments 1──* marks ← students
