// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/grade
//
//  Body: {
//    imageBase64: string,
//    mimeType: string,
//    expectedWords: string[]    // the words the student was supposed to write
//  }
//  Response: {
//    results: { index: number; expected: string; written: string; correct: boolean }[]
//    score: number   // 0–100 percent
//  }
//
//  GPT-4o Vision compares handwritten characters against the expected word list.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prepareImageForOpenAI } from "@/lib/convertImage";

// GPT-4o vision can take 15–40s; raise the serverless timeout (Vercel Hobby max = 60s).
export const maxDuration = 60;

function buildSystemPrompt(expectedWords: string[]): string {
  const wordList = expectedWords.map((w, i) => `${i + 1}. ${w}`).join("\n");
  return `你是一个严格但公平的新加坡小学华文听写批改助手。

学生应该按顺序写出以下 ${expectedWords.length} 个词语：
${wordList}

你的任务：
1. 仔细观察图片，找出学生手写的答案（通常是一列或一行写好的汉字）
2. 将每个手写答案与对应的期望词语进行比较
3. 逐字比较，完全正确才算对（包括字形、笔画）
4. 考虑到是手写，对于明显相似的笔迹请给予一定宽容度
5. 如果答案缺失（没有写），标记为错误

请以 JSON 格式返回：
{
  "results": [
    { "index": 0, "expected": "学习", "written": "学习", "correct": true },
    { "index": 1, "expected": "作业", "written": "作亚", "correct": false }
  ],
  "notes": "可选的整体评语（中文）"
}

规则：
- 只返回 JSON，不要任何多余说明
- index 从 0 开始
- correct 只有 true 或 false
- written 填写你识别到的手写内容，如果空白填 ""`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "批改服务未配置 · OpenAI API key not set" },
      { status: 503 }
    );
  }

  let body: { imageBase64?: string; mimeType?: string; expectedWords?: string[] };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { imageBase64, mimeType, expectedWords } = body;
  if (!imageBase64 || !mimeType || !expectedWords?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Convert HEIC/HEIF → JPEG if needed
    const { base64: finalBase64, mimeType: finalMime } =
      await prepareImageForOpenAI(imageBase64, mimeType);

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      messages: [
        { role: "system", content: buildSystemPrompt(expectedWords) },
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
              text: "请批改这张手写听写图片，返回 JSON 格式结果。",
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: {
      results?: { index: number; expected: string; written: string; correct: boolean }[];
      notes?: string;
    };
    try {
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      console.error("[Grade] JSON parse error:", cleaned);
      return NextResponse.json({ error: "AI 返回格式错误，请重试" }, { status: 500 });
    }

    const results = parsed.results ?? [];

    // Ensure we have a result for every expected word
    const fullResults = expectedWords.map((w, i) => {
      const found = results.find((r) => r.index === i);
      return found ?? { index: i, expected: w, written: "", correct: false };
    });

    const correct = fullResults.filter((r) => r.correct).length;
    const score = Math.round((correct / expectedWords.length) * 100);

    return NextResponse.json({ results: fullResults, score, notes: parsed.notes ?? "" });
  } catch (e) {
    console.error("[Grade] OpenAI error:", e);
    return NextResponse.json(
      { error: "批改失败，请检查图片并重试 · Grading failed" },
      { status: 500 }
    );
  }
}
