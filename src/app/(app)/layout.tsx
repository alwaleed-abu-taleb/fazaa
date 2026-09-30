import { getCurrentUser } from "@/server/auth";
import { AppHeader } from "@/features/dashboard/components/AppHeader";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import masterMark from "../../../public/logo/master-mark.svg";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const role = user?.role ?? "VOLUNTEER";

  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-svh flex-col bg-background"
      suppressHydrationWarning
    >
      <AppHeader name={user?.name} role={role} masterMark={masterMark} />
      <div className="flex flex-1">
        {user && <DashboardSidebar role={role} />}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[72rem] px-4 py-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
