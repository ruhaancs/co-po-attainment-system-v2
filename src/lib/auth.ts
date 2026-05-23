import { redirect } from "next/navigation";
import { TABLES } from "./constants";
import type { Profile, UserRole } from "./types";
import { createClient } from "./supabase/server";
import { getTeacherByProfileId } from "./api/teachers";

export type SessionUser = Profile;

export const roleLoginPaths: Record<UserRole, string> = {
  admin: "/login",
  teacher: "/login",
  student: "/login",
};

const ROUTE_PERMISSIONS: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/dashboard/users", roles: ["admin"] },
  { prefix: "/dashboard/departments", roles: ["admin"] },
  { prefix: "/dashboard/programs", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/enrollments", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/courses", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/co-po", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/marks", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/attainment", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/reports", roles: ["admin", "teacher"] },
  { prefix: "/dashboard/my-courses", roles: ["student"] },
  { prefix: "/dashboard/my-attainment", roles: ["student"] },
  { prefix: "/dashboard/my-marks", roles: ["student"] },
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

export function getLoginPathForRole(): string {
  return "/login";
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from(TABLES.users)
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  const profile = data as SessionUser;
  if (profile.is_active === false) return null;

  if (profile.role === "teacher") {
    const { data: teacher, error: teacherErr } = await getTeacherByProfileId(supabase, user.id);
    if (teacherErr?.message?.includes("approval_status")) {
      return teacher ? profile : null;
    }
    if (!teacher) return null;
    if (teacher.approval_status && teacher.approval_status !== "approved") {
      return null;
    }
  }

  return profile;
}

export async function getSessionProfile() {
  return getSessionUser();
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(
  allowed: UserRole | UserRole[]
): Promise<SessionUser> {
  const session = await requireAuth();
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(session.role)) redirect("/dashboard");
  return session;
}

export async function redirectIfAuthenticated() {
  const session = await getSessionUser();
  if (session) redirect("/dashboard");
}
