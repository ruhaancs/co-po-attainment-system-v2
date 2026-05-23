-- Run once in Supabase SQL Editor if teachers cannot add departments/programs
-- (fixes empty program dropdown for teacher accounts)

DROP POLICY IF EXISTS "departments_admin" ON departments;
DROP POLICY IF EXISTS "programs_admin" ON programs;

CREATE POLICY "departments_write" ON departments FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'))
  WITH CHECK (get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "programs_write" ON programs FOR ALL
  USING (get_user_role() IN ('admin', 'teacher'))
  WITH CHECK (get_user_role() IN ('admin', 'teacher'));
