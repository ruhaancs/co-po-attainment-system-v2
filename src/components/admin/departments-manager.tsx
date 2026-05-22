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
import { Plus, Trash2 } from "lucide-react";

export function DepartmentsManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [progForm, setProgForm] = useState({ name: "", code: "", department_id: "" });

  const supabase = createClient();

  async function load() {
    const [dRes, pRes] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("programs").select("*, department:departments(*)").order("name"),
    ]);
    if (dRes.data) setDepartments(dRes.data);
    if (pRes.data) setPrograms(pRes.data as Program[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function addDept() {
    await supabase.from("departments").insert(deptForm);
    setDeptForm({ name: "", code: "" });
    load();
  }

  async function addProg() {
    await supabase.from("programs").insert(progForm);
    setProgForm({ name: "", code: "", department_id: "" });
    load();
  }

  async function deleteDept(id: string) {
    if (!confirm("Delete department?")) return;
    await supabase.from("departments").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <Header title="Departments & Programs" description="Organize academic structure" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Departments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
              <Input placeholder="Code" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} className="max-w-[100px]" />
              <Button size="sm" onClick={addDept}><Plus className="h-4 w-4" /> Add</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.code}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteDept(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Programs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Program name" value={progForm.name} onChange={(e) => setProgForm({ ...progForm, name: e.target.value })} />
              <Input placeholder="Code" value={progForm.code} onChange={(e) => setProgForm({ ...progForm, code: e.target.value })} className="max-w-[100px]" />
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={progForm.department_id}
                onChange={(e) => setProgForm({ ...progForm, department_id: e.target.value })}
              >
                <option value="">Dept</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code}</option>
                ))}
              </select>
              <Button size="sm" onClick={addProg}><Plus className="h-4 w-4" /> Add</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.code}</TableCell>
                    <TableCell>{p.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
