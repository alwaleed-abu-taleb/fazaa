"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type TaskSnapshot = {
  taskId: string;
  claimed: number;
  total: number;
  status: "OPEN" | "CLOSED" | "COMPLETED";
  mode: "INSTANT_CLAIM" | "APPROVAL";
  eventStatus?: string;
  myAssignment: { id: string; status: string } | null;
};

export type UseTaskUpdatesOptions = {
  /** Server-rendered truth to display before the first poll lands. */
  initial?: TaskSnapshot;
  /**
   * Fired when the task transitions from "has free slots" to "full" because
   * someone else claimed — used for the "last slot taken" toast.
   */
  onFilled?: (snapshot: TaskSnapshot) => void;
};

const POLL_INTERVAL_MS = 2000;

/**
 * Keeps one task's slot count live by polling /api/realtime/tasks/[taskId]
 * every 2 seconds. Polls pause while the tab is hidden and fire immediately
 * when the tab regains focus. Cleans up its interval, listeners and any
 * in-flight request on unmount.
 */
export function useTaskUpdates(
  taskId: string,
  eventId?: string,
  options?: UseTaskUpdatesOptions,
) {
  const router = useRouter();
  const [data, setData] = useState<TaskSnapshot | null>(options?.initial ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs keep the interval stable across renders while callbacks stay fresh.
  const onFilledRef = useRef(options?.onFilled);
  onFilledRef.current = options?.onFilled;
  const prevRef = useRef<TaskSnapshot | null>(options?.initial ?? null);

  const fetchSnapshot = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/realtime/tasks/${taskId}`, {
          cache: "no-store",
          signal,
        });
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "Task no longer exists."
              : "Live updates are unavailable right now.",
          );
        }
        const snapshot = (await res.json()) as TaskSnapshot;

        const prev = prevRef.current;
        const changed =
          !prev ||
          prev.claimed !== snapshot.claimed ||
          prev.total !== snapshot.total ||
          prev.status !== snapshot.status ||
          prev.myAssignment?.id !== snapshot.myAssignment?.id ||
          prev.myAssignment?.status !== snapshot.myAssignment?.status;

        if (
          prev &&
          changed &&
          prev.claimed < prev.total &&
          snapshot.claimed >= snapshot.total &&
          snapshot.claimed > prev.claimed
        ) {
          onFilledRef.current?.(snapshot);
        }

        prevRef.current = snapshot;
        setData(snapshot);
        setError(null);
        if (changed && eventId) router.refresh(); // keep server-rendered aggregates in sync
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Network error");
        }
      } finally {
        setLoading(false);
      }
    },
    [taskId, eventId, router],
  );

  useEffect(() => {
    const controller = new AbortController();

    const tick = () => {
      if (!document.hidden) void fetchSnapshot(controller.signal);
    };
    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);

    // Auto-refresh when the user comes back to the tab.
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      controller.abort();
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [fetchSnapshot]);

  return { data, loading, error, refresh: () => fetchSnapshot() };
}
