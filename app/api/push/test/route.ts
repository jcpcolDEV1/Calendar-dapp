import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { shouldRemovePushSubscription } from "@/lib/push-send-errors";

export const dynamic = "force-dynamic";

/**
 * POST: Envía una notificación push de prueba a la suscripción de **este dispositivo**
 * (el cliente debe enviar `endpoint` de pushManager.getSubscription()).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const endpoint =
    typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  if (!endpoint) {
    return NextResponse.json(
      {
        error:
          "Falta el endpoint de este dispositivo. Vuelve a abrir el menú e inténtalo de nuevo.",
      },
      { status: 400 }
    );
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

  const { data: sub, error: subError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id)
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (subError) {
    return NextResponse.json(
      { error: "No se pudo comprobar la suscripción" },
      { status: 500 }
    );
  }

  if (!sub) {
    return NextResponse.json(
      {
        error:
          "No hay suscripción guardada para este dispositivo. Activa las notificaciones de nuevo.",
      },
      { status: 404 }
    );
  }

  const payload = JSON.stringify({
    title: "Prueba",
    body: "Si ves esto, las notificaciones funcionan en este dispositivo.",
  });

  const results: { endpoint: string; ok: boolean; error?: string }[] = [];

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
    if (shouldRemovePushSubscription(err)) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    total: results.length,
    results,
  });
}
