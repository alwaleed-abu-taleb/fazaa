"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction, type AuthFormState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

const inputClass =
  "border-dead-sea/40 focus-visible:border-crimson focus-visible:ring-crimson/30";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    {},
  );

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const emailError = state?.fieldErrors?.email?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  // Focus the first invalid field so keyboard/screen-reader users land on it.
  useEffect(() => {
    if (emailError) emailRef.current?.focus();
    else if (passwordError) passwordRef.current?.focus();
  }, [emailError, passwordError]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

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

      <div className="space-y-1.5">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
          autoComplete="current-password"
          spellCheck={false}
          ref={passwordRef}
          aria-invalid={!!passwordError}
          aria-describedby={passwordError ? "password-error" : undefined}
          className={inputClass}
        />
        {passwordError && (
          <p
            id="password-error"
            className="text-caption text-destructive"
            aria-live="polite"
          >
            {passwordError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox id="remember" name="remember" value="true" />
          <Label htmlFor="remember" className="text-body cursor-pointer">
            تذكرني
          </Label>
        </div>
        <Link
          href="/forgot-password"
          className="text-caption font-medium text-dead-sea underline-offset-4 hover:underline"
        >
          هل نسيت كلمة المرور؟
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "جاري الإرسال…" : "تسجيل الدخول"}
      </Button>

      <p className="text-center text-body text-muted-foreground">
        ليس لديك حساب؟{" "}
        <Link
          href="/register"
          className="font-medium text-dead-sea underline-offset-4 hover:underline"
        >
          إنشاء حساب جديد
        </Link>
      </p>
    </form>
  );
}
