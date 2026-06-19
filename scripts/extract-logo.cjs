/* Extract the gold emblem from the website-logo screenshot and recomposite it
 * onto a clean navy gradient, then emit icon + splash sources for @capacitor/assets. */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "/Users/Linden/Desktop/截屏2026-06-19 21.10.30.png";
const OUT = path.join(__dirname, "..", "assets");
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const img = sharp(SRC);
  const meta = await img.metadata();
  console.log("screenshot", meta.width + "x" + meta.height);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const C = info.channels, W = info.width, H = info.height;

  // 1) Find the navy rounded-square bbox (B dominant, fairly dark).
  let minx = W, miny = H, maxx = 0, maxy = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C, r = data[i], g = data[i + 1], b = data[i + 2];
    const br = (r + g + b) / 3;
    if (b > r + 8 && br < 150) {
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
    }
  }
  const bw = maxx - minx, bh = maxy - miny;
  console.log("navy bbox", { minx, miny, maxx, maxy, bw, bh });

  // 2) Build a gold-emblem alpha mask over the FULL screenshot: gold = R well above B.
  //    Output a tight-cropped RGBA of just the emblem (gold recolored later via gradient).
  const side = Math.max(bw, bh);
  // emblem bbox (gold pixels) for centering
  let ex0 = W, ey0 = H, ex1 = 0, ey1 = 0;
  const alpha = Buffer.alloc(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C, r = data[i], b = data[i + 2];
    const d = r - b; // gold >> 0, navy << 0
    let a = (d - 25) / 45; // soft ramp 25..70
    a = a < 0 ? 0 : a > 1 ? 1 : a;
    const av = Math.round(a * 255);
    alpha[y * W + x] = av;
    if (av > 60) { if (x < ex0) ex0 = x; if (x > ex1) ex1 = x; if (y < ey0) ey0 = y; if (y > ey1) ey1 = y; }
  }
  console.log("emblem bbox", { ex0, ey0, ex1, ey1, w: ex1 - ex0, h: ey1 - ey0 });

  // Build a straight-alpha RGBA crop of the emblem: keep the original gold
  // colour from the real logo, with alpha from the gold mask. Force RGB toward
  // a clean gold so anti-aliased edges don't pick up navy fringing.
  const pad = 6;
  const cx0 = Math.max(0, ex0 - pad), cy0 = Math.max(0, ey0 - pad);
  const cw = Math.min(W - cx0, ex1 - ex0 + pad * 2), ch = Math.min(H - cy0, ey1 - ey0 + pad * 2);
  const emblemRGBA = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const si = ((cy0 + y) * W + (cx0 + x)) * C;
    const a = alpha[(cy0 + y) * W + (cx0 + x)];
    const di = (y * cw + x) * 4;
    // original gold, but lift toward warm gold to kill any navy bleed
    emblemRGBA[di] = Math.min(255, data[si] + 10);
    emblemRGBA[di + 1] = Math.max(data[si + 1], Math.round(data[si] * 0.72));
    emblemRGBA[di + 2] = Math.min(data[si + 2], 90);
    emblemRGBA[di + 3] = a;
  }
  const emblemSharp = () => sharp(emblemRGBA, { raw: { width: cw, height: ch, channels: 4 } });

  // 3) A clean 1024 navy gradient background + soft highlight ellipse.
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

  // Scale emblem to ~64% of the icon, centered.
  const target = Math.round(1024 * 0.64);
  const scale = target / Math.max(cw, ch);
  const ew = Math.round(cw * scale), eh = Math.round(ch * scale);
  const goldEmblem = await emblemSharp().resize(ew, eh).png().toBuffer();

  const left = Math.round((1024 - ew) / 2), top = Math.round((1024 - eh) / 2);

  // icon-only (full): navy + emblem
  await sharp(Buffer.from(navyBg))
    .composite([{ input: goldEmblem, left, top }])
    .png().toFile(path.join(OUT, "icon-only.png"));
  // adaptive background: navy only
  await sharp(Buffer.from(navyBg)).png().toFile(path.join(OUT, "icon-background.png"));
  // adaptive foreground: emblem on transparent, centered (safe zone)
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: goldEmblem, left, top }])
    .png().toFile(path.join(OUT, "icon-foreground.png"));
  console.log("wrote icons");

  // 5) Splash: rounded navy tile + emblem + wordmark.
  const KAI = "Songti SC, STSong, Songti, serif";
  const splash = (bg, word, sub) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732">
      <rect width="2732" height="2732" fill="${bg}"/>
      <text x="1366" y="2090" font-size="172" text-anchor="middle" font-family="${KAI}" font-weight="600" fill="${word}">小华听写</text>
      <text x="1366" y="2208" font-size="64" text-anchor="middle" letter-spacing="7" font-family="-apple-system,Helvetica,sans-serif" fill="${sub}">CHINESE SPELLING BUDDY</text>
    </svg>`;
  const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
      <defs><clipPath id="c"><rect width="900" height="900" rx="180"/></clipPath></defs>
      <g clip-path="url(#c)">${navyBg.replace('width="1024" height="1024">', 'width="900" height="900" viewBox="0 0 1024 1024">')}</g>
    </svg>`;
  const tilePng = await sharp(Buffer.from(tileSvg)).png().toBuffer();
  const tew = Math.round(ew * 900 / 1024), teh = Math.round(eh * 900 / 1024);
  const emblemForTile = await emblemSharp().resize(tew, teh).png().toBuffer();
  const tileMeta = { w: 900 };
  const tileWithEmblem = await sharp(tilePng).composite([{ input: emblemForTile, gravity: "center" }]).png().toBuffer();

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
