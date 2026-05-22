-- =============================================================================
-- CO-PO Attainment System — Sample Data
-- PREREQUISITE: Create auth users in Supabase Dashboard first, then run
-- the "Link demo users" block below with your real auth UUIDs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATION
-- -----------------------------------------------------------------------------
INSERT INTO departments (id, name, code) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Computer Science & Engineering', 'CSE'),
  ('11111111-1111-1111-1111-111111111102', 'Electronics & Communication', 'ECE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (id, name, code, department_id) VALUES
  ('22222222-2222-2222-2222-222222222201', 'B.Tech Computer Science', 'BTECH-CSE', '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222202', 'B.Tech Electronics', 'BTECH-ECE', '11111111-1111-1111-1111-111111111102')
ON CONFLICT (code) DO NOTHING;

-- Program Outcomes (12 standard POs for CSE program)
INSERT INTO program_outcomes (program_id, po_number, description) VALUES
  ('22222222-2222-2222-2222-222222222201', 'PO1', 'Engineering knowledge'),
  ('22222222-2222-2222-2222-222222222201', 'PO2', 'Problem analysis'),
  ('22222222-2222-2222-2222-222222222201', 'PO3', 'Design/development of solutions'),
  ('22222222-2222-2222-2222-222222222201', 'PO4', 'Conduct investigations of complex problems'),
  ('22222222-2222-2222-2222-222222222201', 'PO5', 'Modern tool usage'),
  ('22222222-2222-2222-2222-222222222201', 'PO6', 'The engineer and society'),
  ('22222222-2222-2222-2222-222222222201', 'PO7', 'Environment and sustainability'),
  ('22222222-2222-2222-2222-222222222201', 'PO8', 'Ethics'),
  ('22222222-2222-2222-2222-222222222201', 'PO9', 'Individual and team work'),
  ('22222222-2222-2222-2222-222222222201', 'PO10', 'Communication'),
  ('22222222-2222-2222-2222-222222222201', 'PO11', 'Project management and finance'),
  ('22222222-2222-2222-2222-222222222201', 'PO12', 'Life-long learning')
ON CONFLICT (program_id, po_number) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. LINK DEMO USERS (replace UUIDs with your Supabase Auth user IDs)
-- Create users in Authentication → Users, then paste IDs here:
--   admin@university.edu, teacher@university.edu, student@university.edu
-- -----------------------------------------------------------------------------

/*
-- Example (uncomment and replace UUIDs after creating auth users):

INSERT INTO users (id, email, full_name, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'admin@university.edu', 'System Admin', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'teacher@university.edu', 'Dr. Priya Sharma', 'teacher'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'student@university.edu', 'Rahul Verma', 'student')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

INSERT INTO teachers (profile_id, employee_id, department_id, designation) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'EMP-T001', '11111111-1111-1111-1111-111111111101', 'Associate Professor')
ON CONFLICT (profile_id) DO NOTHING;

INSERT INTO students (profile_id, roll_number, program_id, batch_year) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'CS2024001', '22222222-2222-2222-2222-222222222201', 2024)
ON CONFLICT (profile_id) DO NOTHING;
*/

-- -----------------------------------------------------------------------------
-- 3. COURSES (uses first teacher if exists, else teacher_id NULL)
-- -----------------------------------------------------------------------------
INSERT INTO courses (id, code, name, credits, semester, program_id, teacher_id, description) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    'CS301',
    'Data Structures & Algorithms',
    4,
    'Fall 2025',
    '22222222-2222-2222-2222-222222222201',
    (SELECT id FROM teachers LIMIT 1),
    'Core undergraduate course covering arrays, trees, graphs, and algorithm analysis.'
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    'CS302',
    'Database Management Systems',
    3,
    'Fall 2025',
    '22222222-2222-2222-2222-222222222201',
    (SELECT id FROM teachers LIMIT 1),
    'Relational databases, SQL, normalization, and transaction processing.'
  )
ON CONFLICT (code, semester) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. COURSE OUTCOMES (CO)
-- -----------------------------------------------------------------------------
INSERT INTO course_outcomes (id, course_id, co_number, description, target_attainment) VALUES
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'CO1', 'Apply data structure concepts to solve computational problems', 0.60),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'CO2', 'Analyze time and space complexity of algorithms', 0.65),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 'CO3', 'Implement solutions using modern programming tools', 0.60),
  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333302', 'CO1', 'Design normalized relational database schemas', 0.60),
  ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333302', 'CO2', 'Write complex SQL queries and optimize performance', 0.65)
ON CONFLICT (course_id, co_number) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. CO-PO MAPPING
-- -----------------------------------------------------------------------------
INSERT INTO co_po_mapping (co_id, po_id, correlation_level, notes)
SELECT co.id, po.id, m.level, m.note
FROM (VALUES
  ('44444444-4444-4444-4444-444444444401', 'PO1', 3, 'Strong — core engineering knowledge'),
  ('44444444-4444-4444-4444-444444444401', 'PO2', 2, 'Medium — problem analysis'),
  ('44444444-4444-4444-4444-444444444402', 'PO2', 3, 'Strong — algorithm analysis'),
  ('44444444-4444-4444-4444-444444444403', 'PO5', 3, 'Strong — tool usage'),
  ('44444444-4444-4444-4444-444444444404', 'PO1', 2, 'Schema design knowledge'),
  ('44444444-4444-4444-4444-444444444405', 'PO5', 2, 'SQL tooling')
) AS m(co_uuid, po_num, level, note)
JOIN course_outcomes co ON co.id::text = m.co_uuid
JOIN program_outcomes po ON po.po_number = m.po_num
  AND po.program_id = '22222222-2222-2222-2222-222222222201'
ON CONFLICT (co_id, po_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. ENROLLMENTS (enroll all students in CS301 if students exist)
-- -----------------------------------------------------------------------------
INSERT INTO enrollments (student_id, course_id)
SELECT s.id, '33333333-3333-3333-3333-333333333301'
FROM students s
ON CONFLICT (student_id, course_id) DO NOTHING;

INSERT INTO enrollments (student_id, course_id)
SELECT s.id, '33333333-3333-3333-3333-333333333302'
FROM students s
LIMIT 1
ON CONFLICT (student_id, course_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. ASSESSMENTS
-- -----------------------------------------------------------------------------
INSERT INTO assessments (id, course_id, name, max_marks, weight, co_id) VALUES
  ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', 'Midterm Exam', 50, 0.40, '44444444-4444-4444-4444-444444444401'),
  ('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333301', 'Assignment 1', 20, 0.20, '44444444-4444-4444-4444-444444444403'),
  ('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333301', 'Final Exam', 100, 0.40, '44444444-4444-4444-4444-444444444402'),
  ('55555555-5555-5555-5555-555555555504', '33333333-3333-3333-3333-333333333302', 'SQL Lab Test', 30, 0.50, '44444444-4444-4444-4444-444444444405'),
  ('55555555-5555-5555-5555-555555555505', '33333333-3333-3333-3333-333333333302', 'DB Design Project', 50, 0.50, '44444444-4444-4444-4444-444444444404')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. MARKS (sample scores for enrolled students)
-- -----------------------------------------------------------------------------
INSERT INTO marks (student_id, assessment_id, marks_obtained)
SELECT e.student_id, a.id,
  CASE a.id::text
    WHEN '55555555-5555-5555-5555-555555555501' THEN 38
    WHEN '55555555-5555-5555-5555-555555555502' THEN 16
    WHEN '55555555-5555-5555-5555-555555555503' THEN 72
    WHEN '55555555-5555-5555-5555-555555555504' THEN 24
    WHEN '55555555-5555-5555-5555-555555555505' THEN 42
    ELSE 0
  END
FROM enrollments e
JOIN assessments a ON a.course_id = e.course_id
ON CONFLICT (student_id, assessment_id) DO UPDATE
  SET marks_obtained = EXCLUDED.marks_obtained;

-- -----------------------------------------------------------------------------
-- 9. ATTAINMENT REPORTS (sample snapshot)
-- -----------------------------------------------------------------------------
INSERT INTO attainment_reports (
  course_id,
  generated_by,
  report_title,
  semester,
  co_attainment,
  po_attainment,
  avg_co_attainment,
  cos_met_count,
  cos_total_count,
  students_evaluated,
  notes
)
SELECT
  '33333333-3333-3333-3333-333333333301',
  (SELECT id FROM users WHERE role = 'teacher' LIMIT 1),
  'CS301 — Fall 2025 CO-PO Attainment Report',
  'Fall 2025',
  '[
    {"co_number":"CO1","attainment":0.76,"target":0.60,"met":true},
    {"co_number":"CO2","attainment":0.72,"target":0.65,"met":true},
    {"co_number":"CO3","attainment":0.80,"target":0.60,"met":true}
  ]'::jsonb,
  '[
    {"po_number":"PO1","attainment":0.74},
    {"po_number":"PO2","attainment":0.71},
    {"po_number":"PO5","attainment":0.80}
  ]'::jsonb,
  0.760,
  3,
  3,
  (SELECT COUNT(*)::int FROM enrollments WHERE course_id = '33333333-3333-3333-3333-333333333301'),
  'Sample report generated from seed data.'
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'teacher' LIMIT 1);

-- -----------------------------------------------------------------------------
-- POST-SETUP: After creating auth users, run:
-- -----------------------------------------------------------------------------
-- UPDATE users SET role = 'admin' WHERE email = 'admin@university.edu';
-- UPDATE users SET role = 'teacher' WHERE email = 'teacher@university.edu';
-- UPDATE users SET role = 'student' WHERE email = 'student@university.edu';
--
-- Then insert teachers/students rows if trigger did not create them:
--
-- INSERT INTO teachers (profile_id, employee_id, department_id)
-- SELECT id, 'EMP-T001', '11111111-1111-1111-1111-111111111101'
-- FROM users WHERE email = 'teacher@university.edu'
-- ON CONFLICT (profile_id) DO NOTHING;
--
-- INSERT INTO students (profile_id, roll_number, program_id, batch_year)
-- SELECT id, 'CS2024001', '22222222-2222-2222-2222-222222222201', 2024
-- FROM users WHERE email = 'student@university.edu'
-- ON CONFLICT (profile_id) DO NOTHING;
