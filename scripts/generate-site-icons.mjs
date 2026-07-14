import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const newLogoPaths = `
  <path d="M31.62,42.89l-1.83,1.83-1.83,1.83L1.21,19.8c-.79,2.58-1.21,5.32-1.21,8.15,0,15.44,12.52,27.95,27.95s27.95-12.52,27.95-27.95c0-2.83-.42-5.57-1.21-8.14l-23.08,23.08Z"/>
  <path d="M27.96,39.22l24.58-24.58c-1.05-1.94-2.33-3.74-3.8-5.37l-17.12,17.12-3.66,3.66L7.17,9.26c-1.47,1.63-2.74,3.43-3.8,5.37l24.59,24.59Z"/>
  <path d="M27.96,22.72L44.93,5.75C40.23,2.14,34.34,0,27.95,0S15.69,2.14,10.98,5.74l16.98,16.98Z"/>
`;

const touchIconSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="-4 -4 63.91 63.91">
  <rect x="-4" y="-4" width="63.91" height="63.91" fill="#f8f2e8"/>
  <g fill="#161616">${newLogoPaths}</g>
</svg>
`);

const tabIconSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="-3 -3 61.91 61.91">
  <circle cx="27.955" cy="27.955" r="27.955" fill="#161616"/>
  <g fill="#f8f2e8">${newLogoPaths}</g>
</svg>
`);

const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="-3 -3 61.91 61.91" role="img" aria-label="Van Shea Creative">
  <style>
    .mark { fill: #161616; }
    @media (prefers-color-scheme: dark) { .mark { fill: #f8f2e8; } }
  </style>
  <g class="mark">${newLogoPaths}</g>
</svg>
`;

const targets = [
  { dir: path.join(projectRoot, "assets", "icons"), prefix: "/assets/icons" },
  { dir: path.join(projectRoot, "livesite"), prefix: "" },
  { dir: path.join(projectRoot, "livesite", "assets", "icons"), prefix: "/assets/icons" },
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
      theme_color: "#161616",
      background_color: "#f8f2e8",
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
