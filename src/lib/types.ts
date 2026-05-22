export type UserRole = "admin" | "teacher" | "student";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  department_id: string;
  department?: Department;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  program_id: string;
  teacher_id: string | null;
  program?: Program;
  teacher?: Profile;
}

export interface CourseOutcome {
  id: string;
  course_id: string;
  co_number: string;
  description: string;
  target_attainment: number;
}

export interface ProgramOutcome {
  id: string;
  program_id: string;
  po_number: string;
  description: string;
}

export interface CoPoMapping {
  id: string;
  co_id: string;
  po_id: string;
  correlation_level: number;
  course_outcome?: CourseOutcome;
  program_outcome?: ProgramOutcome;
}

export interface Student {
  id: string;
  profile_id: string;
  roll_number: string;
  program_id: string;
  profile?: Profile;
  program?: Program;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  student?: Student;
}

export interface Assessment {
  id: string;
  course_id: string;
  name: string;
  max_marks: number;
  weight: number;
  co_id: string | null;
  course_outcome?: CourseOutcome;
}

export interface Mark {
  id: string;
  student_id: string;
  assessment_id: string;
  marks_obtained: number;
  student?: Student;
  assessment?: Assessment;
}

export interface CoAttainment {
  co_id: string;
  co_number: string;
  attainment: number;
  target: number;
  met: boolean;
}

export interface PoAttainment {
  po_id: string;
  po_number: string;
  attainment: number;
}

export interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalTeachers: number;
  avgAttainment: number;
}
