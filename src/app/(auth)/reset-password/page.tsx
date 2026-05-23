"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { updatePassword } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setLoading(true);
    const result = await updatePassword(values.password);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Done", description: result.success, variant: "success" });
    router.push("/login");
  }

  return (
    <Card className="glass-card w-full max-w-md border-primary/20">
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>New password</Label>
            <Input type="password" {...form.register("password")} />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input type="password" {...form.register("confirmPassword")} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Update password
          </Button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-primary underline">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
