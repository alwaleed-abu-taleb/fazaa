"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { signOutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

/** Shared between the desktop sidebar and the mobile drawer. */
export function navItems(role: Role): NavItem[] {
  return [
    { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/events", label: "الأحداث", icon: CalendarDays },
    { href: "/tasks", label: "المهام", icon: ClipboardList },
    // Verification review is gated to organizers/admins by the page itself;
    // hiding the link keeps volunteers out of a dead-end.
    ...(role === "ORGANIZER" || role === "ADMIN"
      ? [{ href: "/verify", label: "التحقق", icon: ShieldCheck } satisfies NavItem]
      : []),
    { href: "/profile", label: "الملف الشخصي", icon: User },
  ];
}

export function isActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);
}

function LogoutButton({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        onClick={onNavigate}
        className="flex w-full min-w-0 items-center gap-3 rounded-input px-3 py-2 text-body font-medium text-slate-dark transition-colors hover:bg-gray-light"
      >
        <LogOut className="size-5 shrink-0" aria-hidden="true" />
        <span className="truncate">تسجيل الخروج</span>
      </button>
    </form>
  );
}

/** Desktop sidebar — 280px, sand wash, crimson active state. */
export function DashboardSidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-1 border-l border-border bg-sand/5 p-md md:flex">
      <nav className="flex flex-1 flex-col gap-1" aria-label="التنقل">
        {navItems(role).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-input px-3 py-2 text-body font-medium transition-colors",
                active
                  ? "bg-crimson text-crimson-foreground"
                  : "text-slate-dark hover:bg-gray-light",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
      <LogoutButton />
    </aside>
  );
}
