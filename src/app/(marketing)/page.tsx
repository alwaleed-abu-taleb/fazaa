import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  Handshake,
  HeartHandshake,
  Mail,
  Phone,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/marketing/MobileNav";
import { EventCard } from "@/features/events/components/EventCard";
import { getFeaturedEvents } from "@/features/events/queries";
import masterMark from "../../../public/logo/master-mark.svg";

// Re-fetch featured events at most once a minute instead of baking them into a
// static prerender at build time.
export const revalidate = 60;

export default async function LandingPage() {
  const featured = await getFeaturedEvents();

  return (
    <div dir="rtl" lang="ar" className="flex min-h-svh flex-col" suppressHydrationWarning>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-background">
        <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:h-16">
          <Link href="/" className="flex items-center" aria-label="Faz'aa — الصفحة الرئيسية">
            <Image
              src={masterMark}
              alt="شعار فزعة"
              priority
              height={44}
              width={80}
              className="h-10 w-auto md:h-11"
            />
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">ابدأ الآن</Link>
            </Button>
          </div>
          <div className="flex items-center gap-1 sm:hidden">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="border-b border-border bg-sand/5">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-3 py-12 text-center md:px-6">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-caption text-muted-foreground">
              نحن الأردن نساعد بعضنا
            </span>
            <Image
              src={masterMark}
              alt="شعار فزعة — منصة التطوع الأردنية"
              height={64}
              width={117}
              priority
              className="h-16 w-auto"
            />
            <h1 className="text-h2 font-bold tracking-tight md:text-h1">
              فزعة — تطوع مع قلبك
            </h1>
            <p className="max-w-[36rem] text-body leading-relaxed text-muted-foreground md:text-lg">
              منصة تطوع أردنية تربط المتطوعين بالأحداث المجتمعية
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">ابدأ الآن</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-dead-sea text-dead-sea hover:bg-dead-sea hover:text-dead-sea-foreground"
              >
                <Link href="/events">تعرف أكثر</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Features ─────────────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
          <h2 className="text-center text-h2 font-semibold tracking-tight">
            كيف تعمل فزعة؟
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Search,
                tile: "bg-crimson text-crimson-foreground",
                title: "ابحث وانضم",
                text: "أوجد الأحداث التطوعية القريبة منك",
              },
              {
                icon: Handshake,
                tile: "bg-dead-sea text-dead-sea-foreground",
                title: "أنظم وتابع",
                text: "أدر فريقك وتابع المهام بسهولة",
              },
              {
                icon: HeartHandshake,
                tile: "bg-gold text-gold-foreground",
                title: "اختلف وأثّر",
                text: "كن جزء من مجتمع التطوع الأردني",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-card border border-border bg-card p-lg shadow-subtle transition-colors hover:bg-gray-light"
              >
                <span
                  className={`flex size-10 items-center justify-center rounded-input ${card.tile}`}
                >
                  <card.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-h3 font-medium">{card.title}</h3>
                <p className="mt-1.5 text-body text-muted-foreground">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Stats ─────────────────────────────────────────────────── */}
        <section className="bg-slate-dark">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
            <h2 className="text-center text-h2 font-semibold tracking-tight text-white">
              فزعة بالأرقام
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { num: "١٠٠٠+", label: "متطوع", className: "text-[#e48083]" },
              { num: "٥٠+", label: "حدث", className: "text-[#6fb9ca]" },
              { num: "٢٠٠٠+", label: "مهمة", className: "text-gold" },
              { num: "١٢", label: "محافظة", className: "text-[#5ba6c6]" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-h1 font-bold ${stat.className}`}>{stat.num}</div>
                <div className="mt-1 text-body text-gray-medium">{stat.label}</div>
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* ─── Upcoming events ───────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-h2 font-semibold tracking-tight">أحداث قادمة</h2>
              <p className="mt-1 text-body text-muted-foreground">
                أقرب الفرص لتقديم المساعدة.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events">عرض الكل ←</Link>
            </Button>
          </div>

          {featured.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mt-6 rounded-card border border-dashed border-border p-10 text-center">
              <p className="text-body text-muted-foreground">
                لا توجد أحداث قادمة بعد — كن أول من ينظم واحداً.
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/register">أنشئ حساب منظِّم</Link>
              </Button>
            </div>
          )}
        </section>

        {/* ─── CTA ───────────────────────────────────────────────────── */}
        <section className="bg-crimson">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center md:py-16">
            <h2 className="text-h2 font-bold text-crimson-foreground md:text-h1">
              جاهز لتبدأ التطوع؟
            </h2>
            <p className="max-w-[36rem] text-body text-crimson-foreground/90 md:text-lg">
              انضم إلى المجتمع الآن
            </p>
            <Button size="lg" asChild className="bg-white text-crimson hover:bg-white/90">
              <Link href="/register">ابدأ الآن</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-gray-light/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={masterMark}
              alt="شعار فزعة"
              height={24}
              width={44}
              className="h-6 w-auto"
            />
            <span className="text-caption text-muted-foreground">© 2026 Faz&apos;aa</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4 text-caption text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              لوحة التحكم
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              عن فزعة
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              تواصل معنا
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              الخصوصية
            </Link>
          </nav>

          <div className="flex items-center gap-3 text-muted-foreground">
            <Link
              href="#"
              aria-label="تواصل عبر البريد"
              className="transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
            </Link>
            <Link
              href="#"
              aria-label="اتصل بنا"
              className="transition-colors hover:text-foreground"
            >
              <Phone className="size-4" />
            </Link>
            <Link
              href="#"
              aria-label="موقع فزعة"
              className="transition-colors hover:text-foreground"
            >
              <Globe className="size-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
