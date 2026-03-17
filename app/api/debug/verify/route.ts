import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Verifica configuración de VAPID y cron.
 * No requiere auth - solo devuelve estado (sin secretos).
 */
export async function GET(request: NextRequest) {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Para comparar VAPID: el cliente tiene NEXT_PUBLIC_VAPID_PUBLIC_KEY
  // Si coincide con lo que hay en Vercel, las claves son las mismas
  const vapidPublicPrefix = vapidPublic
    ? vapidPublic.slice(0, 20) + "..."
    : null;

  return NextResponse.json({
    vercel: {
      vapid_public_configured: !!vapidPublic,
      vapid_private_configured: !!vapidPrivate,
      vapid_public_prefix: vapidPublicPrefix,
      vapid_public_length: vapidPublic?.length ?? 0,
      cron_secret_configured: !!cronSecret,
      supabase_url_configured: !!supabaseUrl,
      service_role_configured: !!serviceRole,
    },
    cron_job_org: {
      url: "https://calendar-dapp.vercel.app/api/cron/reminders",
      method: "GET",
      header_name: "Authorization",
      header_value_format: "Bearer [CRON_SECRET]",
      expected_status: 200,
    },
  });
}
