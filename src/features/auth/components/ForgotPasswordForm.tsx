"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { forgotPasswordAction, type AuthFormState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputClass =
  "border-dead-sea/40 focus-visible:border-crimson focus-visible:ring-crimson/30";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    forgotPasswordAction,
    {},
  );

  const emailRef = useRef<HTMLInputElement>(null);
  const emailError = state?.fieldErrors?.email?.[0];

  useEffect(() => {
    if (emailError) emailRef.current?.focus();
  }, [emailError]);

  if (state?.success) {
    return (
      <div className="space-y-6">
        <div
          className="flex items-start gap-3 rounded-card border border-growth/30 bg-growth/5 p-4"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="size-5 shrink-0 text-growth" aria-hidden="true" />
          <p className="text-body text-foreground">{state.success}</p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">العودة لتسجيل الدخول</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="name@example.com…"
          autoComplete="email"
          spellCheck={false}
          ref={emailRef}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "email-error" : undefined}
          className={inputClass}
        />
        {emailError && (
          <p
            id="email-error"
            className="text-caption text-destructive"
            aria-live="polite"
          >
            {emailError}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "جاري الإرسال…" : "إرسال رابط الاستعادة"}
      </Button>

      <p className="text-center text-body text-muted-foreground">
        تذكرت كلمة المرور؟{" "}
        <Link
          href="/login"
          className="font-medium text-dead-sea underline-offset-4 hover:underline"
        >
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
