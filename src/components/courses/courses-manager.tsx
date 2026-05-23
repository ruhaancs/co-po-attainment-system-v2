"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Course, Department, Program } from "@/lib/types";
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
  DialogDescription,
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
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TeacherOption {
  id: string;
  full_name: string;
}

export function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    credits: "3",
    semester: "",
    program_id: "",
    teacher_id: "",
  });
  const [search, setSearch] = useState("");
  const [quickSetup, setQuickSetup] = useState({
    deptName: "Computer Science & Engineering",
    deptCode: "CSE",
    progName: "B.Tech Computer Science",
    progCode: "BTECH-CSE",
  });

  const supabase = createClient();

  async function load() {
    const [cRes, pRes, dRes, tRes] = await Promise.all([
      supabase
        .from("courses")
        .select("*, program:programs(*), teacher:teachers(profile:users(full_name))")
        .order("code"),
      supabase.from("programs").select("*").order("name"),
      supabase.from("departments").select("*").order("name"),
      supabase.from("teachers").select("id, profile:users(full_name)"),
    ]);
    if (cRes.data) setCourses(cRes.data as Course[]);
    if (pRes.data) setPrograms(pRes.data);
    if (dRes.data) setDepartments(dRes.data);
    if (tRes.data) {
      setTeachers(
        tRes.data.map((row) => {
          const t = row as {
            id: string;
            profile: { full_name: string } | { full_name: string }[] | null;
          };
          const profile = Array.isArray(t.profile) ? t.profile[0] : t.profile;
          return { id: t.id, full_name: profile?.full_name ?? "Unknown" };
        })
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm(defaultProgramId?: string) {
    setForm({
      code: "",
      name: "",
      credits: "3",
      semester: "",
      program_id: defaultProgramId ?? programs[0]?.id ?? "",
      teacher_id: "",
    });
    setEditing(null);
    setError(null);
  }

  function openCreate() {
    resetForm(programs[0]?.id);
    setOpen(true);
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
    setError(null);
    setOpen(true);
  }

  /** Create program (and department if needed) when none exist */
  async function resolveProgramId(): Promise<string | null> {
    if (form.program_id) return form.program_id;

    let deptId = departments[0]?.id;

    if (!deptId) {
      if (!quickSetup.deptName.trim() || !quickSetup.deptCode.trim()) {
        setError("Fill in department details in Quick Setup below.");
        return null;
      }
      const { data: dept, error: deptErr } = await supabase
        .from("departments")
        .insert({
          name: quickSetup.deptName.trim(),
          code: quickSetup.deptCode.trim().toUpperCase(),
        })
        .select()
        .single();
      if (deptErr) {
        setError(deptErr.message);
        return null;
      }
      deptId = dept.id;
      setDepartments((prev) => [...prev, dept]);
    }

    if (!quickSetup.progName.trim() || !quickSetup.progCode.trim()) {
      setError("Fill in program name and code in Quick Setup below.");
      return null;
    }

    const { data: prog, error: progErr } = await supabase
      .from("programs")
      .insert({
        name: quickSetup.progName.trim(),
        code: quickSetup.progCode.trim().toUpperCase(),
        department_id: deptId,
      })
      .select()
      .single();

    if (progErr) {
      setError(progErr.message);
      return null;
    }

    setPrograms((prev) => [...prev, prog]);
    setForm((f) => ({ ...f, program_id: prog.id }));
    return prog.id;
  }

  async function handleSave() {
    setError(null);

    if (!form.code.trim() || !form.name.trim() || !form.semester.trim()) {
      setError("Code, name, and semester are required.");
      return;
    }

    setSaving(true);

    const programId = await resolveProgramId();
    if (!programId) {
      setSaving(false);
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      credits: parseInt(form.credits, 10) || 3,
      semester: form.semester.trim(),
      program_id: programId,
      teacher_id: form.teacher_id || null,
    };

    const result = editing
      ? await supabase.from("courses").update(payload).eq("id", editing.id)
      : await supabase.from("courses").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
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

  function teacherName(course: Course): string {
    const t = course.teacher as {
      profile?: { full_name?: string } | { full_name?: string }[] | null;
    } | null;
    const profile = t?.profile;
    if (Array.isArray(profile)) return profile[0]?.full_name ?? "—";
    return profile?.full_name ?? "—";
  }

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;

    return courses.filter((c) => {
      const teacher = teacherName(c).toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.semester.toLowerCase().includes(q) ||
        (teacher !== "—" && teacher.includes(q))
      );
    });
  }, [courses, search]);

  return (
    <div>
      <Header title="Course Management" description="Create and manage university courses">
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Course" : "New Course"}</DialogTitle>
              <DialogDescription>
                Required fields are marked with *. If no program exists, use Quick Setup
                below or add one on the{" "}
                <Link href="/dashboard/programs" className="text-primary underline">
                  Programs
                </Link>{" "}
                page.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Code *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Semester *</Label>
                  <Input
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    placeholder="e.g. Fall 2025 or 6"
                  />
                </div>
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Credits</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Program *</Label>
                  {programs.length > 0 ? (
                    <Select
                      value={form.program_id}
                      onValueChange={(v) => setForm({ ...form, program_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No programs yet — use Quick Setup below.
                    </p>
                  )}
                </div>
              </div>

              {programs.length === 0 && !editing && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-primary">Quick Setup (first time)</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Dept. name</Label>
                      <Input
                        value={quickSetup.deptName}
                        onChange={(e) =>
                          setQuickSetup({ ...quickSetup, deptName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Dept. code</Label>
                      <Input
                        value={quickSetup.deptCode}
                        onChange={(e) =>
                          setQuickSetup({ ...quickSetup, deptCode: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Program name</Label>
                      <Input
                        value={quickSetup.progName}
                        onChange={(e) =>
                          setQuickSetup({ ...quickSetup, progName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Program code</Label>
                      <Input
                        value={quickSetup.progCode}
                        onChange={(e) =>
                          setQuickSetup({ ...quickSetup, progCode: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A department and program will be created automatically when you click Create.
                  </p>
                </div>
              )}

              <div>
                <Label>Teacher (optional)</Label>
                <Select
                  value={form.teacher_id || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, teacher_id: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No teacher</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editing ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>

      {programs.length === 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          Tip: Go to{" "}
          <Link href="/dashboard/programs" className="text-primary underline">
            Programs
          </Link>{" "}
          to add departments and programs, or use Quick Setup in the Add Course dialog.
        </p>
      )}

      <Card className="glass-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, name, semester, or teacher…"
                className="pl-9 pr-9"
              />
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground shrink-0">
              {search.trim()
                ? `${filteredCourses.length} of ${courses.length} courses`
                : `${courses.length} courses`}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Semester</TableHead>
                <TableHead className="hidden md:table-cell">Program</TableHead>
                <TableHead className="hidden md:table-cell">Teacher</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.semester}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {(c.program as Program)?.code ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {teacherName(c)}
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No courses yet. Add your first course.
                  </TableCell>
                </TableRow>
              )}
              {courses.length > 0 && filteredCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No courses match &quot;{search.trim()}&quot;. Try another search.
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
