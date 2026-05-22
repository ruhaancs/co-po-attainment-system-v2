"use client";

import { Suspense } from "react";
import { LoginForm, type LoginFormProps } from "./login-form";

export function LoginFormWrapper(props: LoginFormProps) {
  return (
    <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-xl bg-card" />}>
      <LoginForm {...props} />
    </Suspense>
  );
}
