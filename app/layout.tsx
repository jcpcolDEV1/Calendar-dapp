import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { THEME_STORAGE_KEY } from "@/lib/theme-storage";

export const metadata: Metadata = {
  title: "Calendar - Personal Planner",
  description: "A minimal personal productivity tool for notes, tasks, and reminders",
};

/** Runs before paint to avoid theme FOUC; keep in sync with ThemeToggle */
const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t==="dark"){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
