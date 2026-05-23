"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Assessment, Course, CourseOutcome, Student } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Save } from "lucide-react";

export function MarksManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [cos, setCos] = useState<CourseOutcome[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});
  const [assessForm, setAssessForm] = useState({
    name: "",
    max_marks: "100",
    weight: "1",
    co_id: "",
  });

  const supabase = createClient();

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => {
      if (data) setCourses(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    loadData();
  }, [selectedCourse]);

  async function loadData() {
    const [aRes, coRes, enrollRes] = await Promise.all([
      supabase.from("assessments").select("*, course_outcome:course_outcomes(*)").eq("course_id", selectedCourse),
      supabase.from("course_outcomes").select("*").eq("course_id", selectedCourse),
      supabase
        .from("enrollments")
        .select("student:students(*, profile:users(full_name, email))")
        .eq("course_id", selectedCourse),
    ]);

    if (aRes.data) setAssessments(aRes.data as Assessment[]);
    if (coRes.data) setCos(coRes.data);

    const enrolled = (enrollRes.data ?? [])
      .map((e) => e.student as unknown as Student)
      .filter(Boolean);
    setStudents(enrolled);

    const assessmentIds = aRes.data?.map((a) => a.id) ?? [];
    if (assessmentIds.length && enrolled.length) {
      const { data: markData } = await supabase
        .from("marks")
        .select("*")
        .in(
          "assessment_id",
          assessmentIds
        );

      const grid: Record<string, Record<string, number>> = {};
      enrolled.forEach((s) => {
        grid[s.id] = {};
        assessmentIds.forEach((aid) => {
          const m = markData?.find(
            (x) => x.student_id === s.id && x.assessment_id === aid
          );
          grid[s.id][aid] = m?.marks_obtained ?? 0;
        });
      });
      setMarks(grid);
    }
  }

  async function addAssessment() {
    await supabase.from("assessments").insert({
      course_id: selectedCourse,
      name: assessForm.name,
      max_marks: parseFloat(assessForm.max_marks),
      weight: parseFloat(assessForm.weight),
      co_id: assessForm.co_id || null,
    });
    setAssessForm({ name: "", max_marks: "100", weight: "1", co_id: "" });
    loadData();
  }

  function updateMark(studentId: string, assessmentId: string, value: number) {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [assessmentId]: value },
    }));
  }

  async function saveMarks() {
    const rows: { student_id: string; assessment_id: string; marks_obtained: number }[] = [];
    Object.entries(marks).forEach(([studentId, assessMarks]) => {
      Object.entries(assessMarks).forEach(([assessmentId, score]) => {
        rows.push({
          student_id: studentId,
          assessment_id: assessmentId,
          marks_obtained: score,
        });
      });
    });

    for (const row of rows) {
      await supabase.from("marks").upsert(row, {
        onConflict: "student_id,assessment_id",
      });
    }
    alert("Marks saved successfully");
  }

  return (
    <div>
      <Header title="Marks Entry" description="Create assessments and enter student marks">
        <Button onClick={saveMarks} disabled={!selectedCourse}>
          <Save className="h-4 w-4" /> Save All Marks
        </Button>
      </Header>

      <div className="mb-6">
        <Label className="mb-2 block">Course</Label>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCourse && (
        <>
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="text-base">Add Assessment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Input placeholder="Assessment name" value={assessForm.name} onChange={(e) => setAssessForm({ ...assessForm, name: e.target.value })} className="max-w-[180px]" />
              <Input type="number" placeholder="Max marks" value={assessForm.max_marks} onChange={(e) => setAssessForm({ ...assessForm, max_marks: e.target.value })} className="max-w-[100px]" />
              <Input type="number" placeholder="Weight" value={assessForm.weight} onChange={(e) => setAssessForm({ ...assessForm, weight: e.target.value })} className="max-w-[80px]" />
              <Select value={assessForm.co_id} onValueChange={(v) => setAssessForm({ ...assessForm, co_id: v })}>
                <SelectTrigger className="max-w-[140px]"><SelectValue placeholder="Link CO" /></SelectTrigger>
                <SelectContent>
                  {cos.map((co) => (
                    <SelectItem key={co.id} value={co.id}>{co.co_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addAssessment}><Plus className="h-4 w-4" /> Add</Button>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-x-auto">
            <CardContent className="p-0 pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    {assessments.map((a) => (
                      <TableHead key={a.id} className="min-w-[100px]">
                        {a.name}
                        <span className="block text-xs font-normal text-muted-foreground">
                          /{a.max_marks}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.roll_number}
                        <span className="block text-xs text-muted-foreground">
                          {(s.profile as { full_name?: string } | null)?.full_name}
                        </span>
                      </TableCell>
                      {assessments.map((a) => (
                        <TableCell key={a.id}>
                          <Input
                            type="number"
                            min={0}
                            max={a.max_marks}
                            className="h-8 w-20"
                            value={marks[s.id]?.[a.id] ?? 0}
                            onChange={(e) =>
                              updateMark(s.id, a.id, parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={assessments.length + 1} className="text-center text-muted-foreground">
                        No enrolled students. Enroll students first.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
