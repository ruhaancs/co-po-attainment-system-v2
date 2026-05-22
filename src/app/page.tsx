import Link from "next/link";
import { GraduationCap, Shield, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const portals = [
  {
    role: "Admin",
    href: "/login/admin",
    icon: Shield,
    description: "Manage users, departments, programs, and system settings.",
  },
  {
    role: "Teacher",
    href: "/login/teacher",
    icon: BookOpen,
    description: "Manage courses, CO-PO mapping, marks, and attainment reports.",
  },
  {
    role: "Student",
    href: "/login/student",
    icon: Users,
    description: "View enrolled courses and your CO attainment progress.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-lg font-bold">CO-PO Attainment</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Track{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              CO & PO Attainment
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A modern university system for course outcomes, program outcomes,
            marks entry, attainment calculation, and PDF reports.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Card
                key={portal.role}
                className="glass-card transition-colors hover:border-primary/40"
              >
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{portal.role} Portal</CardTitle>
                  <CardDescription>{portal.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={portal.href}>Enter as {portal.role}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Session-based Supabase Auth",
            "CO-PO correlation mapping",
            "Weighted attainment engine",
            "PDF report export",
          ].map((feature) => (
            <div
              key={feature}
              className="rounded-lg border border-border/50 bg-card/40 px-4 py-3 text-center text-sm text-muted-foreground"
            >
              {feature}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
