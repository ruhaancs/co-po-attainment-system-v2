import { requireRole } from "@/lib/auth";
import { EnrollmentsManager } from "@/components/enrollments/enrollments-manager";

export default async function EnrollmentsPage() {
  await requireRole(["admin", "teacher"]);
  return <EnrollmentsManager />;
}
