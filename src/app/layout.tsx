import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Faz'aa — فزعة",
    template: "%s | Faz'aa",
  },
  description:
    "Faz'aa connects volunteers with the people and organizations who need them. Find events near you and say \"I'm ready\".",
};

// Runs before first paint so the stored/system theme is applied with no flash.
const noFlashThemeScript = `(function(){try{var t=localStorage.getItem("fazaa-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add("dark");}document.documentElement.style.colorScheme=t;}catch(e){}})();`;

// Runs after the server HTML is parsed but before React hydrates: strips
// attributes injected by browser extensions (bis_skin_checked / bis_register
// etc.) so hydration compares against clean markup. Extensions may re-inject
// later — that's harmless, React never re-hydrates during SPA navigation.
const extensionAttributeCleanupScript = `(function(){try{["bis_skin_checked","bis_register"].forEach(function(a){document.querySelectorAll("["+a+"]").forEach(function(e){e.removeAttribute(a)})});window.__fazaExtCleanup=true;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-svh bg-background text-foreground`}
      >
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
        <ThemeProvider>{children}</ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: extensionAttributeCleanupScript }} />
      </body>
    </html>
  );
}
