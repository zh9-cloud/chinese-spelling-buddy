// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/ocr
//
//  Body: { imageBase64: string, mimeType: string }
//  Response: { words: { word: string; pinyin?: string; meaning?: string }[] }
//
//  Uses GPT-4o Vision to extract Chinese vocabulary from a photo of a school
//  dictation word list.  The system prompt is tuned for Singapore primary-school
//  Chinese textbook pages.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prepareImageForOpenAI } from "@/lib/convertImage";

// GPT-4o vision can take 15–40s; raise the serverless timeout (Vercel Hobby max = 60s).
export const maxDuration = 60;

const SYSTEM_PROMPT = `你是一个专门识别新加坡小学华文听写词表的 AI 助手。

听写词表有两种项目：
- **词语**：1-6 个汉字的词，例如"学习"、"快餐店"、"居民"
- **句子**：完整的一句话，例如"巴士上坐着一群小学生"、"他认真地做作业"

你的任务：
1. 按图片顺序，找出所有听写项目（词语和句子）
2. 【绝对不要】把完整句子拆开变成多个词 — 句子必须保持完整
3. 判断每个项目是词语还是句子，在 isSentence 字段标注
4. 如果图片中有拼音注释，提取对应的拼音
5. 忽略页码、课文标题、图片说明等无关内容

请以 JSON 格式返回：
{
  "words": [
    { "word": "居民", "pinyin": "jū mín", "meaning": "", "isSentence": false },
    { "word": "快餐店", "pinyin": "kuài cān diàn", "meaning": "", "isSentence": false },
    { "word": "巴士上坐着一群小学生", "pinyin": "bā shì shàng zuò zhe yī qún xiǎo xué shēng", "meaning": "", "isSentence": true }
  ]
}

规则：
- 只返回 JSON，不要任何多余说明
- word 字段只填中文字符，不含拼音
- 没有拼音或意思时，对应字段填空字符串 ""
- 图片不清晰或无词语时，返回 { "words": [] }`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OCR 服务未配置 · OpenAI API key not set" },
      { status: 503 }
    );
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json() as { imageBase64?: string; mimeType?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { imageBase64, mimeType } = body;
  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: "Missing imageBase64 or mimeType" }, { status: 400 });
  }

  try {
    // Convert HEIC/HEIF → JPEG if needed (OpenAI only supports JPEG/PNG/WebP/GIF)
    const { base64: finalBase64, mimeType: finalMime } =
      await prepareImageForOpenAI(imageBase64, mimeType);

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${finalMime};base64,${finalBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "请识别这张图片中的所有华文词语，按 JSON 格式返回。",
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { words?: { word: string; pinyin?: string; meaning?: string; isSentence?: boolean }[] };
    try {
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      console.error("[OCR] JSON parse error:", cleaned);
      return NextResponse.json({ error: "AI 返回格式错误，请重试" }, { status: 500 });
    }

    const words = (parsed.words ?? [])
      .filter((w) => w.word && /[一-鿿]/.test(w.word))
      .map((w) => ({
        word: w.word,
        pinyin: w.pinyin ?? "",
        meaning: w.meaning ?? "",
        isSentence: w.isSentence ?? (w.word.length > 6),  // fallback: treat >6 chars as sentence
      }));

    return NextResponse.json({ words });
  } catch (e) {
    console.error("[OCR] OpenAI error:", e);
    return NextResponse.json(
      { error: "识别失败，请检查图片并重试 · Recognition failed" },
      { status: 500 }
    );
  }
}
