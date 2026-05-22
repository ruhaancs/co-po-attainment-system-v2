import type { UserRole } from "./types";
import { createClient } from "./supabase/server";

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
  } | null;
}

export const roleRoutes: Record<UserRole, string> = {
  admin: "/dashboard",
  teacher: "/dashboard",
  student: "/dashboard",
};

export const roleLoginPaths: Record<UserRole, string> = {
  admin: "/login/admin",
  teacher: "/login/teacher",
  student: "/login/student",
};

export function canAccessRoute(
  role: UserRole,
  pathname: string
): boolean {
  const adminOnly = ["/dashboard/users", "/dashboard/departments"];
  const teacherRoutes = [
    "/dashboard/courses",
    "/dashboard/co-po",
    "/dashboard/marks",
    "/dashboard/attainment",
    "/dashboard/analytics",
    "/dashboard/reports",
  ];

  if (role === "admin") return true;
  if (role === "teacher") {
    if (adminOnly.some((r) => pathname.startsWith(r))) return false;
    return true;
  }
  if (role === "student") {
    const studentAllowed = [
      "/dashboard",
      "/dashboard/my-courses",
      "/dashboard/my-attainment",
      "/dashboard/analytics",
    ];
    return studentAllowed.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );
  }
  return false;
}
