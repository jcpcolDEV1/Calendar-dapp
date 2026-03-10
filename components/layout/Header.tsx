"use client";

import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  userEmail?: string | null;
}

export function Header({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  userEmail,
}: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOutAction();
    router.push("/");
    router.refresh();
  }

  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Calendar className="h-5 w-5 text-blue-600" />
          Calendar
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Today
        </button>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <span className="min-w-[140px] text-center font-medium text-slate-700 dark:text-slate-300">
          {monthYear}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu userEmail={userEmail} onSignOut={handleSignOut} />
      </div>
    </header>
  );
}
