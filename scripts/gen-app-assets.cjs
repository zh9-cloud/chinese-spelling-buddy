/* Generate app icon + splash source images for @capacitor/assets.
 * Renders SVG → PNG with sharp. Brand: orange #f5880a, cream #fef3e2, cinnabar #b83b2e.
 * Motif: 米字格 writing card + calligraphic 华 + AI sparkle. */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "assets");
fs.mkdirSync(OUT, { recursive: true });

const KAI = "Songti SC, STSong, Songti, STKaiti, serif";

// ── 米字格 grid inside a square region [x,y,size], dashed light strokes ──
function miZiGe(x, y, size, stroke, w) {
  const x2 = x + size, y2 = y + size, cx = x + size / 2, cy = y + size / 2;
  const dash = `stroke-dasharray="${size * 0.045} ${size * 0.03}"`;
  return `
    <g stroke="${stroke}" stroke-width="${w}" fill="none" stroke-linecap="round">
      <line x1="${cx}" y1="${y}" x2="${cx}" y2="${y2}" ${dash}/>
      <line x1="${x}" y1="${cy}" x2="${x2}" y2="${cy}" ${dash}/>
      <line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" ${dash}/>
      <line x1="${x2}" y1="${y}" x2="${x}" y2="${y2}" ${dash}/>
    </g>`;
}

// ── 4-point AI sparkle centered at (cx,cy), outer radius r ──
function sparkle(cx, cy, r, fill) {
  const k = 0.16 * r; // waist
  const p = `M ${cx} ${cy - r} C ${cx + k} ${cy - k}, ${cx + r} ${cy - k}, ${cx + r} ${cy}
             C ${cx + r} ${cy + k}, ${cx + k} ${cy + k}, ${cx} ${cy + r}
             C ${cx - k} ${cy + k}, ${cx - r} ${cy + k}, ${cx - r} ${cy}
             C ${cx - r} ${cy - k}, ${cx - k} ${cy - k}, ${cx} ${cy - r} Z`;
  return `<path d="${p}" fill="${fill}"/>`;
}

const ORANGE_BG = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stop-color="#fbb84e"/>
      <stop offset="0.5" stop-color="#f5880a"/>
      <stop offset="1" stop-color="#d4700a"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>`;

// The cream writing-card with grid + 华 + sparkle. Centered, size for safe zone.
function card(panel) {
  const s = panel, x = (1024 - s) / 2, y = (1024 - s) / 2;
  const r = s * 0.16;
  return `
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" ry="${r}"
          fill="#fef3e2" stroke="#ffffff" stroke-width="6"/>
    ${miZiGe(x + s * 0.1, y + s * 0.1, s * 0.8, "#f0b06a", 5)}
    <text x="512" y="${y + s * 0.74}" font-size="${s * 0.66}" text-anchor="middle"
          font-family="${KAI}" font-weight="600" fill="#b83b2e">华</text>
    ${sparkle(x + s * 0.84, y + s * 0.2, s * 0.085, "#ffffff")}
    ${sparkle(x + s * 0.84, y + s * 0.2, s * 0.05, "#fff7e6")}`;
}

const wrap = (inner, size = 1024) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${inner}</svg>`;

async function render(svg, file, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, file));
  console.log("wrote", file);
}

(async () => {
  // Full composite (legacy + PWA maskable): orange bleed + card
  await render(wrap(ORANGE_BG + card(560)), "icon-only.png", 1024);
  // Adaptive background: just the orange gradient (full bleed, edges may be masked)
  await render(wrap(ORANGE_BG + miZiGe(212, 212, 600, "rgba(255,255,255,0.16)", 6)),
    "icon-background.png", 1024);
  // Adaptive foreground: the card only, kept within the central safe zone, transparent rest
  await render(wrap(card(540)), "icon-foreground.png", 1024);

  // ── Splash screens (2732×2732, logo centered with wordmark) ──
  // Rounded orange tile (like a real app icon) instead of a hard square.
  const roundedTile = `
    <defs><linearGradient id="bg2" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stop-color="#fbb84e"/><stop offset="0.5" stop-color="#f5880a"/>
      <stop offset="1" stop-color="#d4700a"/></linearGradient></defs>
    <rect width="1024" height="1024" rx="190" ry="190" fill="url(#bg2)"/>`;
  const logoComposite = (bg, word, sub) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
      <rect width="2732" height="2732" fill="${bg}"/>
      <g transform="translate(866,866) scale(1.0)">${roundedTile}${card(560)}</g>
      <text x="1366" y="2080" font-size="170" text-anchor="middle"
            font-family="${KAI}" font-weight="600" fill="${word}">小华听写</text>
      <text x="1366" y="2200" font-size="66" text-anchor="middle" letter-spacing="6"
            font-family="-apple-system, Helvetica, sans-serif" fill="${sub}">CHINESE SPELLING BUDDY</text>
    </svg>`;
  await sharp(Buffer.from(logoComposite("#fef3e2", "#b83b2e", "#c39a72")))
    .png().toFile(path.join(OUT, "splash.png"));
  console.log("wrote splash.png");
  await sharp(Buffer.from(logoComposite("#241710", "#f0c89a", "#8a6b4d")))
    .png().toFile(path.join(OUT, "splash-dark.png"));
  console.log("wrote splash-dark.png");
})();
