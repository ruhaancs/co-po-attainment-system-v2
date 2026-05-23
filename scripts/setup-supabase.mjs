/**
 * One-command Supabase setup: demo users, roles, departments, programs, sample course.
 * Run: npm run setup
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) {
    console.error("Missing .env.local — add Supabase URL and keys first.");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i)] = t.slice(i + 1);
  }
  return env;
}

const DEMO_USERS = [
  {
    email: "admin@university.edu",
    password: "Admin@123",
    full_name: "System Admin",
    role: "admin",
  },
  {
    email: "teacher@university.edu",
    password: "Teacher@123",
    full_name: "Dr. Priya Sharma",
    role: "teacher",
    employee_id: "EMP-T001",
  },
  {
    email: "student@university.edu",
    password: "Student@123",
    full_name: "Rahul Verma",
    role: "student",
    roll_number: "CS2024001",
  },
];

const DEPT = { name: "Computer Science & Engineering", code: "CSE" };
const PROG = { name: "B.Tech Computer Science", code: "BTECH-CSE" };

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n🎓 CO-PO Attainment — Supabase Setup\n");

  // --- Auth users ---
  const userIds = {};

  for (const demo of DEMO_USERS) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === demo.email);

    if (existing) {
      userIds[demo.email] = existing.id;
      await supabase.auth.admin.updateUserById(existing.id, {
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name, role: demo.role },
      });
      console.log(`✓ Auth user exists: ${demo.email}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name, role: demo.role },
      });
      if (error) {
        console.error(`✗ Failed to create ${demo.email}:`, error.message);
        continue;
      }
      userIds[demo.email] = data.user.id;
      console.log(`✓ Created auth user: ${demo.email}`);
    }
  }

  // --- users table (try users, fallback profiles) ---
  const userTable = async () => {
    const test = await supabase.from("users").select("id").limit(1);
    if (!test.error) return "users";
    return "profiles";
  };
  const table = await userTable();
  console.log(`✓ Using table: ${table}`);

  for (const demo of DEMO_USERS) {
    const id = userIds[demo.email];
    if (!id) continue;
    const { error } = await supabase.from(table).upsert(
      {
        id,
        email: demo.email,
        full_name: demo.full_name,
        role: demo.role,
        is_active: true,
      },
      { onConflict: "id" }
    );
    if (error) console.warn(`  warn ${demo.email} profile:`, error.message);
    else console.log(`✓ Profile (${demo.role}): ${demo.email}`);
  }

  // --- Department ---
  let deptId;
  const { data: existingDept } = await supabase
    .from("departments")
    .select("id")
    .eq("code", DEPT.code)
    .maybeSingle();

  if (existingDept) {
    deptId = existingDept.id;
    console.log(`✓ Department exists: ${DEPT.code}`);
  } else {
    const { data, error } = await supabase
      .from("departments")
      .insert(DEPT)
      .select("id")
      .single();
    if (error) {
      console.error("✗ Department:", error.message);
    } else {
      deptId = data.id;
      console.log(`✓ Created department: ${DEPT.code}`);
    }
  }

  // --- Program ---
  let progId;
  const { data: existingProg } = await supabase
    .from("programs")
    .select("id")
    .eq("code", PROG.code)
    .maybeSingle();

  if (existingProg) {
    progId = existingProg.id;
    console.log(`✓ Program exists: ${PROG.code}`);
  } else if (deptId) {
    const { data, error } = await supabase
      .from("programs")
      .insert({ ...PROG, department_id: deptId })
      .select("id")
      .single();
    if (error) console.error("✗ Program:", error.message);
    else {
      progId = data.id;
      console.log(`✓ Created program: ${PROG.code}`);
    }
  }

  // --- Program outcomes (12 POs) ---
  if (progId) {
    const pos = Array.from({ length: 12 }, (_, i) => ({
      program_id: progId,
      po_number: `PO${i + 1}`,
      description: `Program Outcome ${i + 1}`,
    }));
    for (const po of pos) {
      await supabase.from("program_outcomes").upsert(po, {
        onConflict: "program_id,po_number",
      });
    }
    console.log("✓ Program outcomes (PO1–PO12)");
  }

  // --- Teacher record ---
  const teacherId = userIds["teacher@university.edu"];
  if (teacherId && deptId) {
    const { error } = await supabase.from("teachers").upsert(
      {
        profile_id: teacherId,
        employee_id: "EMP-T001",
        department_id: deptId,
        designation: "Associate Professor",
      },
      { onConflict: "profile_id" }
    );
    if (error) console.warn("  teachers:", error.message);
    else console.log("✓ Teacher record linked");
  }

  // --- Student record ---
  const studentUserId = userIds["student@university.edu"];
  let studentRowId;
  if (studentUserId && progId) {
    const { data: st } = await supabase
      .from("students")
      .upsert(
        {
          profile_id: studentUserId,
          roll_number: "CS2024001",
          program_id: progId,
          batch_year: 2024,
        },
        { onConflict: "profile_id" }
      )
      .select("id")
      .single();
    if (st) {
      studentRowId = st.id;
      console.log("✓ Student record linked");
    }
  }

  // --- Sample course ---
  let courseId;
  const { data: teachRow } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", teacherId)
    .maybeSingle();

  if (progId) {
    const { data: existingCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("code", "CS301")
      .eq("semester", "Fall 2025")
      .maybeSingle();

    if (existingCourse) {
      courseId = existingCourse.id;
      console.log("✓ Sample course exists: CS301");
    } else {
      const { data, error } = await supabase
        .from("courses")
        .insert({
          code: "CS301",
          name: "Data Structures & Algorithms",
          credits: 4,
          semester: "Fall 2025",
          program_id: progId,
          teacher_id: teachRow?.id ?? null,
        })
        .select("id")
        .single();
      if (error) console.warn("  course:", error.message);
      else {
        courseId = data.id;
        console.log("✓ Created sample course: CS301");
      }
    }
  }

  // COs for sample course
  if (courseId) {
    const cos = [
      { course_id: courseId, co_number: "CO1", description: "Apply data structures", target_attainment: 0.6 },
      { course_id: courseId, co_number: "CO2", description: "Analyze algorithm complexity", target_attainment: 0.65 },
      { course_id: courseId, co_number: "CO3", description: "Use modern programming tools", target_attainment: 0.6 },
    ];
    for (const co of cos) {
      await supabase.from("course_outcomes").upsert(co, {
        onConflict: "course_id,co_number",
      });
    }
    console.log("✓ Course outcomes CO1–CO3");
  }

  // Enroll student
  if (courseId && studentRowId) {
    await supabase.from("enrollments").upsert(
      { student_id: studentRowId, course_id: courseId },
      { onConflict: "student_id,course_id" }
    );
    console.log("✓ Student enrolled in CS301");
  }

  console.log("\n════════════════════════════════════════════");
  console.log("  LOGIN CREDENTIALS (save these)");
  console.log("════════════════════════════════════════════");
  console.log("  Admin:   admin@university.edu   / Admin@123");
  console.log("           → http://localhost:3000/login/admin");
  console.log("  Teacher: teacher@university.edu / Teacher@123");
  console.log("           → http://localhost:3000/login/teacher");
  console.log("  Student: student@university.edu / Student@123");
  console.log("           → http://localhost:3000/login/student");
  console.log("════════════════════════════════════════════\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
