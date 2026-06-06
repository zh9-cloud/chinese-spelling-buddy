// ─────────────────────────────────────────────────────────────────────────────
//  convertToJpeg
//
//  OpenAI Vision only accepts JPEG / PNG / WebP / GIF.
//  HEIC and HEIF (iPhone camera default) must be converted first.
//  We use `heic-convert` — pure WebAssembly, works on macOS + Vercel Linux.
// ─────────────────────────────────────────────────────────────────────────────

const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

interface ConvertResult {
  base64: string;
  mimeType: string;
}

export async function prepareImageForOpenAI(
  imageBase64: string,
  mimeType: string
): Promise<ConvertResult> {
  // Non-HEIC formats pass through unchanged
  if (!HEIC_TYPES.has(mimeType.toLowerCase())) {
    return { base64: imageBase64, mimeType };
  }

  // HEIC → JPEG via heic-convert (WebAssembly, no native deps)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const convert = require("heic-convert") as (opts: {
    buffer: Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  }) => Promise<ArrayBuffer>;

  const inputBuffer  = Buffer.from(imageBase64, "base64");
  const jpegBuffer   = await convert({ buffer: inputBuffer, format: "JPEG", quality: 0.9 });

  return {
    base64:   Buffer.from(jpegBuffer).toString("base64"),
    mimeType: "image/jpeg",
  };
}
