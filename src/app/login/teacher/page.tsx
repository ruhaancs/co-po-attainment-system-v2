import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { GraduationCap } from "lucide-react";

export default function TeacherLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="text-sm">CO-PO Attainment</span>
      </Link>
      <LoginForm
        role="teacher"
        title="Teacher Login"
        description="Manage courses, marks, and attainment for your classes"
      />
    </main>
  );
}
