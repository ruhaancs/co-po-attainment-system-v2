import { requireRole } from "@/lib/auth";
import { StudentMarks } from "@/components/student/student-marks";

export default async function MyMarksPage() {
  await requireRole("student");
  return <StudentMarks />;
}
