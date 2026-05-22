"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateCoAttainment, calculatePoAttainment } from "@/lib/attainment";
import type {
  Assessment,
  CoAttainment,
  CoPoMapping,
  Course,
  CourseOutcome,
  Mark,
  PoAttainment,
  ProgramOutcome,
} from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CoAttainmentBarChart,
  AttainmentSummaryCards,
} from "@/components/charts/attainment-charts";
import { formatPercent } from "@/lib/utils";

export function AttainmentViewer() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [coResults, setCoResults] = useState<CoAttainment[]>([]);
  const [poResults, setPoResults] = useState<PoAttainment[]>([]);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => {
      if (data) setCourses(data);
    });
  }, []);

  useEffect(() => {
    if (selectedCourse) calculate();
  }, [selectedCourse]);

  async function calculate() {
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

    const outcomes = (coRes.data ?? []) as CourseOutcome[];
    const assessments = (assessRes.data ?? []) as Assessment[];
    const studentIds = enrollRes.data?.map((e) => e.student_id) ?? [];
    const assessmentIds = assessments.map((a) => a.id);

    let marks: Mark[] = [];
    if (studentIds.length && assessmentIds.length) {
      const { data } = await supabase
        .from("marks")
        .select("*")
        .in("student_id", studentIds)
        .in("assessment_id", assessmentIds);
      marks = (data ?? []) as Mark[];
    }

    const coAtt = calculateCoAttainment(outcomes, assessments, marks);
    const poAtt = calculatePoAttainment(
      coAtt,
      (mapRes.data ?? []) as CoPoMapping[],
      (poRes.data ?? []) as ProgramOutcome[]
    );

    setCoResults(coAtt);
    setPoResults(poAtt);
  }

  return (
    <div>
      <Header
        title="Attainment Calculation"
        description="Weighted CO attainment from assessments; PO derived via CO-PO mapping"
      />

      <div className="mb-6">
        <Label className="mb-2 block">Course</Label>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Select course to calculate" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCourse && coResults.length > 0 && (
        <div className="space-y-6">
          <AttainmentSummaryCards data={coResults} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">CO Attainment Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <CoAttainmentBarChart data={coResults} />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">CO Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CO</TableHead>
                      <TableHead>Attainment</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coResults.map((co) => (
                      <TableRow key={co.co_id}>
                        <TableCell className="font-medium">{co.co_number}</TableCell>
                        <TableCell>{formatPercent(co.attainment)}</TableCell>
                        <TableCell>{formatPercent(co.target)}</TableCell>
                        <TableCell>
                          <Badge variant={co.met ? "success" : "warning"}>
                            {co.met ? "Met" : "Not Met"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Program Outcome Attainment</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO</TableHead>
                    <TableHead>Attainment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poResults.map((po) => (
                    <TableRow key={po.po_id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{formatPercent(po.attainment)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedCourse && coResults.length === 0 && (
        <p className="text-muted-foreground">
          No course outcomes defined. Add COs in CO-PO Mapping first.
        </p>
      )}
    </div>
  );
}
