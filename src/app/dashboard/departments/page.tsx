import { requireRole } from "@/lib/auth";
import { DepartmentsManager } from "@/components/admin/departments-manager";

export default async function DepartmentsPage() {
  await requireRole("admin");
  return <DepartmentsManager />;
}
