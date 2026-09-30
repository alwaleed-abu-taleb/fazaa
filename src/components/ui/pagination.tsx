import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * URL-driven pagination: each page is a link so state lives in the query
 * string (deep-linkable, no client state to lose on refresh). Pass a base href
 * that already contains other filters — the page param is appended safely.
 */
export function Pagination({
  currentPage,
  totalPages,
  pageParam = "page",
  baseHref,
  className,
}: {
  currentPage: number;
  totalPages: number;
  pageParam?: string;
  baseHref: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pageHref = (page: number) => {
    const [path, query] = baseHref.split("?");
    const params = new URLSearchParams(query ?? "");
    params.set(pageParam, String(page));
    return `${path}?${params.toString()}`;
  };

  // Show a window around the current page plus the first/last pages.
  const visible = new Set<number>([1, totalPages]);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 1 && p <= totalPages) visible.add(p);
  }
  const pages = [...visible].sort((a, b) => a - b);

  const linkClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-input px-2 text-caption font-medium text-dead-sea transition-colors hover:bg-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson/40";

  return (
    <nav
      aria-label="الصفحات"
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      {/* prev / next: links when a target exists, disabled spans at the edges */}
      {currentPage > 1 ? (
        <Link href={pageHref(currentPage - 1)} className={linkClass} aria-label="الصفحة السابقة">
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          className="inline-flex min-h-11 min-w-11 cursor-not-allowed items-center justify-center rounded-input px-2 text-caption text-gray-medium opacity-50"
          aria-hidden="true"
        >
          <ChevronRight className="size-4" />
        </span>
      )}

      {pages.map((page, index) => {
        const gap = index > 0 && page - pages[index - 1] > 1;
        const active = page === currentPage;
        return (
          <span key={page} className="flex items-center gap-1">
            {gap && (
              <span className="px-1 text-gray-medium" aria-hidden="true">
                …
              </span>
            )}
            {active ? (
              <span
                aria-current="page"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-input bg-crimson px-2 text-caption font-medium text-crimson-foreground"
              >
                {page}
              </span>
            ) : (
              <Link href={pageHref(page)} className={linkClass}>
                {page}
              </Link>
            )}
          </span>
        );
      })}

      {currentPage < totalPages ? (
        <Link href={pageHref(currentPage + 1)} className={linkClass} aria-label="الصفحة التالية">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          className="inline-flex min-h-11 min-w-11 cursor-not-allowed items-center justify-center rounded-input px-2 text-caption text-gray-medium opacity-50"
          aria-hidden="true"
        >
          <ChevronLeft className="size-4" />
        </span>
      )}
    </nav>
  );
}
