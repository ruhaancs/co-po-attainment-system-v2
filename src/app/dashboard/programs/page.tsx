import { requireRole } from "@/lib/auth";
import { ProgramsManager } from "@/components/programs/programs-manager";

export default async function ProgramsPage() {
  await requireRole(["admin", "teacher"]);
  return <ProgramsManager />;
}
