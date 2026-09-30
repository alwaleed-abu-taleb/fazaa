import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card border bg-card p-4",
        highlight && "border-gold/40",
      )}
    >
      <div className="flex items-center gap-2 text-body text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          highlight && "text-gold",
        )}
      >
        {value}
      </p>
    </div>
  );
}
