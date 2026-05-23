import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/40 bg-card/20 px-4 py-4 backdrop-blur-sm">
        <Link href="/" className="mx-auto flex max-w-lg items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold">CO-PO Attainment</span>
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
