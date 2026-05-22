"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateCoAttainment, calculatePoAttainment } from "@/lib/attainment";
import type { Assessment, CoPoMapping, Course, CourseOutcome, Mark, ProgramOutcome } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CoAttainmentBarChart,
  PoAttainmentLineChart,
  CoRadialChart,
} from "@/components/charts/attainment-charts";

export function AnalyticsDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [coData, setCoData] = useState<ReturnType<typeof calculateCoAttainment>>([]);
  const [poData, setPoData] = useState<ReturnType<typeof calculatePoAttainment>>([]);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => {
      if (data?.length) {
        setCourses(data);
        setSelectedCourse(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedCourse) loadAnalytics();
  }, [selectedCourse]);

  async function loadAnalytics() {
    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) return;

    const [coRes, assessRes, enrollRes, mapRes, poRes] = await Promise.all([
      supabase.from("course_outcomes").select("*").eq("course_id", selectedCourse),
      supabase.from("assessments").select("*").eq("course_id", selectedCourse),
      supabase.from("enrollments").select("student_id").eq("course_id", selectedCourse),
      supabase
        .from("co_po_mappings")
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
    setCoData(coAtt);
    setPoData(poAtt);
  }

  return (
    <div>
      <Header title="Analytics" description="Visual insights into CO and PO attainment trends">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">CO Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <CoAttainmentBarChart data={coData} />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">PO Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <PoAttainmentLineChart data={poData} />
          </CardContent>
        </Card>
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">CO Radial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <CoRadialChart data={coData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
