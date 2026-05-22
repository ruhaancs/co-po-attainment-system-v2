"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Course, Program, Profile } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    credits: "3",
    semester: "",
    program_id: "",
    teacher_id: "",
  });

  const supabase = createClient();

  async function load() {
    const [cRes, pRes, tRes] = await Promise.all([
      supabase
        .from("courses")
        .select("*, program:programs(*), teacher:profiles(*)")
        .order("code"),
      supabase.from("programs").select("*").order("name"),
      supabase.from("users").select("*").eq("role", "teacher"),
    ]);
    if (cRes.data) setCourses(cRes.data as Course[]);
    if (pRes.data) setPrograms(pRes.data);
    if (tRes.data) setTeachers(tRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm({
      code: "",
      name: "",
      credits: "3",
      semester: "",
      program_id: "",
      teacher_id: "",
    });
    setEditing(null);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setForm({
      code: course.code,
      name: course.name,
      credits: String(course.credits),
      semester: course.semester,
      program_id: course.program_id,
      teacher_id: course.teacher_id ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    const payload = {
      code: form.code,
      name: form.name,
      credits: parseInt(form.credits, 10),
      semester: form.semester,
      program_id: form.program_id,
      teacher_id: form.teacher_id || null,
    };

    if (editing) {
      await supabase.from("courses").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("courses").insert(payload);
    }
    setOpen(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course?")) return;
    await supabase.from("courses").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <Header title="Course Management" description="Create and manage university courses">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="h-4 w-4" /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Course" : "New Course"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Code</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
                <div>
                  <Label>Semester</Label>
                  <Input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} placeholder="Fall 2025" />
                </div>
              </div>
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Credits</Label>
                  <Input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
                </div>
                <div>
                  <Label>Program</Label>
                  <Select value={form.program_id} onValueChange={(v) => setForm({ ...form, program_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Teacher</Label>
                <Select value={form.teacher_id} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Assign teacher" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>

      <Card className="glass-card">
        <CardContent className="p-0 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Semester</TableHead>
                <TableHead className="hidden md:table-cell">Teacher</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.semester}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {(c.teacher as Profile)?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {courses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No courses yet. Add your first course.
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
