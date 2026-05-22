import { redirect } from "next/navigation";
import type { UserRole } from "./types";
import { createClient } from "./supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active?: boolean;
}

export const roleLoginPaths: Record<UserRole, string> = {
  admin: "/login/admin",
  teacher: "/login/teacher",
  student: "/login/student",
};

/** Routes each role may access under /dashboard */
const ROUTE_PERMISSIONS: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/dashboard/users", roles: ["admin"] },
  { prefix: "/dashboard/departments", roles: ["admin"] },
  { prefix: "/dashboard/courses", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/co-po", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/marks", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/attainment", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/reports", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/my-courses", roles: ["student"] },
  { prefix: "/dashboard/my-attainment", roles: ["student"] },
  { prefix: "/dashboard/analytics", roles: ["admin", "teacher", "student"] },
  { prefix: "/dashboard", roles: ["admin", "teacher", "student"] },
];

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "admin") return true;

  const match = ROUTE_PERMISSIONS.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );

  if (!match) return false;

  return match.roles.includes(role);
}

export function getLoginPathForRole(role: UserRole): string {
  return roleLoginPaths[role];
}

/** Fetch authenticated user profile from `users` (falls back to `profiles` view). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  let row = await supabase.from("users").select("*").eq("id", user.id).single();

  if (row.error) {
    row = await supabase.from("profiles").select("*").eq("id", user.id).single();
  }

  if (row.error || !row.data) return null;

  const data = row.data as SessionUser;
  if (data.is_active === false) return null;

  return data;
}

/** @deprecated Use getSessionUser */
export async function getSessionProfile() {
  return getSessionUser();
}

/** Redirect to login if not authenticated. */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Redirect if role is not allowed. */
export async function requireRole(
  allowed: UserRole | UserRole[]
): Promise<SessionUser> {
  const session = await requireAuth();
  const roles = Array.isArray(allowed) ? allowed : [allowed];

  if (!roles.includes(session.role)) {
    redirect("/dashboard");
  }

  return session;
}

/** Used on login pages — redirect authenticated users to their dashboard. */
export async function redirectIfAuthenticated(expectedRole?: UserRole) {
  const session = await getSessionUser();
  if (!session) return;

  if (expectedRole && session.role !== expectedRole) {
    redirect(getLoginPathForRole(session.role));
  }

  redirect("/dashboard");
}
