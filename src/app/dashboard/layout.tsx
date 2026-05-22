import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthBanner } from "@/components/auth/auth-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar role={session.role} userName={session.full_name} />
      <main className="flex-1 overflow-auto p-4 pt-16 sm:p-6 sm:pt-6 lg:pt-6">
        <AuthBanner role={session.role} email={session.email} />
        {children}
      </main>
    </div>
  );
}
