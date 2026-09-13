"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { CityWithDistricts } from "@/features/locations/queries";
import { eventCategoryValues, categoryLabels } from "@/features/events/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EventFilters({
  cities,
  current,
}: {
  cities: CityWithDistricts[];
  current: { q?: string; cityId?: string; districtId?: string; category?: string };
}) {
  const selectClass =
    "h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-foreground dark:[color-scheme:dark]";

  const [cityId, setCityId] = useState(current.cityId ?? "");
  const [districtId, setDistrictId] = useState(current.districtId ?? "");
  const districts = cities.find((c) => c.id === cityId)?.districts ?? [];

  return (
    <form
      action="/events"
      method="get"
      className="flex flex-col gap-3 rounded-lg border bg-card p-4 lg:flex-row lg:items-center lg:flex-wrap"
    >
      <div className="relative lg:flex-1 lg:min-w-48">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={current.q ?? ""} placeholder="Search events…" className="pl-8" />
      </div>

      <select
        name="cityId"
        value={cityId}
        onChange={(e) => {
          setCityId(e.target.value);
          setDistrictId("");
        }}
        className={selectClass}
        aria-label="City"
      >
        <option value="">All cities</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} — {c.arabic}
          </option>
        ))}
      </select>

      <select
        name="districtId"
        value={districtId}
        onChange={(e) => setDistrictId(e.target.value)}
        className={selectClass}
        aria-label="District"
        disabled={!cityId}
      >
        <option value="">All districts</option>
        {districts.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} — {d.arabic}
          </option>
        ))}
      </select>

      <select
        name="category"
        defaultValue={current.category ?? ""}
        className={selectClass}
        aria-label="Category"
      >
        <option value="">All categories</option>
        {eventCategoryValues.map((c) => (
          <option key={c} value={c}>
            {categoryLabels[c]}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 lg:flex-none">
          Filter
        </Button>
        <Link
          href="/events"
          className="flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
