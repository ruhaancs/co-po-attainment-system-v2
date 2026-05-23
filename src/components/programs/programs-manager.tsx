"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Department, Program } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export function ProgramsManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [progForm, setProgForm] = useState({ name: "", code: "", department_id: "" });

  const supabase = createClient();

  async function load() {
    const [dRes, pRes] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("programs").select("*, department:departments(*)").order("name"),
    ]);
    if (dRes.data) {
      setDepartments(dRes.data);
      if (!progForm.department_id && dRes.data[0]) {
        setProgForm((f) => ({ ...f, department_id: dRes.data![0].id }));
      }
    }
    if (pRes.data) setPrograms(pRes.data as Program[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function addDept() {
    setError(null);
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      setError("Department name and code are required.");
      return;
    }
    const { error: err } = await supabase.from("departments").insert({
      name: deptForm.name.trim(),
      code: deptForm.code.trim().toUpperCase(),
    });
    if (err) {
      setError(err.message);
      return;
    }
    setDeptForm({ name: "", code: "" });
    load();
  }

  async function addProg() {
    setError(null);
    if (!progForm.name.trim() || !progForm.code.trim() || !progForm.department_id) {
      setError("Program name, code, and department are required.");
      return;
    }
    const { error: err } = await supabase.from("programs").insert({
      name: progForm.name.trim(),
      code: progForm.code.trim().toUpperCase(),
      department_id: progForm.department_id,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setProgForm({ name: "", code: "", department_id: departments[0]?.id ?? "" });
    load();
  }

  async function deleteProg(id: string) {
    if (!confirm("Delete this program?")) return;
    await supabase.from("programs").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <Header
        title="Programs"
        description="Manage academic programs — required before adding courses"
      />

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Add Department</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Input
              placeholder="Department name"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            />
            <Input
              placeholder="Code (CSE)"
              className="max-w-[120px]"
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
            />
            <Button size="sm" onClick={addDept}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Add Program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Program name"
                value={progForm.name}
                onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
              />
              <Input
                placeholder="Code"
                className="max-w-[120px]"
                value={progForm.code}
                onChange={(e) => setProgForm({ ...progForm, code: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={progForm.department_id}
                onValueChange={(v) => setProgForm({ ...progForm, department_id: v })}
              >
                <SelectTrigger className="max-w-[200px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addProg} disabled={departments.length === 0}>
                <Plus className="h-4 w-4" /> Add Program
              </Button>
            </div>
            {departments.length === 0 && (
              <p className="text-sm text-muted-foreground">Add a department first.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card mt-6">
        <CardHeader>
          <CardTitle className="text-base">All Programs</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.code}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    {(p.department as Department)?.code ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteProg(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No programs yet. Add a department, then a program.
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
