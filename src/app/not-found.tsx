import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold tracking-tight text-primary">404</p>
      <h1 className="text-xl font-semibold">This page wandered off to volunteer somewhere</h1>
      <p className="text-muted-foreground">
        The page you&rsquo;re looking for doesn&rsquo;t exist or you don&rsquo;t have access to it.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Back home
        </Link>
        <Link href="/events" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Browse events
        </Link>
      </div>
    </div>
  );
}
