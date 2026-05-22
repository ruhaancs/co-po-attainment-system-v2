import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile.role} userName={profile.full_name} />
      <main className="flex-1 overflow-auto p-4 pt-16 sm:p-6 sm:pt-6 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
