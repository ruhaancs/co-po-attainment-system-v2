import { requireRole } from "@/lib/auth";
import { CoPoManager } from "@/components/co-po/co-po-manager";

export default async function CoPoPage() {
  await requireRole(["admin", "teacher"]);
  return <CoPoManager />;
}
