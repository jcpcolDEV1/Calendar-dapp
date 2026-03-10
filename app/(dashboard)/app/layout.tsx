import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreatePersonalCalendar } from "@/services/calendars";
import { getUser } from "@/services/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const calendar = await getOrCreatePersonalCalendar();
  if (!calendar) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="max-w-md p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Unable to load calendar
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Your calendar could not be created or loaded. Please try logging out and back in, or contact support if the issue persists.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
