import { NextRequest, NextResponse } from "next/server";

// Google Cloud Text-to-Speech — WaveNet Mandarin
// Voice options (all WaveNet quality):
//   cmn-CN-Wavenet-A  female, warm
//   cmn-CN-Wavenet-B  male, neutral
//   cmn-CN-Wavenet-C  male, deep
//   cmn-CN-Wavenet-D  female, clear  ← default

const VOICE_NAME = "cmn-CN-Wavenet-D";
const LANGUAGE   = "cmn-CN";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    // Graceful fallback message — don't crash the app
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: LANGUAGE,
            name: VOICE_NAME,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.85,   // slightly slower — good for learning
            pitch: 0,
            volumeGainDb: 0,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Google TTS error:", err);
      return NextResponse.json({ error: "TTS API error" }, { status: 502 });
    }

    const data = await res.json() as { audioContent: string };

    // Decode base64 → binary → return as MP3
    const binary = Buffer.from(data.audioContent, "base64");

    return new NextResponse(binary, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400", // cache 24h — same word = same audio
      },
    });
  } catch (e) {
    console.error("TTS fetch failed:", e);
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
