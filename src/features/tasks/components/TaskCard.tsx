"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { taskModeLabels } from "@/features/events/schemas";
import {
  useTaskUpdates,
  type TaskSnapshot,
} from "@/features/realtime/useTaskUpdates";
import { SignupButton, type MySignupState } from "@/features/tasks/components/SignupButton";

export type TaskCardData = {
  id: string;
  title: string;
  description: string | null;
  requiredVolunteers: number;
  mode: "INSTANT_CLAIM" | "APPROVAL";
  status: "OPEN" | "CLOSED" | "COMPLETED";
  confirmedCount: number;
  myAssignment: { id: string; status: string } | null;
};

function toSnapshot(task: TaskCardData): TaskSnapshot {
  return {
    taskId: task.id,
    claimed: task.confirmedCount,
    total: task.requiredVolunteers,
    status: task.status,
    mode: task.mode,
    myAssignment: task.myAssignment,
  };
}

export function TaskCard({
  task,
  eventId,
  canSignup,
}: {
  task: TaskCardData;
  eventId: string;
  canSignup: boolean;
}) {
  // Optimistic override: bumped the instant the user clicks, cleared as soon
  // as the server's own count moves (poll or refresh) or the action fails.
  const [optimisticClaimed, setOptimisticClaimed] = useState<number | null>(null);

  const { data, loading, error, refresh } = useTaskUpdates(task.id, eventId, {
    initial: toSnapshot(task),
    onFilled: (snapshot) => {
      // Only toast viewers who did NOT take the slot themselves.
      if (snapshot.myAssignment?.status !== "CONFIRMED") {
        toast.info("Someone took the last slot!", {
          description: `“${task.title}” just filled up.`,
        });
      }
    },
  });

  const serverClaimed = data?.claimed ?? task.confirmedCount;
  const total = data?.total ?? task.requiredVolunteers;
  const taskStatus = data?.status ?? task.status;
  const claimed = optimisticClaimed ?? serverClaimed;

  // Any movement in server truth supersedes the optimistic override.
  useEffect(() => {
    setOptimisticClaimed(null);
  }, [serverClaimed]);

  const serverFull = serverClaimed >= total;
  const pct = total > 0 ? Math.min(100, Math.round((claimed / total) * 100)) : 0;

  const myAssignment = data?.myAssignment ?? task.myAssignment;
  const state: MySignupState =
    myAssignment?.status === "CONFIRMED"
      ? "CONFIRMED"
      : myAssignment?.status === "PENDING"
        ? "PENDING"
        : "NONE";

  const signupBlocked = taskStatus !== "OPEN" || (!canSignup && state === "NONE");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-medium leading-snug">{task.title}</h3>
            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">
            {taskModeLabels[task.mode]}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5" />
            {claimed} of {total} filled
            {loading && <Loader2 className="size-3 animate-spin opacity-60" />}
          </span>
          <span className="flex items-center gap-2">
            {error ? (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Live paused — retrying…
              </span>
            ) : (
              <span
                className="flex items-center gap-1.5 text-xs font-medium text-primary"
                title="This card updates live"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                Live
              </span>
            )}
          </span>
        </div>
        <Progress value={pct} className="h-2" />

        {signupBlocked ? (
          taskStatus !== "OPEN" ? (
            <Badge variant="outline" className="w-fit bg-muted text-muted-foreground border-transparent">
              {taskStatus === "COMPLETED" ? "Completed" : "Closed"}
            </Badge>
          ) : null
        ) : (
          <SignupButton
            taskId={task.id}
            assignmentId={myAssignment?.id ?? null}
            mode={task.mode}
            state={state}
            full={serverFull && state === "NONE"}
            onOptimistic={() => setOptimisticClaimed(serverClaimed + 1)}
            onOptimisticCancel={() => setOptimisticClaimed(Math.max(0, serverClaimed - 1))}
            onSyncFail={() => {
              setOptimisticClaimed(null);
              void refresh();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
