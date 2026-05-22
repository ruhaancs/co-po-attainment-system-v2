-- CO-PO Attainment System Schema
-- Run in Supabase SQL Editor

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  semester TEXT NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, semester)
);

CREATE TABLE course_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  co_number TEXT NOT NULL,
  description TEXT NOT NULL,
  target_attainment DECIMAL(3,2) NOT NULL DEFAULT 0.60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, co_number)
);

CREATE TABLE program_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, po_number)
);

CREATE TABLE co_po_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
  po_id UUID REFERENCES program_outcomes(id) ON DELETE CASCADE,
  correlation_level INTEGER NOT NULL CHECK (correlation_level BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(co_id, po_id)
);

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  roll_number TEXT NOT NULL UNIQUE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_marks DECIMAL(6,2) NOT NULL,
  weight DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  co_id UUID REFERENCES course_outcomes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, assessment_id)
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_po_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Authenticated read for academic data
CREATE POLICY "Auth read departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage departments" ON departments FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Auth read programs" ON programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage programs" ON programs FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Auth read courses" ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin teacher manage courses" ON courses FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "Auth read COs" ON course_outcomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin teacher manage COs" ON course_outcomes FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "Auth read POs" ON program_outcomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage POs" ON program_outcomes FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Auth read mappings" ON co_po_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin teacher manage mappings" ON co_po_mappings FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "Auth read students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage students" ON students FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Auth read enrollments" ON enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin teacher manage enrollments" ON enrollments FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "Auth read assessments" ON assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin teacher manage assessments" ON assessments FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "Auth read marks" ON marks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin teacher manage marks" ON marks FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Students read own marks" ON marks FOR SELECT
  USING (
    get_user_role() = 'student' AND
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );
