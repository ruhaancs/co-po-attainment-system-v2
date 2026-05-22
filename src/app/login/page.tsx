import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";

export default async function LoginHubPage() {
  const session = await getSessionUser();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="text-sm">CO-PO Attainment</span>
      </Link>
      <Card className="glass-card w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <CardTitle>Choose your portal</CardTitle>
          <CardDescription>Select how you want to sign in</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/login/admin">Admin Login</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/login/teacher">Teacher Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login/student">Student Login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
