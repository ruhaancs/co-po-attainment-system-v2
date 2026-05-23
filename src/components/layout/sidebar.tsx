"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GitBranch,
  PenLine,
  Target,
  BarChart3,
  FileDown,
  Users,
  Building2,
  Layers,
  UserPlus,
  GraduationCap,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/auth/actions";
import type { UserRole } from "@/lib/types";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "teacher", "student"] },
  { href: "/dashboard/programs", label: "Programs", icon: Layers, roles: ["admin", "teacher"] },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpen, roles: ["admin", "teacher"] },
  { href: "/dashboard/enrollments", label: "Enrollments", icon: UserPlus, roles: ["admin", "teacher"] },
  { href: "/dashboard/co-po", label: "CO-PO Mapping", icon: GitBranch, roles: ["admin", "teacher"] },
  { href: "/dashboard/marks", label: "Marks Entry", icon: PenLine, roles: ["admin", "teacher"] },
  { href: "/dashboard/attainment", label: "Attainment", icon: Target, roles: ["admin", "teacher"] },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "teacher", "student"] },
  { href: "/dashboard/reports", label: "Reports", icon: FileDown, roles: ["admin", "teacher"] },
  { href: "/dashboard/my-courses", label: "My Courses", icon: BookOpen, roles: ["student"] },
  { href: "/dashboard/my-attainment", label: "My Attainment", icon: Target, roles: ["student"] },
  { href: "/dashboard/my-marks", label: "My Marks", icon: PenLine, roles: ["student"] },
  { href: "/dashboard/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/dashboard/departments", label: "Departments", icon: Building2, roles: ["admin"] },
];

interface SidebarProps {
  role: UserRole;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const filtered = navItems.filter((item) => item.roles.includes(role));

  async function handleLogout() {
    setSigningOut(true);
    await signOut();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-4">
      {filtered.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X /> : <Menu />}
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/60 bg-card/95 backdrop-blur-md transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">CO-PO System</p>
            <p className="text-xs capitalize text-muted-foreground">{role}</p>
          </div>
        </div>
        {nav}
        <div className="mt-auto border-t border-border/60 p-4">
          <p className="mb-2 truncate text-xs text-muted-foreground">{userName}</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
            disabled={signingOut}
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </aside>
    </>
  );
}
