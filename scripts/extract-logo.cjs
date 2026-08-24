/* Generate app icon + splash sources for @capacitor/assets.
 *
 * Source of truth: assets/emblem.png — the gold emblem on transparency, cut out
 * of the brand logo once. (It used to be re-extracted from a screenshot on the
 * Desktop, which then got deleted; keeping the cut-out in the repo makes this
 * reproducible.) Here we brighten it, scale it, and composite onto a clean navy
 * gradient. Re-running is idempotent: emblem.png is never written back.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets");
const EMBLEM = path.join(OUT, "emblem.png");
fs.mkdirSync(OUT, { recursive: true });

const KAI = "Songti SC, STSong, Songti, serif";

// Navy gradient + soft top-left highlight — the brand background.
const navyBg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <defs>
      <linearGradient id="n" x1="0.15" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#403a78"/>
        <stop offset="0.5" stop-color="#2b2861"/>
        <stop offset="1" stop-color="#191643"/>
      </linearGradient>
      <radialGradient id="hl" cx="0.32" cy="0.28" r="0.4">
        <stop offset="0" stop-color="#5a5290" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#5a5290" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#n)"/>
    <ellipse cx="330" cy="300" rx="240" ry="150" fill="url(#hl)"/>
  </svg>`;

async function main() {
  // Brighten / saturate the gold so the emblem reads clearly at small sizes.
  const { data, info } = await sharp(EMBLEM).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: cw, height: ch } = info;
  const px = Buffer.alloc(cw * ch * 4);
  for (let i = 0; i < cw * ch; i++) {
    const o = i * 4;
    px[o] = Math.min(255, data[o] + 30);                                        // R
    px[o + 1] = Math.min(255, Math.max(data[o + 1], Math.round(data[o] * 0.74)) + 16); // G
    px[o + 2] = Math.min(data[o + 2], 58);                                      // B
    px[o + 3] = data[o + 3];                                                    // A
  }
  const gold = () => sharp(px, { raw: { width: cw, height: ch, channels: 4 } });

  /** Emblem scaled to `fraction` of the 1024 canvas, centred. */
  async function emblemAt(fraction) {
    const target = Math.round(1024 * fraction);
    const scale = target / Math.max(cw, ch);
    const w = Math.round(cw * scale), h = Math.round(ch * scale);
    return {
      buf: await gold().resize(w, h).png().toBuffer(),
      left: Math.round((1024 - w) / 2),
      top: Math.round((1024 - h) / 2),
      w, h,
    };
  }

  // Main icon (iOS, legacy Android, PWA): iOS only rounds the corners, so the
  // emblem can fill most of the tile. Android adaptive foreground must stay
  // inside the launcher's centre ~66% safe zone or it gets clipped.
  const big = await emblemAt(0.78);
  const safe = await emblemAt(0.6);

  await sharp(Buffer.from(navyBg))
    .composite([{ input: big.buf, left: big.left, top: big.top }])
    .png().toFile(path.join(OUT, "icon-only.png"));

  await sharp(Buffer.from(navyBg)).png().toFile(path.join(OUT, "icon-background.png"));

  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: safe.buf, left: safe.left, top: safe.top }])
    .png().toFile(path.join(OUT, "icon-foreground.png"));
  console.log("wrote icons (emblem 0.78 / adaptive-safe 0.60)");

  // ── Splash: rounded navy tile + emblem + wordmark ──
  const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
      <defs><clipPath id="c"><rect width="900" height="900" rx="180"/></clipPath></defs>
      <g clip-path="url(#c)">${navyBg.replace('width="1024" height="1024">', 'width="900" height="900" viewBox="0 0 1024 1024">')}</g>
    </svg>`;
  const tilePng = await sharp(Buffer.from(tileSvg)).png().toBuffer();
  const tw = Math.round(big.w * 900 / 1024), th = Math.round(big.h * 900 / 1024);
  const emblemForTile = await gold().resize(tw, th).png().toBuffer();
  const tileWithEmblem = await sharp(tilePng)
    .composite([{ input: emblemForTile, gravity: "center" }])
    .png().toBuffer();

  const splash = (bg, word, sub) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732">
      <rect width="2732" height="2732" fill="${bg}"/>
      <text x="1366" y="2090" font-size="172" text-anchor="middle" font-family="${KAI}" font-weight="600" fill="${word}">小华听写</text>
      <text x="1366" y="2208" font-size="64" text-anchor="middle" letter-spacing="7" font-family="-apple-system,Helvetica,sans-serif" fill="${sub}">CHINESE SPELLING BUDDY</text>
    </svg>`;

  for (const [name, bg, word, sub] of [
    ["splash.png", "#f3eee6", "#2b2861", "#9a8f7e"],
    ["splash-dark.png", "#15122e", "#e7ad4e", "#6f678f"],
  ]) {
    await sharp(Buffer.from(splash(bg, word, sub)))
      .composite([{ input: tileWithEmblem, top: 866, left: 1366 - 450 }])
      .png().toFile(path.join(OUT, name));
    console.log("wrote", name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
