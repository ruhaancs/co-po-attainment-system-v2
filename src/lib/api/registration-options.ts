import { TABLES } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Department, Program } from "@/lib/types";

export type RegistrationOptions = {
  programs: Program[];
  departments: Department[];
  error?: string;
};

/** Departments/programs for registration (anon users cannot pass RLS on client). */
export async function getRegistrationOptions(): Promise<RegistrationOptions> {
  try {
    const admin = createAdminClient();
    const [programsRes, departmentsRes] = await Promise.all([
      admin.from(TABLES.programs).select("*").order("name"),
      admin.from(TABLES.departments).select("*").order("name"),
    ]);

    if (programsRes.error || departmentsRes.error) {
      return {
        programs: [],
        departments: [],
        error: programsRes.error?.message ?? departmentsRes.error?.message,
      };
    }

    return {
      programs: (programsRes.data ?? []) as Program[],
      departments: (departmentsRes.data ?? []) as Department[],
    };
  } catch (e) {
    return {
      programs: [],
      departments: [],
      error: e instanceof Error ? e.message : "Failed to load registration options",
    };
  }
}
