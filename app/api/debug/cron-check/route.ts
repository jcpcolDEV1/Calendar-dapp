import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Debug: shows why cron might not find reminders.
 * Same auth as cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const nowISO = now.toISOString();

  // Entries with reminder_at, not sent, not completed (sin filtro de tiempo)
  const { data: candidates, error: candErr } = await supabase
    .from("entries")
    .select("id, title, reminder_at, reminder_sent_at, is_completed, created_by_user_id")
    .not("reminder_at", "is", null)
    .is("reminder_sent_at", null)
    .eq("is_completed", false);

  if (candErr) {
    return NextResponse.json({ error: candErr.message });
  }

  const due = candidates?.filter((e) => e.reminder_at && e.reminder_at <= nowISO) ?? [];

  return NextResponse.json({
    server_now: nowISO,
    server_now_readable: now.toLocaleString("es-ES", { timeZone: "UTC" }) + " UTC",
    candidates_count: candidates?.length ?? 0,
    due_count: due.length,
    candidates: candidates?.map((e) => ({
      id: e.id,
      title: e.title,
      reminder_at: e.reminder_at,
      is_due: e.reminder_at ? e.reminder_at <= nowISO : false,
    })),
  });
}
