import Link from "next/link";
import { redirect } from "next/navigation";

type LandingProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Supabase may redirect failed/expired email links to Site URL (often `/`)
 * with `?error=...` instead of `/auth/callback`. Forward to login with a clear message.
 */
export default async function LandingPage({ searchParams }: LandingProps) {
  const sp = await searchParams;
  const error = sp.error;
  if (typeof error === "string" && error.length > 0) {
    const params = new URLSearchParams();
    const code = sp.error_code;
    params.set(
      "authError",
      typeof code === "string" && code ? code : error
    );
    const desc = sp.error_description;
    if (typeof desc === "string" && desc) {
      params.set("authErrorDescription", desc);
    }
    redirect(`/login?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
          Your Personal Calendar
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
          A minimal productivity tool for notes, tasks, and reminders. Keep your
          days organized.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            data-testid="link-get-started"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
