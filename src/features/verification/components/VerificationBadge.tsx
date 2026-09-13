import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerificationBadge({
  verified,
  className,
}: {
  verified: boolean;
  className?: string;
}) {
  if (!verified) return null;
  return (
    <BadgeCheck
      role="img"
      aria-label="Verified organizer"
      className={cn("size-4 shrink-0 text-sky-500 dark:text-sky-400", className)}
    />
  );
}
