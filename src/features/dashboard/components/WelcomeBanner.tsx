import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * Role-aware welcome banner. Gold accent for organizers, dead-sea blue for
 * volunteers, both on the Wadi Rum Sand wash from the spec.
 */
export function WelcomeBanner({
  name,
  role,
  subtitle,
}: {
  name: string | null | undefined;
  role: Role;
  subtitle: string;
}) {
  const isOrganizer = role === "ORGANIZER" || role === "ADMIN";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-sand/5 p-lg">
      <div className="min-w-0">
        <h1 className="text-h2 font-bold tracking-tight md:text-h1">
          أهلاً بك{name ? `، ${name}` : ""}
        </h1>
        <p className="mt-1 text-body text-muted-foreground">{subtitle}</p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-caption font-medium",
          isOrganizer
            ? "bg-gold text-gold-foreground"
            : "bg-dead-sea text-dead-sea-foreground",
        )}
      >
        {isOrganizer ? "منظم" : "متطوع"}
      </span>
    </div>
  );
}
