"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { UserRole } from "@/lib/types";

function BannerInner({ role, email }: { role: UserRole; email: string }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error !== "unauthorized") return null;

  return (
    <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
      You don&apos;t have permission to view that page as {role} ({email}).
    </div>
  );
}

export function AuthBanner({ role, email }: { role: UserRole; email: string }) {
  return (
    <Suspense fallback={null}>
      <BannerInner role={role} email={email} />
    </Suspense>
  );
}
