"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { ExportDialog } from "@/features/export/components/ExportDialog";
import { Button } from "@/components/ui/button";

export function ExportButton({
  eventId,
  tasks,
}: {
  eventId: string;
  tasks: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Download className="size-4" /> Export
      </Button>
      <ExportDialog eventId={eventId} tasks={tasks} open={open} onOpenChange={setOpen} />
    </>
  );
}
