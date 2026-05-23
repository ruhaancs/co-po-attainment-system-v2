import Link from "next/link";
import { GraduationCap, Shield, Users, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            University{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              CO–PO Attainment
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Production-ready ERP for course outcomes, program outcomes, marks,
            attainment analytics, and accreditation reports.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Students",
              desc: "Register with roll number, view courses, marks, and CO attainment.",
              href: "/register",
            },
            {
              icon: BookOpen,
              title: "Teachers",
              desc: "Manage courses, enter marks, map CO–PO, and export reports.",
              href: "/register",
            },
            {
              icon: Shield,
              title: "Administrators",
              desc: "Approve teachers, manage programs, users, and analytics.",
              href: "/login",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="glass-card hover:border-primary/30 transition-colors">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={item.href}>Learn more</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
