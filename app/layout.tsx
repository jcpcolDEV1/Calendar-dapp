import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import { THEME_STORAGE_KEY } from "@/lib/theme-storage";

export const metadata: Metadata = {
  title: "Calendar - Personal Planner",
  description: "A minimal personal productivity tool for notes, tasks, and reminders",
};

/**
 * Runs before first paint to avoid theme FOUC.
 * Use next/script (beforeInteractive), not a manual <head> — a custom <head> in the
 * root layout can prevent Next.js from injecting default tags (including CSS links).
 */
const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t==="dark"){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
