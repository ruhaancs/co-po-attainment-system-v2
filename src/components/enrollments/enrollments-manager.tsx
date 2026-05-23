"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Course, Student } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2 } from "lucide-react";

interface EnrollmentRow {
  id: string;
  student_id: string;
  student?: Student & { profile?: { full_name: string } };
}

export function EnrollmentsManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [addStudentId, setAddStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("courses").select("*").order("code").then(({ data }) => {
      if (data?.length) {
        setCourses(data);
        setSelectedCourse(data[0].id);
      }
    });
    supabase
      .from("students")
      .select("*, profile:users(full_name)")
      .then(({ data }) => {
        if (data) setStudents(data as Student[]);
      });
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    loadEnrollments();
  }, [selectedCourse]);

  async function loadEnrollments() {
    const { data } = await supabase
      .from("enrollments")
      .select("id, student_id, student:students(*, profile:users(full_name))")
      .eq("course_id", selectedCourse);
    if (data) {
      setEnrollments(
        data.map((row) => {
          const r = row as { id: string; student_id: string; student: unknown };
          const st = Array.isArray(r.student) ? r.student[0] : r.student;
          return { ...r, student: st } as EnrollmentRow;
        })
      );
    }
  }

  async function enrollStudent() {
    setError(null);
    if (!addStudentId || !selectedCourse) {
      setError("Select a course and student.");
      return;
    }
    const { error: err } = await supabase.from("enrollments").insert({
      student_id: addStudentId,
      course_id: selectedCourse,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setAddStudentId("");
    loadEnrollments();
  }

  async function removeEnrollment(id: string) {
    await supabase.from("enrollments").delete().eq("id", id);
    loadEnrollments();
  }

  const enrolledIds = new Set(enrollments.map((e) => e.student_id));
  const availableStudents = students.filter((s) => !enrolledIds.has(s.id));

  return (
    <div>
      <Header
        title="Enrollments"
        description="Enroll students in courses before entering marks"
      />

      <div className="mb-6">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="max-w-md">
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
      </div>

      <Card className="glass-card mb-6">
        <CardHeader>
          <CardTitle className="text-base">Add enrollment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Select value={addStudentId} onValueChange={setAddStudentId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {availableStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.roll_number} —{" "}
                  {(s.profile as { full_name?: string })?.full_name ?? "Student"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={enrollStudent} disabled={!availableStudents.length}>
            <UserPlus className="h-4 w-4" /> Enroll
          </Button>
          {error && <p className="w-full text-sm text-destructive">{error}</p>}
          {students.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No students in database. Admin must add student accounts first.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-0 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.student?.roll_number}</TableCell>
                  <TableCell>
                    {(e.student?.profile as { full_name?: string })?.full_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">Enrolled</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEnrollment(e.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {enrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No students enrolled in this course.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
