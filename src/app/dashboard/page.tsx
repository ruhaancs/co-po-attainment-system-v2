import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookOpen, Users, GraduationCap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireAuth();
  const supabase = await createClient();

  const [{ count: courseCount }, { count: studentCount }, { count: teacherCount }] =
    await Promise.all([
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("teachers").select("*", { count: "exact", head: true }),
    ]);

  const quickLinks =
    session.role === "student"
      ? [
          { href: "/dashboard/my-courses", label: "My Courses" },
          { href: "/dashboard/my-attainment", label: "My Attainment" },
          { href: "/dashboard/analytics", label: "Analytics" },
        ]
      : [
          { href: "/dashboard/programs", label: "Programs" },
          { href: "/dashboard/courses", label: "Manage Courses" },
          { href: "/dashboard/enrollments", label: "Enrollments" },
          { href: "/dashboard/marks", label: "Enter Marks" },
          { href: "/dashboard/attainment", label: "View Attainment" },
          { href: "/dashboard/reports", label: "Export Reports" },
        ];

  return (
    <div>
      <Header
        title={`Welcome, ${session.full_name?.split(" ")[0] ?? "User"}`}
        description={`${session.role} dashboard — CO-PO attainment overview`}
      />

      {session.role !== "student" && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Courses" value={courseCount ?? 0} icon={BookOpen} />
          <StatCard title="Students" value={studentCount ?? 0} icon={Users} />
          <StatCard title="Teachers" value={teacherCount ?? 0} icon={GraduationCap} />
          <StatCard
            title="Target Attainment"
            value={formatPercent(0.6)}
            icon={Target}
            trend="Default CO target"
          />
        </div>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <Button key={link.href} asChild variant="secondary">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      {session.role === "admin" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">System Management</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/users">Users</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/departments">Departments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
