"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Building2, HeartHandshake, Loader2 } from "lucide-react";
import { registerAction, type AuthFormState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const roleOptions = [
  {
    value: "VOLUNTEER" as const,
    label: "I want to volunteer",
    hint: "Find events near you and say “I’m ready”.",
    icon: HeartHandshake,
  },
  {
    value: "ORGANIZER" as const,
    label: "I organize events",
    hint: "Post events, define tasks, manage sign-ups.",
    icon: Building2,
  },
];

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    {},
  );
  const [role, setRole] = useState<"VOLUNTEER" | "ORGANIZER">("VOLUNTEER");

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
        {roleOptions.map((opt) => {
          const Icon = opt.icon;
          const selected = role === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1.5 rounded-lg border p-4 transition-colors",
                selected
                  ? "border-primary bg-accent ring-1 ring-primary"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name="role"
                value={opt.value}
                checked={selected}
                onChange={() => setRole(opt.value)}
                className="sr-only"
              />
              <Icon className={cn("size-5", selected ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs text-muted-foreground">{opt.hint}</span>
            </label>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required minLength={2} maxLength={80} placeholder="Alwaleed Alshehri" />
      </div>

      {role === "ORGANIZER" && (
        <div className="space-y-1.5">
          <Label htmlFor="orgName">Organization name</Label>
          <Input id="orgName" name="orgName" required maxLength={120} placeholder="Faz'aa Initiative" />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="you@example.com" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">
          Phone <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="phone" name="phone" type="tel" maxLength={30} placeholder="+966 5x xxx xxxx" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} maxLength={72} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} maxLength={72} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
