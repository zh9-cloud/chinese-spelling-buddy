// Supabase email-verification callback
// Supabase redirects to /api/auth/callback?code=xxx after the user clicks the
// email link.  We exchange the code for a session, then send the user to the
// parent dashboard.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/parent/dashboard";

  if (code) {
    const url   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb    = createClient(url, key);
    await sb.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, req.url));
}
