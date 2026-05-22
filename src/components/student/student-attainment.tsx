"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateCoAttainment } from "@/lib/attainment";
import type { Assessment, CoAttainment, Course, CourseOutcome, Mark } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StudentAttainment() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [results, setResults] = useState<CoAttainment[]>([]);
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!student) return;
      setStudentId(student.id);

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course:courses(*)")
        .eq("student_id", student.id);

      const list = (enrollments ?? [])
        .map((e) => e.course as unknown as Course)
        .filter(Boolean);
      setCourses(list);
      if (list.length) setSelectedCourse(list[0].id);
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedCourse || !studentId) return;
    loadAttainment();
  }, [selectedCourse, studentId]);

  async function loadAttainment() {
    const supabase = createClient();
    const [coRes, assessRes] = await Promise.all([
      supabase.from("course_outcomes").select("*").eq("course_id", selectedCourse),
      supabase.from("assessments").select("*").eq("course_id", selectedCourse),
    ]);

    const assessmentIds = (assessRes.data ?? []).map((a: Assessment) => a.id);
    let marks: Mark[] = [];
    if (assessmentIds.length) {
      const { data } = await supabase
        .from("marks")
        .select("*")
        .eq("student_id", studentId)
        .in("assessment_id", assessmentIds);
      marks = (data ?? []) as Mark[];
    }

    const allMarks = marks;
    const classMarks: Mark[] = [];
    if (assessmentIds.length) {
      const { data } = await supabase
        .from("marks")
        .select("*")
        .in("assessment_id", assessmentIds);
      if (data) {
        (assessRes.data ?? []).forEach((a: Assessment) => {
          const forAssess = data.filter((m) => m.assessment_id === a.id);
          const myMark = marks.find((m) => m.assessment_id === a.id);
          if (myMark) classMarks.push(myMark);
          else if (forAssess.length) classMarks.push(forAssess[0]);
        });
      }
    }

    const coAtt = calculateCoAttainment(
      (coRes.data ?? []) as CourseOutcome[],
      (assessRes.data ?? []) as Assessment[],
      allMarks.length ? allMarks : classMarks
    );
    setResults(coAtt);
  }

  return (
    <div>
      <Header title="My Attainment" description="Your course outcome attainment progress" />
      {courses.length > 0 && (
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="mb-6 max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((co) => (
          <Card key={co.co_id} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{co.co_number}</CardTitle>
              <Badge variant={co.met ? "success" : "warning"}>
                {co.met ? "Met" : "Below Target"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your attainment</span>
                <span className="font-bold text-primary">{formatPercent(co.attainment)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(co.attainment * 100, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Target: {formatPercent(co.target)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {results.length === 0 && (
        <p className="text-muted-foreground">No attainment data available yet.</p>
      )}
    </div>
  );
}
