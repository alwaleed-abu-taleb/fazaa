"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import {
  approveAssignment,
  rejectAssignment,
  type ClaimResult,
} from "@/features/tasks/actions";
import { Button } from "@/components/ui/button";

export function ApprovalButtons({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<ClaimResult>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => run(() => approveAssignment(assignmentId))}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => rejectAssignment(assignmentId))}
        className="text-muted-foreground"
      >
        <X className="size-4" /> Reject
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
