import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

/**
 * Semantic breadcrumb trail. The last item is the current page (rendered as
 * plain text with aria-current). RTL-aware: separators point left.
 */
export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="مسار التنقل" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-caption text-gray-medium">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 && (
                <ChevronLeft
                  className="size-3 shrink-0 text-gray-medium"
                  aria-hidden="true"
                />
              )}
              {last || !item.href ? (
                <span
                  className="truncate text-gray-dark"
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="truncate text-dead-sea underline-offset-2 transition-colors hover:text-crimson hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
