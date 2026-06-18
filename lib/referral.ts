// Server-side referral helpers (use the service-role Supabase client).
import type { SupabaseClient } from "@supabase/supabase-js";

const DAY = 86_400_000;
const MONTH_DAYS = 30;
// Unambiguous alphabet (no 0/O/1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genCode(len = 6): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** Get the user's referral code, creating one (retrying on collision) if needed. */
export async function getOrCreateCode(sb: SupabaseClient, userId: string): Promise<string> {
  const { data } = await sb.from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
  if (data?.code) return data.code;

  for (let i = 0; i < 6; i++) {
    const code = genCode();
    const { error } = await sb.from("referral_codes").insert({ user_id: userId, code });
    if (!error) return code;
    // Could be a duplicate code OR the user row already exists (race) — re-check.
    const { data: ex } = await sb.from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
    if (ex?.code) return ex.code;
  }
  throw new Error("could not generate referral code");
}

/** Extend a user's referral Pro grant by N months (stacks from the later of now / existing end). */
export async function extendProGrant(sb: SupabaseClient, userId: string, months: number): Promise<string> {
  const { data } = await sb.from("pro_grants").select("pro_until").eq("user_id", userId).maybeSingle();
  const base = Math.max(Date.now(), data?.pro_until ? new Date(data.pro_until).getTime() : 0);
  const until = new Date(base + months * MONTH_DAYS * DAY).toISOString();
  await sb.from("pro_grants").upsert(
    { user_id: userId, pro_until: until, reason: "referral", updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  return until;
}
