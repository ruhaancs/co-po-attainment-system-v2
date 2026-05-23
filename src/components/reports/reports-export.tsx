"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/constants";
import { calculateCoAttainment, calculatePoAttainment } from "@/lib/attainment";
import { exportAttainmentReport } from "@/lib/pdf-export";
import type {
  Assessment,
  CoPoMapping,
  Course,
  CourseOutcome,
  Mark,
  ProgramOutcome,
} from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Loader2 } from "lucide-react";

interface ReportsExportProps {
  userName: string;
}

export function ReportsExport({ userName }: ReportsExportProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => {
      if (data) setCourses(data);
    });
  }, []);

  async function handleExport() {
    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) return;

    setLoading(true);
    try {
      const [coRes, assessRes, enrollRes, mapRes, poRes] = await Promise.all([
        supabase.from("course_outcomes").select("*").eq("course_id", selectedCourse),
        supabase.from("assessments").select("*").eq("course_id", selectedCourse),
        supabase.from("enrollments").select("student_id").eq("course_id", selectedCourse),
        supabase
          .from(TABLES.coPoMapping)
          .select("*")
          .in(
            "co_id",
            (
              await supabase
                .from("course_outcomes")
                .select("id")
                .eq("course_id", selectedCourse)
            ).data?.map((c) => c.id) ?? []
          ),
        supabase.from("program_outcomes").select("*").eq("program_id", course.program_id),
      ]);

      const studentIds = enrollRes.data?.map((e) => e.student_id) ?? [];
      const assessmentIds = (assessRes.data ?? []).map((a: Assessment) => a.id);
      let marks: Mark[] = [];
      if (studentIds.length && assessmentIds.length) {
        const { data } = await supabase
          .from("marks")
          .select("*")
          .in("student_id", studentIds)
          .in("assessment_id", assessmentIds);
        marks = (data ?? []) as Mark[];
      }

      const coAtt = calculateCoAttainment(
        (coRes.data ?? []) as CourseOutcome[],
        (assessRes.data ?? []) as Assessment[],
        marks
      );
      const poAtt = calculatePoAttainment(
        coAtt,
        (mapRes.data ?? []) as CoPoMapping[],
        (poRes.data ?? []) as ProgramOutcome[]
      );

      exportAttainmentReport({
        title: "University CO-PO Attainment Report",
        courseName: course.name,
        courseCode: course.code,
        semester: course.semester,
        coAttainments: coAtt,
        poAttainments: poAtt,
        generatedBy: userName,
        generatedAt: new Date().toLocaleString(),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header title="Reports" description="Export attainment reports as PDF" />

      <Card className="glass-card max-w-lg">
        <CardHeader>
          <CardTitle>PDF Export</CardTitle>
          <CardDescription>
            Generate a formatted CO-PO attainment report with tables for course and program outcomes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full"
            onClick={handleExport}
            disabled={!selectedCourse || loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Download PDF Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
