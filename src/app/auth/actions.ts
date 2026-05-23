"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TABLES } from "@/lib/constants";
import type { RegisterInput } from "@/lib/validations/auth";
import {
  supportsTeacherApproval,
  upsertTeacherForRegistration,
} from "@/lib/api/teacher-registration";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type AuthActionResult = {
  error?: string;
  success?: string;
  /** True when email already exists — client can offer sign-in link */
  duplicateEmail?: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isDuplicateEmailError(message: string) {
  return /already been registered|already exists|duplicate/i.test(message);
}

const DUPLICATE_EMAIL_MESSAGE =
  "This email is already registered. Sign in with that email, or use Forgot password if you do not remember your password.";

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) return null;

    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;

    if (data.users.length < perPage) return null;
    page++;
  }

  return null;
}

async function resolveDepartmentId(
  admin: ReturnType<typeof createAdminClient>,
  departmentId?: string
) {
  if (departmentId) return departmentId;
  const { data } = await admin.from(TABLES.departments).select("id").limit(1).single();
  return data?.id ?? null;
}

async function upsertTeacherProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  input: RegisterInput
): Promise<AuthActionResult | null> {
  const deptId = await resolveDepartmentId(admin, input.department_id);
  const result = await upsertTeacherForRegistration(admin, userId, input, deptId);
  if (result.error) return { error: result.error };
  return null;
}

async function finishRegistration(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  input: RegisterInput
): Promise<AuthActionResult> {
  const email = normalizeEmail(input.email);

  const { error: profileErr } = await admin.from(TABLES.users).upsert(
    {
      id: userId,
      email,
      full_name: input.full_name,
      role: input.role,
      phone: input.phone ?? null,
      is_active: input.role === "student",
    },
    { onConflict: "id" }
  );

  if (profileErr) return { error: profileErr.message };

  if (input.role === "student" && input.roll_number && input.program_id) {
    const { error: stErr } = await admin.from(TABLES.students).upsert(
      {
        profile_id: userId,
        roll_number: input.roll_number.trim().toUpperCase(),
        program_id: input.program_id,
        batch_year: input.batch_year ?? new Date().getFullYear(),
      },
      { onConflict: "profile_id" }
    );
    if (stErr) return { error: stErr.message };
  }

  if (input.role === "teacher") {
    const teacherErr = await upsertTeacherProfile(admin, userId, input);
    if (teacherErr) return teacherErr;
  }

  const hasApproval =
    input.role === "teacher" ? await supportsTeacherApproval(admin) : false;

  return {
    success:
      input.role === "teacher"
        ? hasApproval
          ? "Account created. An admin must approve your teacher account before you can sign in."
          : "Account created. You can sign in now."
        : "Account created. You can sign in now.",
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthActionResult> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Server configuration error. Add SUPABASE_SERVICE_ROLE_KEY to .env.local",
    };
  }

  const email = normalizeEmail(input.email);

  const { data: existingProfile } = await admin
    .from(TABLES.users)
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    if (input.role === "teacher" && existingProfile.role === "teacher") {
      const teacherErr = await upsertTeacherProfile(admin, existingProfile.id, input);
      if (teacherErr?.error) return teacherErr;

      const hasApproval = await supportsTeacherApproval(admin);
      return {
        success: hasApproval
          ? "This email is already registered as a teacher. Sign in and wait for admin approval, or contact your admin if you cannot access your account."
          : "Your teacher profile is ready. Sign in with this email and your password.",
        duplicateEmail: true,
      };
    }

    return { error: DUPLICATE_EMAIL_MESSAGE, duplicateEmail: true };
  }

  const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      role: input.role,
      phone: input.phone ?? null,
      roll_number: input.role === "student" ? input.roll_number : null,
      program_id: input.role === "student" ? input.program_id : null,
      batch_year: input.role === "student" ? input.batch_year : null,
      department_id: input.role === "teacher" ? input.department_id : null,
    },
  });

  if (signUpError) {
    if (isDuplicateEmailError(signUpError.message)) {
      const existingAuthId = await findAuthUserIdByEmail(admin, email);
      if (existingAuthId && input.role === "teacher") {
        const result = await finishRegistration(admin, existingAuthId, input);
        if (!result.error) {
          return {
            ...result,
            success:
              "Your teacher profile was updated. Sign in with this email. An admin must approve your account before you can use the dashboard.",
            duplicateEmail: true,
          };
        }
      }

      return { error: DUPLICATE_EMAIL_MESSAGE, duplicateEmail: true };
    }

    return { error: signUpError.message };
  }

  return finishRegistration(admin, authData.user.id, input);
}

export async function requestPasswordReset(email: string): Promise<AuthActionResult> {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: "Check your email for a password reset link." };
}

export async function updatePassword(password: string): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: "Password updated successfully." };
}

export async function approveTeacher(
  teacherId: string,
  approve: boolean
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: adminProfile } = await supabase
    .from(TABLES.users)
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") return { error: "Admin only" };

  const status = approve ? "approved" : "rejected";

  const { data: teacher } = await supabase
    .from(TABLES.teachers)
    .select("profile_id")
    .eq("id", teacherId)
    .single();

  if (!teacher) return { error: "Teacher not found" };

  const { error } = await supabase
    .from(TABLES.teachers)
    .update({
      approval_status: status,
      approved_by: approve ? user.id : null,
      approved_at: approve ? new Date().toISOString() : null,
    })
    .eq("id", teacherId);

  if (error) return { error: error.message };

  await supabase
    .from(TABLES.users)
    .update({ is_active: approve })
    .eq("id", teacher.profile_id);

  return { success: approve ? "Teacher approved." : "Teacher rejected." };
}

/** Permanently remove a user (auth + profile). Admin only; uses service role. */
export async function deleteUser(targetUserId: string): Promise<AuthActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: adminProfile } = await supabase
    .from(TABLES.users)
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") return { error: "Admin only" };

  if (targetUserId === user.id) {
    return { error: "You cannot delete your own account." };
  }

  const { data: target } = await supabase
    .from(TABLES.users)
    .select("role, email, full_name")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!target) return { error: "User not found" };

  if (target.role === "admin") {
    const { count } = await supabase
      .from(TABLES.users)
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (count !== null && count <= 1) {
      return { error: "Cannot delete the only admin account." };
    }
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Server configuration error (SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) return { error: error.message };

  return {
    success: `Removed ${target.full_name} (${target.email}). They can register again with the same email if needed.`,
  };
}
