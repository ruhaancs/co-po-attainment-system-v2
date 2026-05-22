import { getSessionUser, requireRole } from "@/lib/auth";
import { ReportsExport } from "@/components/reports/reports-export";

export default async function ReportsPage() {
  await requireRole(["admin", "teacher"]);
  const session = await getSessionUser();
  return <ReportsExport userName={session?.full_name ?? "User"} />;
}
