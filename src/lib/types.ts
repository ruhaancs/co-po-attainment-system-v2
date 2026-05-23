export type UserRole = "admin" | "teacher" | "student";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  is_active?: boolean;
  avatar_url?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Teacher {
  id: string;
  profile_id: string;
  employee_id: string;
  department_id: string | null;
  designation?: string;
  approval_status: ApprovalStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  profile?: Profile;
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
  description?: string | null;
  program?: Program;
  teacher?: Teacher & { profile?: Profile };
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
  batch_year?: number | null;
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

export interface AttainmentResult {
  id: string;
  course_id: string;
  generated_by: string;
  report_title: string;
  semester: string;
  co_attainment: unknown;
  po_attainment: unknown;
  avg_co_attainment?: number;
  cos_met_count: number;
  cos_total_count: number;
  students_evaluated: number;
  generated_at: string;
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
