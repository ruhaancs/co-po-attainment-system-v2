import { requireRole } from "@/lib/auth";
import { CoursesManager } from "@/components/courses/courses-manager";

export default async function CoursesPage() {
  await requireRole(["admin", "teacher"]);
  return <CoursesManager />;
}
