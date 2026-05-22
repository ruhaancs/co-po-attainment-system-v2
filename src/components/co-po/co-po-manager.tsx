"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Course, CourseOutcome, ProgramOutcome, CoPoMapping } from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

export function CoPoManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [cos, setCos] = useState<CourseOutcome[]>([]);
  const [pos, setPos] = useState<ProgramOutcome[]>([]);
  const [mappings, setMappings] = useState<CoPoMapping[]>([]);
  const [coForm, setCoForm] = useState({ co_number: "", description: "", target_attainment: "0.6" });
  const [mapForm, setMapForm] = useState({ co_id: "", po_id: "", correlation_level: "2" });

  const supabase = createClient();

  useEffect(() => {
    supabase.from("courses").select("*, program:programs(*)").then(({ data }) => {
      if (data) setCourses(data as Course[]);
    });
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    loadCourseData();
  }, [selectedCourse]);

  async function loadCourseData() {
    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) return;

    const [coRes, mapRes, poRes] = await Promise.all([
      supabase.from("course_outcomes").select("*").eq("course_id", selectedCourse),
      supabase
        .from("co_po_mappings")
        .select("*, course_outcome:course_outcomes(*), program_outcome:program_outcomes(*)")
        .in("co_id", (await supabase.from("course_outcomes").select("id").eq("course_id", selectedCourse)).data?.map((c) => c.id) ?? []),
      supabase.from("program_outcomes").select("*").eq("program_id", course.program_id),
    ]);

    if (coRes.data) setCos(coRes.data);
    if (poRes.data) setPos(poRes.data);
    if (mapRes.data) setMappings(mapRes.data as CoPoMapping[]);
  }

  async function addCO() {
    await supabase.from("course_outcomes").insert({
      course_id: selectedCourse,
      co_number: coForm.co_number,
      description: coForm.description,
      target_attainment: parseFloat(coForm.target_attainment),
    });
    setCoForm({ co_number: "", description: "", target_attainment: "0.6" });
    loadCourseData();
  }

  async function addMapping() {
    await supabase.from("co_po_mappings").insert({
      co_id: mapForm.co_id,
      po_id: mapForm.po_id,
      correlation_level: parseInt(mapForm.correlation_level, 10),
    });
    setMapForm({ co_id: "", po_id: "", correlation_level: "2" });
    loadCourseData();
  }

  async function deleteMapping(id: string) {
    await supabase.from("co_po_mappings").delete().eq("id", id);
    loadCourseData();
  }

  return (
    <div>
      <Header title="CO-PO Mapping" description="Define course outcomes and map them to program outcomes" />

      <div className="mb-6">
        <Label className="mb-2 block">Select Course</Label>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Choose a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCourse && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Course Outcomes (CO)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input placeholder="CO1" value={coForm.co_number} onChange={(e) => setCoForm({ ...coForm, co_number: e.target.value })} />
                <Input placeholder="Description" className="sm:col-span-2" value={coForm.description} onChange={(e) => setCoForm({ ...coForm, description: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Input type="number" step="0.05" min="0" max="1" placeholder="Target 0.6" value={coForm.target_attainment} onChange={(e) => setCoForm({ ...coForm, target_attainment: e.target.value })} className="max-w-[120px]" />
                <Button size="sm" onClick={addCO}><Plus className="h-4 w-4" /> Add CO</Button>
              </div>
              <ul className="space-y-2 text-sm">
                {cos.map((co) => (
                  <li key={co.id} className="rounded-lg border border-border/50 px-3 py-2">
                    <span className="font-medium text-primary">{co.co_number}</span> — {co.description}
                    <Badge variant="outline" className="ml-2">Target {(co.target_attainment * 100).toFixed(0)}%</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">CO → PO Mappings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Select value={mapForm.co_id} onValueChange={(v) => setMapForm({ ...mapForm, co_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Course Outcome" /></SelectTrigger>
                  <SelectContent>
                    {cos.map((co) => (
                      <SelectItem key={co.id} value={co.id}>{co.co_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mapForm.po_id} onValueChange={(v) => setMapForm({ ...mapForm, po_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Program Outcome" /></SelectTrigger>
                  <SelectContent>
                    {pos.map((po) => (
                      <SelectItem key={po.id} value={po.id}>{po.po_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mapForm.correlation_level} onValueChange={(v) => setMapForm({ ...mapForm, correlation_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Correlation (1-3)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low (1)</SelectItem>
                    <SelectItem value="2">Medium (2)</SelectItem>
                    <SelectItem value="3">High (3)</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={addMapping}><Plus className="h-4 w-4" /> Add Mapping</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CO</TableHead>
                    <TableHead>PO</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.course_outcome?.co_number}</TableCell>
                      <TableCell>{m.program_outcome?.po_number}</TableCell>
                      <TableCell><Badge>{m.correlation_level}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteMapping(m.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
