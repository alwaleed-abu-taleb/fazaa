"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-background">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4">
            <Button variant="ghost" asChild onClick={() => setOpen(false)}>
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/register">ابدأ الآن</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
