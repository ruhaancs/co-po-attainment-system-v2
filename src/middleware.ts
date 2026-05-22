import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { canAccessRoute, getLoginPathForRole } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/login/admin",
  "/login/teacher",
  "/login/student",
  "/auth/callback",
];

const LOGIN_PATHS = ["/login", "/login/admin", "/login/teacher", "/login/student"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/login/")
  );
}

function isLoginPath(pathname: string) {
  return LOGIN_PATHS.includes(pathname);
}

function expectedRoleForLoginPath(pathname: string): UserRole | null {
  if (pathname === "/login/admin") return "admin";
  if (pathname === "/login/teacher") return "teacher";
  if (pathname === "/login/student") return "student";
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, user, supabaseResponse } = await updateSession(request);

  // Refresh session — required for Supabase SSR cookie rotation
  await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Authenticated: resolve role from users table
  let role: UserRole | undefined;
  const { data: userRow } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (userRow) {
    if (userRow.is_active === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "account_disabled");
      return NextResponse.redirect(url);
    }
    role = userRow.role as UserRole;
  } else {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profileRow?.role as UserRole | undefined;
  }

  if (!role && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "profile_missing");
    return NextResponse.redirect(url);
  }

  // Logged in on a role-specific login page
  if (isLoginPath(pathname) && role) {
    const expected = expectedRoleForLoginPath(pathname);
    const url = request.nextUrl.clone();

    if (expected && role !== expected) {
      url.pathname = getLoginPathForRole(role);
      url.searchParams.set("error", "wrong_portal");
      return NextResponse.redirect(url);
    }

    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based dashboard protection
  if (pathname.startsWith("/dashboard") && role) {
    if (!canAccessRoute(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
