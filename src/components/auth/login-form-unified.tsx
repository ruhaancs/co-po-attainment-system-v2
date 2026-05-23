"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/constants";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function LoginFormUnified() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });

    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!data.user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from(TABLES.users)
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      toast({
        title: "Profile missing",
        description: "Contact administrator to complete your account setup.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (profile.is_active === false) {
      await supabase.auth.signOut();
      const msg =
        profile.role === "teacher"
          ? "Your teacher account is pending admin approval."
          : "Your account has been disabled.";
      toast({ title: "Cannot sign in", description: msg, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (profile.role === "teacher") {
      const { data: teacher, error: teacherErr } = await supabase
        .from(TABLES.teachers)
        .select("approval_status")
        .eq("profile_id", data.user.id)
        .maybeSingle();

      if (teacherErr?.message?.includes("approval_status")) {
        toast({ title: "Welcome back", description: `Signed in as ${profile.role}`, variant: "success" });
        router.push("/dashboard");
        router.refresh();
        setLoading(false);
        return;
      }

      if (!teacher) {
        await supabase.auth.signOut();
        toast({
          title: "Teacher profile incomplete",
          description: "Try registering again or contact your administrator.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (teacher?.approval_status === "pending") {
        await supabase.auth.signOut();
        toast({
          title: "Pending approval",
          description: "An administrator must approve your teacher account first.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (teacher?.approval_status === "rejected") {
        await supabase.auth.signOut();
        toast({
          title: "Account rejected",
          description: "Your teacher registration was not approved.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    toast({ title: "Welcome back", description: `Signed in as ${profile.role}`, variant: "success" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="glass-card w-full max-w-md border-primary/20">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>University CO-PO Attainment System</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input type="password" autoComplete="current-password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Sign in
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="text-primary underline">
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
