#!/usr/bin/env node
/**
 * Verifica que user_id de la entrada con recordatorio coincida con user_id en push_subscriptions
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Falta .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
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
  console.error("Entry:", eErr?.message);
  console.error("Subs:", sErr?.message);
  process.exit(1);
}

console.log("Entry:", entry?.title ?? entryId);
console.log("  created_by_user_id:", entry?.created_by_user_id);
console.log("");
console.log("Push subscriptions:");
subs?.forEach((s, i) => {
  console.log(`  [${i}] user_id:`, s.user_id);
  console.log(`      endpoint:`, s.endpoint?.slice(0, 50) + "...");
});
console.log("");
const match = subs?.some((s) => s.user_id === entry?.created_by_user_id);
console.log("¿Coinciden?", match ? "SÍ" : "NO");
