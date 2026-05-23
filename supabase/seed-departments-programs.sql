-- Departments and B.Tech programs for CO-PO Attainment System
-- Safe to re-run: upserts by unique `code`.

INSERT INTO departments (name, code) VALUES
  ('Computer Science & Engineering', 'CSE'),
  ('Electronics & Communication Engineering', 'ECE'),
  ('Electrical Engineering', 'EE'),
  ('Mechanical Engineering', 'ME'),
  ('Civil Engineering', 'CE'),
  ('Food Engineering & Technology', 'FET')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO programs (name, code, department_id)
SELECT v.name, v.code, d.id
FROM (VALUES
  ('B.Tech Computer Science & Engineering', 'BTECH-CSE', 'CSE'),
  ('B.Tech Electronics & Communication Engineering', 'BTECH-ECE', 'ECE'),
  ('B.Tech Electrical Engineering', 'BTECH-EE', 'EE'),
  ('B.Tech Mechanical Engineering', 'BTECH-ME', 'ME'),
  ('B.Tech Civil Engineering', 'BTECH-CE', 'CE'),
  ('B.Tech Food Engineering & Technology', 'BTECH-FET', 'FET')
) AS v(name, code, dept_code)
JOIN departments d ON d.code = v.dept_code
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  department_id = EXCLUDED.department_id;
