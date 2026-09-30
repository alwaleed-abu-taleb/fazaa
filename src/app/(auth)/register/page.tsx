import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { getCitiesWithDistricts } from "@/features/locations/queries";

export const metadata: Metadata = { title: "إنشاء حساب جديد" };

// Cities/districts are static reference data — safe to fetch per-request, and
// keeping it server-side avoids a second client round-trip.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const cities = await getCitiesWithDistricts();

  return (
    <Card className="max-w-[500px]">
      <CardHeader>
        <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
        <CardDescription>انضم إلى مجتمع التطوع الأردني</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm cities={cities} />
      </CardContent>
    </Card>
  );
}
