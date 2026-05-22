# CO-PO Attainment System

A full-stack university **Course Outcome (CO)** and **Program Outcome (PO)** attainment tracking system built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase**, and **Recharts**.

## Features

- **Role-based auth**: Admin, Teacher, and Student login portals
- **Session authentication** via Supabase Auth (cookie-based SSR)
- **Protected routes** with Next.js middleware and role checks
- **Dashboard** with role-specific navigation and stats
- **Course management** (CRUD)
- **CO-PO mapping** with correlation levels (1–3)
- **Marks entry** with assessments linked to COs
- **Attainment calculation** (weighted CO → mapped PO)
- **Analytics** with Recharts (bar, line, radial)
- **PDF report export** (jsPDF)
- **Responsive** purple dark UI (mobile sidebar)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |

## Project Structure

```
co-po-attainment-system-v2/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing
│   │   ├── login/                   # Auth portals
│   │   └── dashboard/               # Protected app
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── charts/
│   │   ├── courses/
│   │   ├── co-po/
│   │   ├── marks/
│   │   ├── attainment/
│   │   ├── analytics/
│   │   ├── reports/
│   │   ├── admin/
│   │   └── student/
│   ├── lib/
│   │   ├── supabase/                # Client, server, middleware
│   │   ├── attainment.ts            # Calculation engine
│   │   ├── pdf-export.ts
│   │   ├── auth.ts
│   │   └── types.ts
│   └── middleware.ts
├── supabase/
│   ├── schema.sql                   # Tables, RLS, triggers
│   └── seed.sql
└── .env.local.example
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Copy **Project URL** and **anon key** from Settings → API.

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run database migrations

In the Supabase SQL Editor, run:

1. `supabase/schema.sql` — creates tables, RLS, and profile trigger
2. `supabase/seed.sql` — sample departments, programs, POs

### 5. Create demo users

In Supabase **Authentication → Users**, create:

| Email | Role (set in raw metadata or update profiles) |
|-------|-----------------------------------------------|
| admin@university.edu | admin |
| teacher@university.edu | teacher |
| student@university.edu | student |

After signup, set roles in SQL:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@university.edu';
UPDATE profiles SET role = 'teacher' WHERE email = 'teacher@university.edu';
UPDATE profiles SET role = 'student' WHERE email = 'student@university.edu';
```

Link students to the `students` table:

```sql
INSERT INTO students (profile_id, roll_number, program_id)
SELECT id, 'CS2024001', (SELECT id FROM programs WHERE code = 'BTECH-CSE' LIMIT 1)
FROM profiles WHERE email = 'student@university.edu';
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Attainment Logic

- **CO attainment**: For each CO, assessments linked to that CO contribute a weighted average of `(marks / max_marks) × weight`.
- **PO attainment**: For each PO, sum `(CO attainment × correlation level)` / sum(correlation levels) across mapped COs.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## License

MIT
