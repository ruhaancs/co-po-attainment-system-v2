import { getSessionProfile } from "@/lib/auth";
import { ReportsExport } from "@/components/reports/reports-export";

export default async function ReportsPage() {
  const profile = await getSessionProfile();
  return <ReportsExport userName={profile?.full_name ?? "User"} />;
}
