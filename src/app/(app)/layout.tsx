import Link from "next/link";
import { HandHeart } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { signOutAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-svh flex-col" suppressHydrationWarning>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HandHeart className="size-4" />
              </span>
              <span className="font-bold tracking-tight">
                Faz&rsquo;aa <span className="text-primary">فزعة</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/events" className="transition-colors hover:text-foreground">
                Events
              </Link>
              {user && (
                <Link href="/dashboard" className="transition-colors hover:text-foreground">
                  Dashboard
                </Link>
              )}
              {user?.role === "ADMIN" && (
                <Link
                  href="/dashboard/verification"
                  className="transition-colors hover:text-foreground"
                >
                  Verification
                </Link>
              )}
            </nav>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {user.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <Badge variant="outline" className="hidden bg-secondary md:inline-flex">
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              </Badge>
              <ThemeToggle />
              <form action={signOutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Join</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Faz&rsquo;aa — فزعة · Lend a hand when it matters.
      </footer>
    </div>
  );
}
