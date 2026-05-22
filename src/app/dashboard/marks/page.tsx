import { requireRole } from "@/lib/auth";
import { MarksManager } from "@/components/marks/marks-manager";

export default async function MarksPage() {
  await requireRole(["admin", "teacher"]);
  return <MarksManager />;
}
