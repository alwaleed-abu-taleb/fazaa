import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Role } from "@prisma/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import badgeVolunteer from "../../../../public/logo/fazaa-volunteer.svg";
import badgeOrganizer from "../../../../public/logo/fazaa-organizer.svg";

/**
 * Profile summary card shown on both dashboards. The verification row reflects
 * the organizer's own verification state; volunteers are always considered
 * unverified (there is no volunteer verification flow in the data model).
 */
export function RoleProfile({
  name,
  email,
  role,
  city,
  organization,
  isVerified,
  editHref = "/profile",
}: {
  name: string | null | undefined;
  email: string | null;
  role: Role;
  city?: string | null;
  organization?: string | null;
  isVerified?: boolean;
  editHref?: string;
}) {
  const isOrganizer = role === "ORGANIZER" || role === "ADMIN";
  const initials = (name?.trim()?.[0] ?? "؟").toUpperCase();

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:items-start sm:text-start">
        <Avatar className="size-16 shrink-0">
          <AvatarFallback className="bg-dead-sea/15 text-2xl font-semibold text-dead-sea">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h3 className="text-h3 font-semibold">{name}</h3>
            <Image
              src={isOrganizer ? badgeOrganizer : badgeVolunteer}
              alt={isOrganizer ? "شعار المنظم" : "شعار المتطوع"}
              height={48}
              width={31}
              className="h-12 w-auto shrink-0"
            />
            <span
              className={
                isOrganizer
                  ? "rounded-full bg-gold px-2 py-0.5 text-caption font-medium text-gold-foreground"
                  : "rounded-full bg-dead-sea px-2 py-0.5 text-caption font-medium text-dead-sea-foreground"
              }
            >
              {isOrganizer ? "منظم" : "متطوع"}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-body text-muted-foreground">
            <p className="break-words">{email}</p>
            {city && <p>{city}</p>}
            {organization && <p className="font-medium text-foreground">{organization}</p>}
          </div>

          {isOrganizer && (
            <div className="mt-3 flex items-center justify-center gap-1.5 sm:justify-start">
              {isVerified ? (
                <>
                  <CheckCircle2 className="size-4 text-growth" aria-hidden="true" />
                  <span className="text-body font-medium text-growth">تم التحقق</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-destructive" aria-hidden="true" />
                  <span className="text-body font-medium text-destructive">قيد المراجعة</span>
                </>
              )}
            </div>
          )}

          <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
            <Link href={editHref}>تعديل الملف</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
