"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setPreferredCityAction } from "@/features/locations/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PreferredCitySelect({
  cities,
  currentCityId,
}: {
  cities: { id: string; name: string; arabic: string }[];
  currentCityId: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentCityId ?? "none");
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    setValue(next);
    startTransition(async () => {
      const res = await setPreferredCityAction(next === "none" ? null : next);
      if (res.ok) {
        toast.success(
          next === "none" ? "Preferred city cleared." : "Preferred city saved.",
        );
        router.refresh();
      } else {
        setValue(currentCityId ?? "none"); // roll the control back on failure
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value || "none"} onValueChange={onChange} disabled={pending}>
        <SelectTrigger className="w-full sm:w-64" aria-label="Preferred city">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No preference</SelectItem>
          {cities.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name} — {c.arabic}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
