/** Canonical Supabase table names */
export const TABLES = {
  profiles: "users", // DB table `users`; view `profiles` for read-only legacy
  users: "users",
  departments: "departments",
  programs: "programs",
  teachers: "teachers",
  students: "students",
  courses: "courses",
  courseOutcomes: "course_outcomes",
  programOutcomes: "program_outcomes",
  coPoMapping: "co_po_mapping",
  coPoMappings: "co_po_mappings", // view over co_po_mapping
  enrollments: "enrollments",
  assessments: "assessments",
  marks: "marks",
  attainmentResults: "attainment_results",
} as const;
