"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Building2, HeartHandshake, Loader2 } from "lucide-react";
import { registerAction, type AuthFormState } from "@/features/auth/actions";
import type { CityWithDistricts } from "@/features/locations/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const inputClass =
  "border-dead-sea/40 focus-visible:border-crimson focus-visible:ring-crimson/30";

const roleOptions = [
  {
    value: "VOLUNTEER" as const,
    label: "متطوع",
    hint: "أوجد الأحداث القريبة منك وانضم إليها",
    icon: HeartHandshake,
    accent: "text-dead-sea",
  },
  {
    value: "ORGANIZER" as const,
    label: "منظم",
    hint: "أنشر الأحداث وأدر المتطوعين",
    icon: Building2,
    accent: "text-gold",
  },
];

function passwordStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0–4
}

const strengthLabels = ["", "ضعيفة", "متوسطة", "جيدة", "قوية"];

export function RegisterForm({ cities }: { cities: CityWithDistricts[] }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    {},
  );
  const [role, setRole] = useState<"VOLUNTEER" | "ORGANIZER">("VOLUNTEER");
  const [cityId, setCityId] = useState<string>("");
  const [password, setPassword] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const orgNameRef = useRef<HTMLInputElement>(null);

  const districts = useMemo(
    () => cities.find((c) => c.id === cityId)?.districts ?? [],
    [cities, cityId],
  );

  const fieldError = (key: string) => state?.fieldErrors?.[key]?.[0];

  // Focus the first invalid field on submit.
  useEffect(() => {
    const first = [
      fieldError("name") && nameRef.current,
      fieldError("email") && emailRef.current,
      fieldError("password") && passwordRef.current,
      fieldError("confirmPassword") && confirmPasswordRef.current,
      role === "ORGANIZER" && fieldError("orgName") && orgNameRef.current,
    ].find(Boolean);
    (first as HTMLInputElement | null)?.focus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.fieldErrors]);

  const strength = passwordStrength(password);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div
        className="grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label="نوع الحساب"
      >
        {roleOptions.map((opt) => {
          const Icon = opt.icon;
          const selected = role === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1.5 rounded-card border p-4 transition-colors",
                selected
                  ? "border-crimson bg-accent ring-1 ring-crimson"
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
              <Icon className={cn("size-5", selected ? opt.accent : "text-muted-foreground")} />
              <span className="text-body font-medium">{opt.label}</span>
              <span className="text-caption text-muted-foreground">{opt.hint}</span>
            </label>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">الاسم الكامل</Label>
          <Input
            id="name"
            name="name"
            required
            minLength={3}
            maxLength={80}
            placeholder="الاسم الكامل…"
            autoComplete="name"
            ref={nameRef}
            aria-invalid={!!fieldError("name")}
            aria-describedby={fieldError("name") ? "name-error" : undefined}
            className={inputClass}
          />
          {fieldError("name") && (
            <p id="name-error" className="text-caption text-destructive" aria-live="polite">
              {fieldError("name")}
            </p>
          )}
        </div>

        {role === "ORGANIZER" ? (
          <div className="space-y-1.5">
            <Label htmlFor="orgName">اسم المنظمة</Label>
            <Input
              id="orgName"
              name="orgName"
              required
              maxLength={120}
              placeholder="اسم المنظمة…"
              ref={orgNameRef}
              aria-invalid={!!fieldError("orgName")}
              aria-describedby={fieldError("orgName") ? "orgName-error" : undefined}
              className={inputClass}
            />
            {fieldError("orgName") && (
              <p id="orgName-error" className="text-caption text-destructive" aria-live="polite">
                {fieldError("orgName")}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              الهاتف <span className="text-muted-foreground">(اختياري)</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              maxLength={30}
              placeholder="+962 7x xxx xxxx…"
              autoComplete="tel"
              inputMode="tel"
              className={inputClass}
            />
          </div>
        )}
      </div>

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
          aria-invalid={!!fieldError("email")}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
          className={inputClass}
        />
        {fieldError("email") && (
          <p id="email-error" className="text-caption text-destructive" aria-live="polite">
            {fieldError("email")}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            placeholder="٨ أحرف على الأقل…"
            autoComplete="new-password"
            spellCheck={false}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            ref={passwordRef}
            aria-invalid={!!fieldError("password")}
            aria-describedby={
              fieldError("password") ? "password-error" : "password-strength"
            }
            className={inputClass}
          />
          {fieldError("password") ? (
            <p id="password-error" className="text-caption text-destructive" aria-live="polite">
              {fieldError("password")}
            </p>
          ) : (
            password && (
              <div id="password-strength" className="flex items-center gap-2">
                <div className="flex h-1 flex-1 gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex-1 rounded-full",
                        i <= strength
                          ? strength <= 1
                            ? "bg-destructive"
                            : strength === 2
                              ? "bg-gold"
                              : "bg-growth"
                          : "bg-gray-light",
                      )}
                    />
                  ))}
                </div>
                <span className="text-caption text-muted-foreground tabular-nums">
                  {strengthLabels[strength]}
                </span>
              </div>
            )
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            maxLength={72}
            placeholder="أعد إدخال كلمة المرور…"
            autoComplete="new-password"
            spellCheck={false}
            ref={confirmPasswordRef}
            aria-invalid={!!fieldError("confirmPassword")}
            aria-describedby={
              fieldError("confirmPassword") ? "confirmPassword-error" : undefined
            }
            className={inputClass}
          />
          {fieldError("confirmPassword") && (
            <p
              id="confirmPassword-error"
              className="text-caption text-destructive"
              aria-live="polite"
            >
              {fieldError("confirmPassword")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">المحافظة</Label>
        <Select
          name="cityId"
          value={cityId}
          onValueChange={(v) => {
            setCityId(v);
          }}
        >
          <SelectTrigger
            id="city"
            className={cn("w-full", inputClass)}
            aria-invalid={!!fieldError("cityId")}
            aria-describedby={fieldError("cityId") ? "city-error" : undefined}
          >
            <SelectValue placeholder="اختر المحافظة" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.arabic} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("cityId") && (
          <p id="city-error" className="text-caption text-destructive" aria-live="polite">
            {fieldError("cityId")}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="district">الناحية</Label>
        <Select name="districtId" disabled={!cityId}>
          <SelectTrigger
            id="district"
            className={cn("w-full", inputClass)}
            aria-invalid={!!fieldError("districtId")}
            aria-describedby={fieldError("districtId") ? "district-error" : undefined}
          >
            <SelectValue placeholder={cityId ? "اختر الناحية" : "اختر المحافظة أولاً"} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.arabic} — {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("districtId") && (
          <p id="district-error" className="text-caption text-destructive" aria-live="polite">
            {fieldError("districtId")}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <Checkbox id="terms" name="terms" value="true" className="mt-0.5" />
          <Label htmlFor="terms" className="text-body cursor-pointer">
            أوافق على{" "}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="font-medium text-dead-sea underline-offset-4 hover:underline"
                >
                  الشروط والأحكام
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>الشروط والأحكام</DialogTitle>
                  <DialogDescription>
                    هذه نسخة تجريبية من الشروط والأحكام الخاصة بمنصة فزعة. سيتم
                    استبدالها بالنص الرسمي عند الإطلاق.
                  </DialogDescription>
                </DialogHeader>
                <div className="text-body leading-relaxed text-muted-foreground">
                  <p>
                    باستخدامك لمنصة فزعة، توافق على المشاركة بأخلاق في الأحداث
                    التطوعية، وعلى احترام خصوصية المنظمين والمتطوعين الآخرين.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </Label>
        </div>
        {fieldError("terms") && (
          <p className="text-caption text-destructive" aria-live="polite">
            {fieldError("terms")}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "جاري الإرسال…" : "إنشاء حساب"}
      </Button>

      <p className="text-center text-body text-muted-foreground">
        هل لديك حساب بالفعل؟{" "}
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
