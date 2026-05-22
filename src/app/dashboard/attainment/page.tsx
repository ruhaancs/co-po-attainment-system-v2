import { requireRole } from "@/lib/auth";
import { AttainmentViewer } from "@/components/attainment/attainment-viewer";

export default async function AttainmentPage() {
  await requireRole(["admin", "teacher"]);
  return <AttainmentViewer />;
}
