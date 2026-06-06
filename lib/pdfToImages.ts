"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  Client-side file → image conversion for the batch import flow.
//
//  • PDFs are rendered page-by-page to JPEG using pdf.js (in the browser, so we
//    avoid any server-side native dependency).
//  • Image files (incl. HEIC) are passed through as-is; the server handles HEIC.
//
//  Both return a uniform array of { base64, mimeType } (base64 has NO data: prefix).
// ─────────────────────────────────────────────────────────────────────────────

// NOTE: pdf.js is imported lazily inside pdfToImages() (never at module top
// level). It references browser-only globals like DOMMatrix, so importing it
// eagerly would crash Next's server-side prerender.

export interface PreparedImage {
  base64: string;     // raw base64, no "data:...;base64," prefix
  mimeType: string;
}

let workerConfigured = false;

function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

/** Render every page of a PDF File to a JPEG (base64, no prefix). */
export async function pdfToImages(
  file: File,
  opts?: { scale?: number; quality?: number }
): Promise<PreparedImage[]> {
  const scale = opts?.scale ?? 2;      // 2× for OCR legibility
  const quality = opts?.quality ?? 0.85;

  // Lazy-load pdf.js in the browser only, then configure its worker once.
  const pdfjsLib = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    workerConfigured = true;
  }

  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  const out: PreparedImage[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法创建画布 · Canvas unavailable");

      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      out.push({
        base64: stripDataUrlPrefix(canvas.toDataURL("image/jpeg", quality)),
        mimeType: "image/jpeg",
      });
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
  return out;
}

/** Read an image File into { base64, mimeType }. */
export async function imageFileToPrepared(file: File): Promise<PreparedImage> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(stripDataUrlPrefix(reader.result as string));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { base64, mimeType: file.type || "image/jpeg" };
}

/** Turn a mixed selection of PDFs and images into a flat list of images. */
export async function filesToImages(files: File[]): Promise<PreparedImage[]> {
  const result: PreparedImage[] = [];
  for (const file of files) {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const pages = await pdfToImages(file);
      result.push(...pages);
    } else {
      result.push(await imageFileToPrepared(file));
    }
  }
  return result;
}
