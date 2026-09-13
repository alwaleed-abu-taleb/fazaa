"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createEventAction, type EventFormState } from "@/features/events/actions";
import {
  eventCategoryValues,
  categoryLabels,
  taskModeValues,
  taskModeLabels,
} from "@/features/events/schemas";
import type { CityWithDistricts } from "@/features/locations/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type TaskMode = (typeof taskModeValues)[number];

type TaskRow = {
  title: string;
  description: string;
  requiredVolunteers: string;
  mode: TaskMode;
};

const emptyTask: TaskRow = {
  title: "",
  description: "",
  requiredVolunteers: "1",
  mode: "INSTANT_CLAIM",
};

export function CreateEventForm({ cities }: { cities: CityWithDistricts[] }) {
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(
    createEventAction,
    {},
  );
  const [tasks, setTasks] = useState<TaskRow[]>([{ ...emptyTask }]);
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("none");
  const selectedCity = cities.find((c) => c.id === cityId);
  const districts = selectedCity?.districts ?? [];

  function updateTask(i: number, patch: Partial<TaskRow>) {
    setTasks((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeTask(i: number) {
    setTasks((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));
  }

  // The tasks travel to the server action as JSON — the visible task inputs are
  // deliberately unnamed so they aren't double-submitted with the form.
  const tasksJson = JSON.stringify(
    tasks.map((t) => ({
      title: t.title,
      description: t.description || undefined,
      requiredVolunteers: Number(t.requiredVolunteers),
      mode: t.mode,
    })),
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Event title</Label>
        <Input id="title" name="title" required minLength={3} maxLength={140}
          placeholder="Saturday beach cleanup — Jeddah Corniche" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="COMMUNITY">
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {eventCategoryValues.map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabels[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cityId">City</Label>
          <Select value={cityId} onValueChange={(v: string) => { setCityId(v); setDistrictId("none"); }}>
            <SelectTrigger id="cityId" className="w-full">
              <SelectValue placeholder="Choose a city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} — {c.arabic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="cityId" value={cityId} />
        </div>
      </div>

      {cityId !== "" && (
        <div className="space-y-1.5">
          <Label htmlFor="districtId">
            District <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select value={districtId} onValueChange={setDistrictId}>
            <SelectTrigger id="districtId" className="w-full">
              <SelectValue placeholder="Choose a district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific district</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} — {d.arabic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="districtId" value={districtId === "none" ? "" : districtId} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="location">Meeting point / venue</Label>
        <Input id="location" name="location" required minLength={2} maxLength={200}
          placeholder="North Corniche, in front of the fountain" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startsAt">Starts at</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endsAt">
            Ends at <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="coverImageUrl">
          Cover image URL <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="coverImageUrl" name="coverImageUrl" type="url" placeholder="https://…" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required minLength={20} maxLength={4000}
          rows={5} placeholder="What will volunteers do? What should they bring? Who is this helping?" />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Break the event into sign-up-able chunks. Each task has its own slots.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setTasks((r) => [...r, { ...emptyTask }])}>
            <Plus className="size-4" /> Add task
          </Button>
        </div>

        {tasks.map((task, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Task {i + 1}</span>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => removeTask(i)}
                disabled={tasks.length === 1}
                aria-label={`Remove task ${i + 1}`}>
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Input value={task.title} maxLength={120}
                onChange={(e) => updateTask(i, { title: e.target.value })}
                placeholder="Task title — e.g. Registration desk" />
            </div>

            <Input value={task.description} maxLength={500}
              onChange={(e) => updateTask(i, { description: e.target.value })}
              placeholder="What does this task involve? (optional)" />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Volunteers needed</Label>
                <Input type="number" min={1} max={500} value={task.requiredVolunteers}
                  onChange={(e) => updateTask(i, { requiredVolunteers: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sign-up mode</Label>
                <Select value={task.mode} onValueChange={(v: TaskMode) => updateTask(i, { mode: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskModeValues.map((m) => (
                      <SelectItem key={m} value={m}>
                        {taskModeLabels[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}

        <input type="hidden" name="tasks" value={tasksJson} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create event (saved as draft)
      </Button>
    </form>
  );
}
