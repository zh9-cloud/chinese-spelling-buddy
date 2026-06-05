import { NextRequest, NextResponse } from "next/server";
import { pinyin } from "pinyin-pro";

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word")?.trim();
  if (!word) return NextResponse.json({ error: "Missing word" }, { status: 400 });

  // ── Pinyin (local, instant, no API needed) ──────────────────
  const pinyinResult = pinyin(word, {
    toneType: "symbol",   // toned pinyin: xué xí
    separator: " ",
    nonZh: "removed",
  });

  // ── English meaning via Google Translate (free, no key) ─────
  let meaning = "";
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(word)}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      // Response shape: [ [ ["translation","source",...], ... ], ..., "zh-CN" ]
      const data = await res.json() as unknown[][];
      const segments = data[0] as unknown[][];
      meaning = segments
        .map((s) => (s as unknown[])[0])
        .filter(Boolean)
        .join("")
        .trim();
    }
  } catch {
    // Network unavailable — return pinyin only, no meaning
  }

  return NextResponse.json({
    pinyin: pinyinResult,
    meaning,
  });
}
