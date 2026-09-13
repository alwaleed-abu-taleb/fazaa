import Link from "next/link";
import { CalendarCheck2, HandHeart, Handshake, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EventCard } from "@/features/events/components/EventCard";
import { getFeaturedEvents } from "@/features/events/queries";

// Re-fetch featured events at most once a minute instead of baking them into a
// static prerender at build time.
export const revalidate = 60;

export default async function LandingPage() {
  const featured = await getFeaturedEvents();

  return (
    <div suppressHydrationWarning>
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HandHeart className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Faz&rsquo;aa <span className="text-primary">فزعة</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Join Faz&rsquo;aa</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-accent/60 to-background dark:from-primary/10 dark:via-background">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:py-28">
            <span className="rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
              فزعة — the Saudi tradition of showing up for each other
            </span>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
              Be there when it matters.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Faz&rsquo;aa connects volunteers with the people and organizations who need
              them. Find an event near you, pick a task, and say{" "}
              <span className="font-medium text-foreground">&ldquo;I&rsquo;m ready&rdquo;</span>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/events">
                  <Search className="size-4" /> Browse events
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Organize an event</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight">How Faz&rsquo;aa works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Find an event",
                text: "Browse volunteer events by city and category — cleanups, marathons, community drives and more.",
              },
              {
                icon: Handshake,
                title: "Say “I'm ready”",
                text: "Pick a task and claim a slot instantly, or apply and let the organizer approve you.",
              },
              {
                icon: CalendarCheck2,
                title: "Show up & help",
                text: "Get your spot confirmed, meet your team on the day, and make a real difference.",
              },
            ].map((step, i) => (
              <div key={i} className="rounded-lg border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-medium">
                  <span className="text-muted-foreground">{i + 1}. </span>
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured events */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Upcoming events</h2>
              <p className="mt-1 text-muted-foreground">The next chances to lend a hand.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events">View all →</Link>
            </Button>
          </div>

          {featured.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((e) => (
                <EventCard
                  key={e.id}
                  id={e.id}
                  title={e.title}
                  city={e.cityObj?.name ?? e.city}
                  districtName={e.district?.name}
                  category={e.category}
                  startsAt={e.startsAt}
                  organizerName={e.organizer.organizerProfile?.orgName ?? e.organizer.name}
                  organizerVerified={e.organizer.organizerProfile?.isVerified ?? false}
                  slotsFilled={e.slotsFilled}
                  slotsNeeded={e.slotsNeeded}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed p-10 text-center">
              <p className="text-muted-foreground">No upcoming events yet — be the first to organize one.</p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/register">Create an organizer account</Link>
              </Button>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Faz&rsquo;aa — فزعة · Lend a hand when it matters.
      </footer>
    </div>
  );
}
