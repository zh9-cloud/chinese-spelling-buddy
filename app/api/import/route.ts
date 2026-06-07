// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/import
//
//  Body: { images: { base64: string; mimeType: string }[] }
//  Response: { lists: ImportedList[] }
//
//  Extracts MULTIPLE dictation sheets (听写单) from a set of page images (rendered
//  from a PDF) or photos. Each sheet → one list with its lesson/date/words.
//  School names, child names, and encouragement sentences are ignored.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prepareImageForOpenAI } from "@/lib/convertImage";

// GPT-4o vision can take 15–40s; raise the serverless timeout (Vercel Hobby max = 60s).
export const maxDuration = 60;

interface RawWord {
  word: string;
  pinyin?: string;
  meaning?: string;
  isSentence?: boolean;
}
interface RawList {
  lesson?: string;
  title?: string;
  date?: string;
  dayOfWeek?: string;
  words?: RawWord[];
}

const SYSTEM_PROMPT = `你是一个专门整理新加坡小学华文听写单的 AI 助手。

一张图片里可能有【0 个、1 个、或多个】听写单（听写单 = 一节课要听写的词语/句子清单）。

听写单里的项目分两种：
- **词语**：1-6 个汉字，如"学习""快餐店"
- **句子**：完整一句话，如"巴士上坐着一群小学生"（句子必须保持完整，绝不能拆成词语）

你的任务：
1. 找出图片里所有听写单，按听写单分组（不是按页）
2. 每个听写单提取：
   - lesson：课次，如"第六课"（没有就留空）
   - date：听写日期 YYYY-MM-DD（只有在图上明确写了完整日期时才填，否则留空）
   - dayOfWeek：星期几听写，如"星期三"（没有就留空）
   - words：该听写单的所有词语和句子
3. 判断每个项目是词语还是句子，用 isSentence 标注
4. 提取拼音（如果图上有）

【务必忽略，不要当成听写项目】：
- 学校名称、班级
- 孩子姓名
- 老师写给学生的鼓励语 / 励志句子（通常单独出现在顶部或底部，不在编号列表里）
- 页码、课文标题、装饰文字、说明文字

请只返回 JSON：
{
  "lists": [
    {
      "lesson": "第六课",
      "date": "",
      "dayOfWeek": "星期三",
      "words": [
        { "word": "居民", "pinyin": "jū mín", "meaning": "", "isSentence": false },
        { "word": "巴士上坐着一群小学生", "pinyin": "", "meaning": "", "isSentence": true }
      ]
    }
  ]
}

规则：
- 只返回 JSON，不要任何多余说明
- word 只填中文，不含拼音
- 没有的字段填空字符串 ""
- 图里没有任何听写单时，返回 { "lists": [] }`;

async function extractListsFromImage(
  client: OpenAI,
  base64: string,
  mimeType: string
): Promise<RawList[]> {
  const { base64: finalBase64, mimeType: finalMime } =
    await prepareImageForOpenAI(base64, mimeType);

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2048,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${finalMime};base64,${finalBase64}`, detail: "high" },
          },
          { type: "text", text: "请识别这张图片里的所有听写单，按 JSON 格式返回。" },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { lists?: RawList[] };
    return parsed.lists ?? [];
  } catch {
    console.error("[import] JSON parse error:", cleaned);
    return [];
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "识别服务未配置 · OpenAI API key not set" },
      { status: 503 }
    );
  }

  let body: { images?: { base64?: string; mimeType?: string }[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const images = (body.images ?? []).filter((im) => im.base64 && im.mimeType) as {
    base64: string;
    mimeType: string;
  }[];
  if (images.length === 0) {
    return NextResponse.json({ error: "Missing images" }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey });

    // Process each page in parallel
    const perImage = await Promise.all(
      images.map((im) => extractListsFromImage(client, im.base64, im.mimeType))
    );

    // Flatten, then merge lists that clearly continue across pages
    // (same non-empty lesson + same dayOfWeek).
    const flat = perImage.flat();
    const merged: RawList[] = [];
    for (const list of flat) {
      const key = `${(list.lesson ?? "").trim()}|${(list.dayOfWeek ?? "").trim()}`;
      const sameLesson =
        (list.lesson ?? "").trim() &&
        merged.find(
          (m) => `${(m.lesson ?? "").trim()}|${(m.dayOfWeek ?? "").trim()}` === key
        );
      if (sameLesson) {
        sameLesson.words = [...(sameLesson.words ?? []), ...(list.words ?? [])];
      } else {
        merged.push({ ...list });
      }
    }

    // Normalise output shape
    const lists = merged
      .map((l) => ({
        lesson: l.lesson ?? "",
        title: (l.title ?? l.lesson ?? "").trim(),
        date: l.date ?? "",
        dayOfWeek: l.dayOfWeek ?? "",
        words: (l.words ?? [])
          .filter((w) => w.word && /[一-鿿]/.test(w.word))
          .map((w) => ({
            word: w.word.trim(),
            pinyin: w.pinyin ?? "",
            meaning: w.meaning ?? "",
            isSentence: w.isSentence ?? w.word.trim().length > 6,
          })),
      }))
      .filter((l) => l.words.length > 0);

    return NextResponse.json({ lists });
  } catch (e) {
    console.error("[import] OpenAI error:", e);
    return NextResponse.json(
      { error: "识别失败，请检查文件并重试 · Recognition failed" },
      { status: 500 }
    );
  }
}
