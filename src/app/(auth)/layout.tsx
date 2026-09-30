import Link from "next/link";
import Image from "next/image";
import masterMark from "../../../public/logo/master-mark.svg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/40 px-4 py-10"
      suppressHydrationWarning
    >
      <Link href="/" className="flex items-center" aria-label="Faz'aa — الصفحة الرئيسية">
        <Image
          src={masterMark}
          alt="شعار فزعة"
          height={64}
          width={115}
          className="h-14 w-auto md:h-16"
        />
      </Link>
      <div className="w-full max-w-[28rem]">{children}</div>
    </div>
  );
}
