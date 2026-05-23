import { TABLES } from "@/lib/constants";
import type { Profile, UserRole } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getProfileById(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from(TABLES.users)
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function updateUserRole(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
) {
  return supabase.from(TABLES.users).update({ role }).eq("id", userId);
}

export async function setUserActive(
  supabase: SupabaseClient,
  userId: string,
  is_active: boolean
) {
  return supabase.from(TABLES.users).update({ is_active }).eq("id", userId);
}

export async function listProfiles(supabase: SupabaseClient) {
  return supabase.from(TABLES.users).select("*").order("full_name");
}
