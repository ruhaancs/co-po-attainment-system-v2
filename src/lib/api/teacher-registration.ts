import type { SupabaseClient } from "@supabase/supabase-js";
import { TABLES } from "@/lib/constants";
import type { RegisterInput } from "@/lib/validations/auth";

let approvalColumnSupported: boolean | null = null;

export async function supportsTeacherApproval(
  admin: SupabaseClient
): Promise<boolean> {
  if (approvalColumnSupported !== null) return approvalColumnSupported;

  const { error } = await admin.from(TABLES.teachers).select("approval_status").limit(1);
  approvalColumnSupported = !error?.message?.includes("approval_status");
  return approvalColumnSupported;
}

export function buildEmployeeId(userId: string) {
  return `EMP-${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function isApprovalColumnError(message?: string) {
  return Boolean(message?.includes("approval_status"));
}

export type TeacherUpsertResult = { error?: string };

/** Create/update teacher row; works with or without approval_status migration. */
export async function upsertTeacherForRegistration(
  admin: SupabaseClient,
  userId: string,
  input: RegisterInput,
  departmentId: string | null
): Promise<TeacherUpsertResult> {
  const hasApproval = await supportsTeacherApproval(admin);

  const base = {
    profile_id: userId,
    employee_id: buildEmployeeId(userId),
    department_id: departmentId,
  };

  const withApproval = { ...base, approval_status: "pending" as const };

  let { error } = await admin
    .from(TABLES.teachers)
    .upsert(hasApproval ? withApproval : base, { onConflict: "profile_id" });

  if (error && hasApproval && error.message.includes("approval_status")) {
    approvalColumnSupported = false;
    ({ error } = await admin.from(TABLES.teachers).upsert(base, { onConflict: "profile_id" }));
  }

  if (error) return { error: error.message };

  const { error: userErr } = await admin
    .from(TABLES.users)
    .update({
      is_active: hasApproval ? false : true,
      role: "teacher",
      full_name: input.full_name,
      phone: input.phone ?? null,
    })
    .eq("id", userId);

  if (userErr) return { error: userErr.message };

  return {};
}
