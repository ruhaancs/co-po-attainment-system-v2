"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserRole } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export interface LoginFormProps {
  role: UserRole;
  title: string;
  description: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: "Authentication failed. Please try again.",
  profile_missing:
    "Your account exists but has no profile. Contact an administrator.",
  account_disabled: "Your account has been disabled.",
  wrong_portal: "You are signed in with a different role. Use the correct portal.",
  unauthorized: "You do not have access to that page.",
};

export function LoginForm({ role, title, description }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const queryError = searchParams.get("error");
  const displayError =
    error ??
    (queryError ? ERROR_MESSAGES[queryError] ?? queryError : null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Sign in failed. Please try again.");
      setLoading(false);
      return;
    }

    const { data: userRow, error: profileError } = await supabase
      .from("users")
      .select("role, is_active, full_name")
      .eq("id", data.user.id)
      .single();

    let profile = userRow;

    if (profileError || !profile) {
      const { data: legacy } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", data.user.id)
        .single();
      profile = legacy
        ? { ...legacy, is_active: true }
        : null;
    }

    if (!profile) {
      await supabase.auth.signOut();
      setError(
        "No user profile found. Ask an admin to set up your account in Supabase."
      );
      setLoading(false);
      return;
    }

    if (profile.is_active === false) {
      await supabase.auth.signOut();
      setError("Your account has been disabled.");
      setLoading(false);
      return;
    }

    if (profile.role !== role) {
      await supabase.auth.signOut();
      setError(
        `This account is registered as ${profile.role}. Use the ${profile.role} login portal.`
      );
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get("redirect") || "/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  const otherPortals = (
    ["admin", "teacher", "student"] as UserRole[]
  ).filter((r) => r !== role);

  return (
    <Card className="glass-card w-full max-w-md border-primary/20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {displayError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {displayError}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Sign in as {role}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {otherPortals.map((r, i) => (
            <span key={r}>
              {i > 0 && " · "}
              <Link href={`/login/${r}`} className="underline hover:text-foreground">
                {r} login
              </Link>
            </span>
          ))}
        </p>
      </CardContent>
    </Card>
  );
}
