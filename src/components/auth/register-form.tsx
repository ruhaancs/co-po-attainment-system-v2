"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerUser } from "@/app/auth/actions";
import type { Program, Department } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type RegisterFormProps = {
  initialPrograms: Program[];
  initialDepartments: Department[];
  loadError?: string;
};

export function RegisterForm({
  initialPrograms,
  initialDepartments,
  loadError,
}: RegisterFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "student",
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const role = form.watch("role");
  const programId = form.watch("program_id");
  const departmentId = form.watch("department_id");

  async function onSubmit(values: RegisterInput) {
    setSubmitting(true);
    const result = await registerUser(values);
    setSubmitting(false);

    if (result.error) {
      toast({ title: "Registration failed", description: result.error, variant: "destructive" });
      if (result.duplicateEmail) {
        setTimeout(() => router.push("/login"), 2500);
      }
      return;
    }

    toast({ title: "Success", description: result.success, variant: "success" });
    router.push("/login");
  }

  const noPrograms = role === "student" && initialPrograms.length === 0;
  const noDepartments = role === "teacher" && initialDepartments.length === 0;

  return (
    <Card className="glass-card w-full max-w-lg border-primary/20">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Register as a student or teacher. Admin accounts are created by the university IT team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadError && (
          <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Could not load programs or departments: {loadError}
          </p>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>I am a</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                form.setValue("role", v as "teacher" | "student");
                form.setValue("program_id", undefined);
                form.setValue("department_id", undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Full name</Label>
            <Input {...form.register("full_name")} />
            {form.formState.errors.full_name && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.full_name.message}</p>
            )}
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} placeholder="you@university.edu" />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label>Phone (optional)</Label>
            <Input {...form.register("phone")} />
          </div>

          {role === "student" && (
            <>
              <div>
                <Label>Roll number</Label>
                <Input {...form.register("roll_number")} placeholder="CS2024001" />
                {form.formState.errors.roll_number && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.roll_number.message}</p>
                )}
              </div>
              <div>
                <Label>Program</Label>
                <Select
                  value={programId ?? undefined}
                  onValueChange={(v) =>
                    form.setValue("program_id", v, { shouldValidate: true })
                  }
                  disabled={noPrograms}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={noPrograms ? "No programs available" : "Select program"} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[100]">
                    {initialPrograms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {noPrograms && (
                  <p className="text-xs text-muted-foreground mt-1">
                    An admin must add programs first (Dashboard → Programs), or run{" "}
                    <code className="text-xs">supabase/seed.sql</code> in Supabase.
                  </p>
                )}
                {form.formState.errors.program_id && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.program_id.message}</p>
                )}
              </div>
            </>
          )}

          {role === "teacher" && (
            <div>
              <Label>Department</Label>
              <Select
                value={departmentId ?? undefined}
                onValueChange={(v) =>
                  form.setValue("department_id", v, { shouldValidate: true })
                }
                disabled={noDepartments}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={noDepartments ? "No departments available" : "Select department"}
                  />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  {initialDepartments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {noDepartments && (
                <p className="text-xs text-muted-foreground mt-1">
                  An admin must add departments first (Dashboard → Departments), or run{" "}
                  <code className="text-xs">supabase/seed.sql</code> in Supabase.
                </p>
              )}
              {form.formState.errors.department_id && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.department_id.message}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || noPrograms || noDepartments}
          >
            {submitting && <Loader2 className="animate-spin" />}
            Create account
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
