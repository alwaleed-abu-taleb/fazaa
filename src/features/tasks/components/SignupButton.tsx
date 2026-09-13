"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { claimTask, applyToTask, cancelSignup, type ClaimResult } from "@/features/tasks/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type MySignupState = "NONE" | "PENDING" | "CONFIRMED";

export function SignupButton({
  taskId,
  assignmentId,
  mode,
  state,
  full,
  onOptimistic,
  onOptimisticCancel,
  onSyncFail,
}: {
  taskId: string;
  assignmentId: string | null;
  mode: "INSTANT_CLAIM" | "APPROVAL";
  state: MySignupState;
  full: boolean;
  /** Instantly bump the displayed slot count while the action is in flight. */
  onOptimistic?: () => void;
  onOptimisticCancel?: () => void;
  /** Called when the action failed and the optimistic change must roll back. */
  onSyncFail?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function finish(result: ClaimResult, optimistic: boolean) {
    if (result.ok) {
      if (result.message) toast.success(result.message);
      router.refresh(); // re-render server components (aggregates, badges)
    } else {
      if (optimistic) onSyncFail?.();
      if (/filled up|full/i.test(result.error)) {
        // Lost the race for the last slot.
        toast.error("Someone beat you to it!", {
          description: "All slots on this task were just taken.",
        });
      } else {
        toast.error(result.error);
      }
      router.refresh();
    }
  }

  function claim() {
    onOptimistic?.();
    startTransition(async () => {
      finish(await claimTask(taskId), true);
    });
  }

  function apply() {
    onOptimistic?.();
    startTransition(async () => {
      finish(await applyToTask(taskId), true);
    });
  }

  function cancel() {
    if (!assignmentId) return;
    onOptimisticCancel?.();
    startTransition(async () => {
      finish(await cancelSignup(assignmentId), true);
    });
  }

  if (state === "CONFIRMED") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="gap-1 bg-primary/10 text-primary border-transparent hover:bg-primary/10">
          <CheckCircle2 className="size-3.5" /> You&rsquo;re confirmed
        </Badge>
        {assignmentId && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={cancel} className="text-muted-foreground">
            <X className="size-4" /> Cancel
          </Button>
        )}
      </div>
    );
  }

  if (state === "PENDING") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent hover:bg-amber-500/15">
          <Clock className="size-3.5" /> Awaiting approval
        </Badge>
        {assignmentId && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={cancel} className="text-muted-foreground">
            <X className="size-4" /> Cancel
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mode === "INSTANT_CLAIM" ? (
        <Button size="sm" disabled={full || pending} onClick={claim}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {full ? "Task full" : "I'm ready"}
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={full || pending} onClick={apply}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {full ? "Task full" : "Apply"}
        </Button>
      )}
      {full && (
        <Badge variant="outline" className="bg-muted text-muted-foreground border-transparent">
          Slot taken
        </Badge>
      )}
    </div>
  );
}
