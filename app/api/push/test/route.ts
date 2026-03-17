import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST: Envía una notificación push de prueba al usuario actual.
 * Útil para verificar que push funciona sin esperar un recordatorio.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
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

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json({
      error: "No push subscription found. Activate notifications first.",
    });
  }

  const payload = JSON.stringify({
    title: "Prueba",
    body: "Si ves esto, las notificaciones funcionan.",
  });

  const results: { endpoint: string; ok: boolean; error?: string }[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
        { TTL: 60 }
      );
      results.push({ endpoint: sub.endpoint.slice(0, 50) + "...", ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        endpoint: sub.endpoint.slice(0, 50) + "...",
        ok: false,
        error: msg,
      });
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    total: results.length,
    results,
  });
}
