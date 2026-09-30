"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { signOutAction } from "@/features/auth/actions";
import {
  isActive,
  navItems,
} from "@/features/dashboard/components/DashboardSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function AppHeader({
  name,
  role,
  masterMark,
}: {
  name: string | null | undefined;
  role: Role;
  masterMark: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const unread = (data as { read: boolean }[]).filter((n) => !n.read).length;
      setCount(unread);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount]);
  const initials = (name?.trim()?.[0] ?? "؟").toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between gap-2 px-4 md:h-16">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="فتح القائمة"
          className="rounded-input p-1.5 text-foreground hover:bg-gray-light md:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Faz'aa — الصفحة الرئيسية"
        >
          <Image
            src={masterMark}
            alt="شعار فزعة"
            height={32}
            width={58}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">
          <NotificationDropdown count={count} onReadChange={fetchCount} />

          <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full p-1 pe-2 text-foreground transition-colors hover:bg-gray-light"
              aria-label="قائمة الحساب"
            >
              <Avatar size="sm" className="size-8">
                <AvatarFallback className="bg-dead-sea/15 text-dead-sea">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-body font-medium sm:inline">
                {name}
              </span>
              <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <div className="border-b border-border px-2 pb-2">
              <p className="truncate text-body font-medium">{name}</p>
              <p className="text-caption text-muted-foreground">
                {role === "ORGANIZER" ? "منظم" : role === "ADMIN" ? "مشرف" : "متطوع"}
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-input px-2 py-2 text-body text-foreground transition-colors hover:bg-gray-light"
              >
                الملف الشخصي
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-input px-2 py-2 text-body text-destructive transition-colors hover:bg-gray-light"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col gap-1 border-l border-border bg-background p-md md:hidden"
            aria-label="التنقل"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-h3 font-semibold">القائمة</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="إغلاق القائمة"
                className="rounded-input p-1.5 text-muted-foreground hover:bg-gray-light"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1" aria-label="التنقل">
              {navItems(role).map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
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
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full min-w-0 items-center gap-3 rounded-input px-3 py-2 text-body font-medium text-slate-dark transition-colors hover:bg-gray-light"
              >
                <LogOut className="size-5 shrink-0" aria-hidden="true" />
                <span className="truncate">تسجيل الخروج</span>
              </button>
            </form>
          </aside>
        </>
      )}
    </header>
  );
}
