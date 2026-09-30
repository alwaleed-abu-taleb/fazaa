import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Globe } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { signOutAction } from "@/features/auth/actions";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { VerificationBadge } from "@/features/verification/components/VerificationBadge";
import { PreferredCitySelect } from "@/features/locations/components/PreferredCitySelect";
import { getCitiesWithDistricts } from "@/features/locations/queries";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    include: { organizerProfile: true },
  });
  if (!user) redirect("/login");

  const cities = (await getCitiesWithDistricts()).map((c) => ({
    id: c.id,
    name: c.name,
    arabic: c.arabic,
  }));

  return (
    <div className="max-w-[36rem]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-1.5 text-2xl">
              {user.name}
              <VerificationBadge verified={user.organizerProfile?.isVerified ?? false} />
            </CardTitle>
            <Badge variant="outline" className="bg-secondary">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </Badge>
          </div>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-sm">{user.phone}</p>
            </div>
          )}

          <div>
            <Label className="text-sm text-muted-foreground">Preferred city</Label>
            <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
              Events in your city appear first when you browse.
            </p>
            <PreferredCitySelect cities={cities} currentCityId={user.preferredCityId} />
          </div>

          {user.role === "ORGANIZER" && user.organizerProfile && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="text-sm font-medium">{user.organizerProfile.orgName}</p>
                {user.organizerProfile.websiteUrl && (
                  <p className="flex items-center gap-1.5 text-sm text-primary">
                    <Globe className="size-3.5" />
                    {user.organizerProfile.websiteUrl}
                  </p>
                )}
                {user.organizerProfile.bio && (
                  <p className="text-sm text-muted-foreground">{user.organizerProfile.bio}</p>
                )}
              </div>
            </>
          )}

          <Separator />
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
