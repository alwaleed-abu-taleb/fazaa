"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, CheckCheck, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { relativeTimeAr } from "@/lib/relative-time";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
};

/**
 * Bell + dropdown panel for the signed-in user's notifications. The parent owns
 * the unread badge count (it drives the 30s poll) and passes it down; marking
 * all read calls back up so the badge clears immediately.
 */
export function NotificationDropdown({
  count,
  onReadChange,
}: {
  count: number;
  onReadChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as Notification[];
      setItems(data);
    } catch {
      // ignore — the header's badge poll tolerates failures the same way
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh the list every time the panel opens; it may be stale vs. the poll.
  useEffect(() => {
    if (open) void fetchList();
  }, [open, fetchList]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = useCallback(async () => {
    setMarking(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) return;
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      onReadChange();
    } catch {
      // ignore
    } finally {
      setMarking(false);
    }
  }, [onReadChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={count > 0 ? `${count} إشعار غير مقروء` : "الإشعارات"}
          aria-expanded={open}
          className="relative rounded-full p-2 text-foreground transition-colors hover:bg-gray-light"
        >
          <Bell className="size-5" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute end-1 top-1 flex size-4 items-center justify-center rounded-full bg-crimson text-[10px] font-bold text-crimson-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        dir="rtl"
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-body font-semibold">الإشعارات</span>
          <button
            type="button"
            onClick={markAllRead}
            disabled={marking || unreadCount === 0}
            className="flex items-center gap-1.5 text-caption font-medium text-dead-sea transition-colors hover:text-dead-sea/80 disabled:text-muted-foreground disabled:opacity-60"
          >
            {marking ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="size-3.5" aria-hidden="true" />
            )}
            تعليم الكل كمقروء
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                className="size-5 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
              <BellOff className="size-7" aria-hidden="true" />
              <span className="text-caption">لا توجد إشعارات حتى الآن</span>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex gap-2.5 px-3 py-2.5",
                    !n.read && "bg-crimson/5",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-crimson",
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-foreground">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-caption text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <time
                      dateTime={n.createdAt}
                      className="mt-1 block text-caption text-muted-foreground"
                    >
                      {relativeTimeAr(n.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
