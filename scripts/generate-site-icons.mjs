import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const touchIconSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#f7f4ec"/>
  <circle cx="160" cy="160" r="140" fill="#020319"/>
  <path d="M40 95 L145 200 L280 65" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M28 122 L145 240 L248 137" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>
`);

const tabIconSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 320 320">
  <circle cx="160" cy="160" r="140" fill="#020319"/>
  <path d="M40 95 L145 200 L280 65" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M28 122 L145 240 L248 137" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>
`);

const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" role="img" aria-label="Van Shea Creative">
  <circle cx="160" cy="160" r="140" fill="#020319"/>
  <path d="M40 95 L145 200 L280 65" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M28 122 L145 240 L248 137" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>
`;

const targets = [
  { dir: path.join(projectRoot, "assets", "icons"), prefix: "/assets/icons" },
  { dir: path.join(projectRoot, "livesite"), prefix: "" },
  { dir: path.join(projectRoot, "comingsoon"), prefix: "/comingsoon" },
  { dir: path.join(projectRoot, "build"), prefix: "/build" }
];

const pngSizes = [
  ["favicon-16x16.png", 16, "tab"],
  ["favicon-32x32.png", 32, "tab"],
  ["favicon-48x48.png", 48, "tab"],
  ["fav32px.png", 32, "tab"],
  ["apple-touch-icon.png", 180, "touch"],
  ["android-chrome-192x192.png", 192, "touch"],
  ["android-chrome-512x512.png", 512, "touch"]
];

async function renderPng(size, style) {
  const source = style === "touch" ? touchIconSvg : tabIconSvg;
  return sharp(source).resize(size, size, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
}

function createIco(images) {
  const headerLength = 6;
  const directoryLength = images.length * 16;
  let imageOffset = headerLength + directoryLength;

  const header = Buffer.alloc(headerLength);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = images.map(({ size, buffer }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(imageOffset, 12);
    imageOffset += buffer.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ buffer }) => buffer)]);
}

function manifest(prefix) {
  const base = prefix || "";
  return `${JSON.stringify(
    {
      name: "Van Shea Creative",
      short_name: "Van Shea",
      icons: [
        {
          src: `${base}/android-chrome-192x192.png`,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: `${base}/android-chrome-512x512.png`,
          sizes: "512x512",
          type: "image/png"
        }
      ],
      theme_color: "#020319",
      background_color: "#f7f4ec",
      display: "standalone"
    },
    null,
    2
  )}\n`;
}

const rendered = new Map();
for (const [, size, style] of pngSizes) {
  const key = `${style}-${size}`;
  if (!rendered.has(key)) {
    rendered.set(key, await renderPng(size, style));
  }
}

const ico = createIco(
  [16, 32, 48].map((size) => ({
    size,
    buffer: rendered.get(`tab-${size}`)
  }))
);

for (const target of targets) {
  await mkdir(target.dir, { recursive: true });

  await writeFile(path.join(target.dir, "favicon.svg"), faviconSvg, "utf8");
  await writeFile(path.join(target.dir, "favicon.ico"), ico);
  await writeFile(path.join(target.dir, "fav.ico"), ico);
  await writeFile(path.join(target.dir, "site.webmanifest"), manifest(target.prefix), "utf8");

  for (const [filename, size, style] of pngSizes) {
    await writeFile(path.join(target.dir, filename), rendered.get(`${style}-${size}`));
  }
}
