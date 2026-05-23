# Deployment Guide — CO-PO Attainment System

## Stack

- **Frontend:** Next.js 14 (Vercel)
- **Backend/DB/Auth:** Supabase (PostgreSQL + Auth + RLS)

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** — run in order:
   - `supabase/schema.sql` (fresh project)
   - `supabase/migrations/001_production_upgrade.sql` (existing project)
   - `supabase/seed.sql` (optional sample data)
3. **Authentication → URL configuration:**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`, `https://your-app.vercel.app/reset-password`
4. **Authentication → Providers:** enable Email.
5. Create **one admin** via dashboard or `npm run setup` (optional).

---

## 2. Environment variables

Copy `.env.local.example` → `.env.local` (local) and add the same keys in **Vercel → Settings → Environment Variables**:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server only — never expose to client) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` or production URL |

---

## 3. Local development

```bash
npm install
npm run dev
```

- Home: http://localhost:3000
- Register: http://localhost:3000/register
- Login: http://localhost:3000/login

### Optional scripts

```bash
npm run setup    # Seed demo admin + sample data (dev only)
npm run build    # Production build check
```

---

## 4. Vercel deployment

1. Push repo to GitHub.
2. Import project in [vercel.com](https://vercel.com).
3. Framework: **Next.js** (auto-detected).
4. Add all environment variables from section 2.
5. Deploy.

Post-deploy: update Supabase Auth redirect URLs to your Vercel domain.

---

## 5. Registration & roles

| Role | How to get access |
|------|-------------------|
| **Student** | Self-register at `/register` with roll number + program |
| **Teacher** | Self-register → **pending** until admin approves in **Users** |
| **Admin** | Created manually in Supabase Auth + `UPDATE users SET role = 'admin'` |

No shared demo passwords in production — users create their own accounts.

---

## 6. Folder structure

```
src/
├── app/
│   ├── (auth)/          # login, register, forgot/reset password
│   ├── auth/            # callback, server actions
│   └── dashboard/       # protected ERP pages
├── components/
│   ├── admin/           # users, departments
│   ├── auth/            # forms
│   ├── ui/              # shadcn primitives
│   └── ...
├── hooks/               # useToast, etc.
├── lib/
│   ├── api/             # Supabase query helpers
│   ├── validations/     # Zod schemas
│   ├── constants.ts     # table names
│   └── auth.ts          # session + RBAC
└── middleware.ts          # route protection

supabase/
├── schema.sql
├── migrations/
└── seed.sql
```

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| 400 on insert | Run migration SQL; ensure `program_id` is set |
| Teacher cannot login | Admin must approve in **Users → Pending teachers** |
| Password reset fails | Set `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs |
| RLS errors | Run `supabase/policies-teacher-academic.sql` |
