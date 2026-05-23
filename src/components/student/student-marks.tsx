"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/constants";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface MarkRow {
  marks_obtained: number;
  assessment: { name: string; max_marks: number; course: { code: string; name: string } };
}

export function StudentMarks() {
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from(TABLES.students)
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!student) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from(TABLES.marks)
        .select(
          `marks_obtained, assessment:assessments(name, max_marks, course:courses(code, name))`
        )
        .eq("student_id", student.id);

      if (data) {
        setRows(
          (data as unknown[]).map((row) => {
            const r = row as {
              marks_obtained: number;
              assessment: { name: string; max_marks: number; course: { code: string; name: string } | { code: string; name: string }[] };
            };
            const a = r.assessment;
            const course = Array.isArray(a.course) ? a.course[0] : a.course;
            return {
              marks_obtained: r.marks_obtained,
              assessment: { name: a.name, max_marks: a.max_marks, course },
            };
          })
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <Header title="My Marks" description="Your assessment scores across enrolled courses" />
      <Card className="glass-card">
        <CardContent className="p-0 pt-4">
          {loading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {r.assessment?.course?.code} — {r.assessment?.course?.name}
                    </TableCell>
                    <TableCell>{r.assessment?.name}</TableCell>
                    <TableCell>
                      {r.marks_obtained} / {r.assessment?.max_marks}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No marks recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
