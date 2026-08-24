// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/lookup?word=学习  →  { pinyin, meaning }
//
//  Pinyin is computed locally (instant, free). The English meaning used to come
//  from Google's undocumented translate endpoint, which now returns HTTP 429 for
//  datacenter traffic — so meanings silently came back empty. We ask OpenAI
//  instead (the key is already configured for OCR / grading); it is far more
//  reliable and costs a fraction of a cent per word.
//
//  The meaning is best-effort: any failure still returns the pinyin.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { pinyin } from "pinyin-pro";
import OpenAI from "openai";

// Cache identical lookups at the edge for a day — the meaning of a word doesn't
// change, and parents re-enter the same common vocabulary constantly.
export const revalidate = 86400;

/** Guard against someone using this as a free translation endpoint. */
const MAX_CHARS = 40;

async function englishMeaning(word: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return "";
  try {
    const openai = new OpenAI({ apiKey: key });
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 40,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You give the English meaning of Chinese words for a Singapore primary-school " +
            "spelling app. Reply with the meaning ONLY — no pinyin, no Chinese, no quotes, " +
            "no explanation. Keep it under 8 words. For a multi-word phrase or sentence, " +
            "give a short natural translation. Separate alternative senses with ' / '.",
        },
        { role: "user", content: word },
      ],
    }, { timeout: 8000 });
    return (r.choices[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
  } catch {
    return ""; // best-effort — pinyin still goes back
  }
}

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word")?.trim();
  if (!word) return NextResponse.json({ error: "Missing word" }, { status: 400 });
  if (word.length > MAX_CHARS) {
    return NextResponse.json({ error: "Too long" }, { status: 400 });
  }

  // ── Pinyin (local, instant, no API needed) ──────────────────
  const pinyinResult = pinyin(word, {
    toneType: "symbol",   // toned pinyin: xué xí
    separator: " ",
    nonZh: "removed",
  });

  const meaning = await englishMeaning(word);

  return NextResponse.json({ pinyin: pinyinResult, meaning });
}
