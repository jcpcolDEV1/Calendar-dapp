import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const entryId = "defb1391-94d8-4f68-959b-cb8597bb9061";

  const { data: entry, error: eErr } = await supabase
    .from("entries")
    .select("id, title, created_by_user_id")
    .eq("id", entryId)
    .single();

  const { data: subs, error: sErr } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint");

  if (eErr || sErr) {
    return NextResponse.json({
      error: "Query failed",
      entryError: eErr?.message,
      subsError: sErr?.message,
    });
  }

  const entryUserId = entry?.created_by_user_id;
  const subUserIds = subs?.map((s) => s.user_id) ?? [];
  const match = subUserIds.includes(entryUserId ?? "");

  return NextResponse.json({
    entry: {
      id: entry?.id,
      title: entry?.title,
      created_by_user_id: entryUserId,
    },
    push_subscriptions: subs?.map((s) => ({
      user_id: s.user_id,
      endpoint: s.endpoint?.slice(0, 60) + "...",
    })),
    match,
  });
}
