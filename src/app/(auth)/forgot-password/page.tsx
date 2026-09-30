import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "استعادة كلمة المرور" };

export default function ForgotPasswordPage() {
  return (
    <Card className="max-w-[400px]">
      <CardHeader>
        <CardTitle className="text-2xl">استعادة كلمة المرور</CardTitle>
        <CardDescription>أدخل بريدك الإلكتروني لاستلام رابط الاستعادة</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
