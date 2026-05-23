import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { canAccessRoute } from "@/lib/auth";
import { TABLES } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/confirm",
];

function isPublic(pathname: string) {
  if (PUBLIC_PREFIXES.includes(pathname)) return true;
  if (pathname.startsWith("/login/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, user, supabaseResponse } = await updateSession(request);

  await supabase.auth.getUser();

  if (pathname.startsWith("/login/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!user) {
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (!isPublic(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from(TABLES.users)
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  const role = profile?.role as UserRole | undefined;

  if (profile?.is_active === false && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "account_disabled");
    return NextResponse.redirect(url);
  }

  if (role === "teacher" && pathname.startsWith("/dashboard")) {
    const { data: teacher, error: teacherErr } = await supabase
      .from(TABLES.teachers)
      .select("approval_status")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!teacherErr?.message?.includes("approval_status")) {
      if (!teacher) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "teacher_profile_missing");
        return NextResponse.redirect(url);
      }
      if (teacher.approval_status !== "approved") {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "pending_approval");
        return NextResponse.redirect(url);
      }
    }
  }

  if (
    user &&
    (pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard") && role) {
    if (!canAccessRoute(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  if (!user && !profile && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/register";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Skip all Next.js internals and static files so middleware never blocks
     * CSS/JS chunks (broken chunks = unstyled HTML in dev).
     */
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
