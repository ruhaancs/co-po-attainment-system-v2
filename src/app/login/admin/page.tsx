import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { LoginFormWrapper } from "@/components/auth/login-form-wrapper";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function AdminLoginPage() {
  await redirectIfAuthenticated("admin");

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
        role="admin"
        title="Admin Login"
        description="Sign in to manage the university CO-PO system"
      />
    </main>
  );
}
