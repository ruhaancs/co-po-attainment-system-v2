import { requireRole } from "@/lib/auth";
import { StudentCourses } from "@/components/student/student-courses";

export default async function MyCoursesPage() {
  await requireRole("student");
  return <StudentCourses />;
}
