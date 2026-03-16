import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Returns the current user's id from the session.
 * Use this to verify which user you're logged in as.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ user_id: null, error: "Not logged in" });
  }
  return NextResponse.json({ user_id: user.id, email: user.email });
}
