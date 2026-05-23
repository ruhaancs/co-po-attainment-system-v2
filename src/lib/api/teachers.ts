import { TABLES } from "@/lib/constants";
import type { ApprovalStatus } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function listTeachersWithProfiles(supabase: SupabaseClient) {
  return supabase
    .from(TABLES.teachers)
    .select("*, profile:users(id, email, full_name, role, is_active)")
    .order("created_at", { ascending: false });
}

export async function updateTeacherApproval(
  supabase: SupabaseClient,
  teacherId: string,
  status: ApprovalStatus,
  approvedBy: string
) {
  return supabase
    .from(TABLES.teachers)
    .update({
      approval_status: status,
      approved_by: status === "approved" ? approvedBy : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", teacherId);
}

export async function getTeacherByProfileId(
  supabase: SupabaseClient,
  profileId: string
) {
  return supabase
    .from(TABLES.teachers)
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
}
