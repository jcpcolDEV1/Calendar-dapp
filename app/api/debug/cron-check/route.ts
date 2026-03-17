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

  // Todas las entradas con reminder_at (para ver estado real)
  const { data: withReminder, error: rErr } = await supabase
    .from("entries")
    .select("id, title, reminder_at, reminder_sent_at, is_completed, created_by_user_id")
    .not("reminder_at", "is", null);

  if (rErr) {
    return NextResponse.json({ error: rErr.message });
  }

  // Las que el cron buscaría (reminder_sent_at null, is_completed false)
  const candidates = withReminder?.filter(
    (e) => e.reminder_sent_at == null && e.is_completed === false
  ) ?? [];
  const due = candidates.filter((e) => e.reminder_at && e.reminder_at <= nowISO);

  return NextResponse.json({
    server_now: nowISO,
    server_now_readable: now.toLocaleString("es-ES", { timeZone: "UTC" }) + " UTC",
    with_reminder_count: withReminder?.length ?? 0,
    candidates_count: candidates.length,
    due_count: due.length,
    all_with_reminder: withReminder?.map((e) => ({
      id: e.id,
      title: e.title,
      reminder_at: e.reminder_at,
      reminder_sent_at: e.reminder_sent_at,
      is_completed: e.is_completed,
      is_due: e.reminder_at ? e.reminder_at <= nowISO : false,
    })),
  });
}
