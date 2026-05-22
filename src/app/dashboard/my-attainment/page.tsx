import { requireRole } from "@/lib/auth";
import { StudentAttainment } from "@/components/student/student-attainment";

export default async function MyAttainmentPage() {
  await requireRole("student");
  return <StudentAttainment />;
}
