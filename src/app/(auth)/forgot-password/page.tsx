"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { requestPasswordReset } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setLoading(true);
    const result = await requestPasswordReset(values.email);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Email sent", description: result.success, variant: "success" });
    }
  }

  return (
    <Card className="glass-card w-full max-w-md border-primary/20">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>We will send a reset link to your email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Send reset link
          </Button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-primary underline">Back to sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
