-- Seed data (run after creating users via Supabase Auth)
-- Update profile roles for demo accounts:

-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@university.edu';
-- UPDATE profiles SET role = 'teacher' WHERE email = 'teacher@university.edu';
-- UPDATE profiles SET role = 'student' WHERE email = 'student@university.edu';

INSERT INTO departments (name, code) VALUES
  ('Computer Science & Engineering', 'CSE'),
  ('Electronics & Communication', 'ECE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (name, code, department_id)
SELECT 'B.Tech Computer Science', 'BTECH-CSE', id FROM departments WHERE code = 'CSE'
ON CONFLICT (code) DO NOTHING;

INSERT INTO program_outcomes (program_id, po_number, description)
SELECT p.id, po.num, po.desc
FROM programs p
CROSS JOIN (VALUES
  ('PO1', 'Engineering knowledge'),
  ('PO2', 'Problem analysis'),
  ('PO3', 'Design/development of solutions'),
  ('PO4', 'Conduct investigations'),
  ('PO5', 'Modern tool usage'),
  ('PO6', 'Engineer and society'),
  ('PO7', 'Environment and sustainability'),
  ('PO8', 'Ethics'),
  ('PO9', 'Individual and team work'),
  ('PO10', 'Communication'),
  ('PO11', 'Project management'),
  ('PO12', 'Life-long learning')
) AS po(num, desc)
WHERE p.code = 'BTECH-CSE'
ON CONFLICT (program_id, po_number) DO NOTHING;
