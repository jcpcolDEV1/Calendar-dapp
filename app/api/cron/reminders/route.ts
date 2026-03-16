import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 }
    );
  }

  webpush.setVapidDetails(
    "mailto:support@calendar.app",
    vapidPublic,
    vapidPrivate
  );

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("id, title, reminder_at, created_by_user_id")
    .not("reminder_at", "is", null)
    .is("reminder_sent_at", null)
    .eq("is_completed", false)
    .lte("reminder_at", now);

  if (entriesError) {
    console.error("Cron reminders: entries query error", entriesError);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json({ sent: 0, message: "No reminders due" });
  }

  let sentCount = 0;
  const errors: string[] = [];
  const debug: { entryId: string; subsFound: number }[] = [];

  for (const entry of entries) {
    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", entry.created_by_user_id);

    debug.push({
      entryId: entry.id,
      subsFound: subscriptions?.length ?? 0,
    });
    if (subsError) errors.push(`Subs ${entry.id}: ${subsError.message}`);

    if (!subscriptions || subscriptions.length === 0) continue;

    const payload = JSON.stringify({
      title: "Recordatorio",
      body: entry.title,
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
          { TTL: 60 }
        );
        sentCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${entry.id}: ${msg}`);
        if (msg.includes("410") || msg.includes("404")) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    }

    const { error: updateError } = await supabase
      .from("entries")
      .update({ reminder_sent_at: now })
      .eq("id", entry.id);

    if (updateError) {
      errors.push(`Update ${entry.id}: ${updateError.message}`);
    }
  }

  return NextResponse.json({
    sent: sentCount,
    entries: entries.length,
    debug,
    errors: errors.length > 0 ? errors : undefined,
  });
}
