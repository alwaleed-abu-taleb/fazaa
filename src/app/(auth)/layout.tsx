import Link from "next/link";
import { HandHeart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10"
      suppressHydrationWarning
    >
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HandHeart className="size-5" />
        </span>
        <span className="text-xl font-bold tracking-tight">
          Faz&rsquo;aa <span className="text-primary">فزعة</span>
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
