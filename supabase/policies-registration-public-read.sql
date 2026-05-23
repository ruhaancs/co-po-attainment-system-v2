-- Run in Supabase SQL Editor if registration program/department dropdowns are empty.
-- Fixes RLS: anonymous users on /register could not read departments or programs.

DROP POLICY IF EXISTS "departments_select" ON departments;
CREATE POLICY "departments_select" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "programs_select" ON programs;
CREATE POLICY "programs_select" ON programs FOR SELECT USING (true);
