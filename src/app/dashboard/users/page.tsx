import { requireRole } from "@/lib/auth";
import { UsersManager } from "@/components/admin/users-manager";

export default async function UsersPage() {
  await requireRole("admin");
  return <UsersManager />;
}
