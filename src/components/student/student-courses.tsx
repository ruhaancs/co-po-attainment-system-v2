"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StudentCourses() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!student) return;

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course:courses(*, teacher:teachers(profile:users(full_name)))")
        .eq("student_id", student.id);

      if (enrollments) {
        setCourses(
          enrollments
            .map((e) => e.course as unknown as Course)
            .filter(Boolean)
        );
      }
    }
    load();
  }, []);

  return (
    <div>
      <Header title="My Courses" description="Courses you are enrolled in" />
      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((c) => (
          <Card key={c.id} className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{c.code}</CardTitle>
                <Badge variant="secondary">{c.semester}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{c.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(
                  (c.teacher as { profile?: { full_name?: string } })?.profile
                    ?.full_name ?? "TBA"
                )}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{c.credits} credits</p>
            </CardContent>
          </Card>
        ))}
        {courses.length === 0 && (
          <p className="text-muted-foreground col-span-2">
            No enrollments found. Contact your administrator.
          </p>
        )}
      </div>
    </div>
  );
}
