import type { EventCategory, EventStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { categoryLabels } from "@/features/events/schemas";

const statusVariant: Record<EventStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-transparent",
  PUBLISHED: "bg-primary/10 text-primary border-transparent",
  ONGOING: "bg-amber-500/15 text-amber-700 border-transparent",
  COMPLETED: "bg-sky-500/10 text-sky-700 border-transparent",
  CANCELLED: "bg-destructive/10 text-destructive border-transparent",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusVariant[status])}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: EventCategory }) {
  return (
    <Badge variant="secondary" className="font-medium">
      {categoryLabels[category]}
    </Badge>
  );
}
