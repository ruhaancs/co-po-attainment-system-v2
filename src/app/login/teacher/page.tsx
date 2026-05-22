import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { LoginFormWrapper } from "@/components/auth/login-form-wrapper";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function TeacherLoginPage() {
  await redirectIfAuthenticated("teacher");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="text-sm">CO-PO Attainment</span>
      </Link>
      <LoginFormWrapper
        role="teacher"
        title="Teacher Login"
        description="Manage courses, marks, and attainment for your classes"
      />
    </main>
  );
}
