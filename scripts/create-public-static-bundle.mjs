import { cp, mkdir, readFile, readdir, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const variant = String(process.argv[2] || "comingsoon").trim().toLowerCase();
const supportedVariants = new Set(["livesite", "comingsoon", "build"]);

if (!supportedVariants.has(variant)) {
  console.error(`Unsupported static bundle variant: ${variant}`);
  process.exit(1);
}

const sourceRoot = path.join(projectRoot, variant);
const bundleRoot = path.resolve(
  process.env.PUBLIC_STATIC_BUNDLE_OUTPUT_DIR ||
    path.join(process.env.HOME || projectRoot, "Backups", "portfolio-site", `${variant}-static-upload`)
);
const uploadRoot = path.join(bundleRoot, "ftp-upload");

const excludedNames = new Set([
  ".DS_Store",
  ".well-known",
  "__MACOSX",
  "_notes",
  "analytics.js",
  "log42626",
  "README.md"
]);

function shouldExcludeEntry(name) {
  return excludedNames.has(name) || name.startsWith("._");
}

function variantLabel() {
  if (variant === "livesite") return "Live Site";
  if (variant === "comingsoon") return "Coming Soon";
  return "Build";
}

function stripStaticOnlyFeatures(html) {
  return String(html || "")
    .replace(/\s*<script src="\/?(?:livesite|comingsoon|build)\/analytics\.js"><\/script>\s*/g, "\n")
    .replace(/\s*<script src="\/?analytics\.js"><\/script>\s*/g, "\n")
    .replace(/\s*<aside[\s\S]*?id="consentBanner"[\s\S]*?<\/aside>\s*/g, "\n")
    .replace(/\s*<button class="theme-link consent-manage-btn"[\s\S]*?<\/button>\s*/g, "\n")
    .replace(/\sdata-analytics(?:-location)?="[^"]*"/g, "");
}

function rewriteVariantLinks(html) {
  return String(html || "")
    .replace(new RegExp(`(["'(])\\/${variant}\\/styles\\.css`, "g"), "$1/styles.css")
    .replace(new RegExp(`(["'(])\\/${variant}\\/script\\.js`, "g"), "$1/script.js")
    .replace(new RegExp(`(["'(])\\/${variant}\\/analytics\\.js`, "g"), "$1/analytics.js")
    .replace(new RegExp(`(["'(])\\/${variant}\\/experience\\.html`, "g"), "$1/experience.html")
    .replace(new RegExp(`(["'(])\\/${variant}\\/index\\.html`, "g"), "$1/index.html")
    .replace(new RegExp(`(["'(])\\/${variant}\\/case-studies`, "g"), "$1/case-studies")
    .replace(new RegExp(`(["'(])\\/${variant}\\/aidesign`, "g"), "$1/aidesign")
    .replace(new RegExp(`(["'(])\\/${variant}\\/`, "g"), "$1/")
    .replace(new RegExp(`href="\\/${variant}"`, "g"), 'href="/"')
    .replace(new RegExp(`action="\\/${variant}"`, "g"), 'action="/"');
}

function rewriteHtmlForUpload(html, relativePath) {
  const rewritten = stripStaticOnlyFeatures(rewriteVariantLinks(html));

  if (relativePath === "experience.html") {
    return rewritten.replace(/<a href="\/">Home<\/a>/, '<a href="/index.html">Home</a>');
  }

  return rewritten;
}

function rewriteScriptForUpload(script) {
  return String(script || "").replace(
    'const sources = ["/api/vscimage/config", "/assets/vscimage/config.json"];',
    'const sources = ["/assets/vscimage/config.json"];'
  );
}

function rewriteStaticConfigForUpload(json) {
  const config = JSON.parse(json);
  return `${JSON.stringify(
    {
      logos: config.logos || {},
      projects: config.projects || {}
    },
    null,
    2
  )}\n`;
}

async function copyTree(relativePath = "") {
  const sourcePath = path.join(sourceRoot, relativePath);
  const targetPath = path.join(uploadRoot, relativePath);
  const sourceStat = await stat(sourcePath);

  if (sourceStat.isDirectory()) {
    await mkdir(targetPath, { recursive: true });
    const entries = await readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      if (shouldExcludeEntry(entry.name)) {
        continue;
      }
      await copyTree(path.join(relativePath, entry.name));
    }
    return;
  }

  if (path.extname(sourcePath).toLowerCase() === ".html") {
    const raw = await readFile(sourcePath, "utf8");
    await writeFile(targetPath, rewriteHtmlForUpload(raw, relativePath), "utf8");
    return;
  }

  if (relativePath === "script.js") {
    const raw = await readFile(sourcePath, "utf8");
    await writeFile(targetPath, rewriteScriptForUpload(raw), "utf8");
    return;
  }

  if (relativePath === path.join("assets", "vscimage", "config.json")) {
    const raw = await readFile(sourcePath, "utf8");
    await writeFile(targetPath, rewriteStaticConfigForUpload(raw), "utf8");
    return;
  }

  await cp(sourcePath, targetPath);
}

async function collectUploadFiles(relativePath = "") {
  const absolutePath = path.join(uploadRoot, relativePath);
  const fileStat = await stat(absolutePath);

  if (!fileStat.isDirectory()) {
    return [relativePath];
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    files.push(...(await collectUploadFiles(path.join(relativePath, entry.name))));
  }

  return files;
}

function normalizeUploadRef(fromRelativePath, rawRef) {
  let value = String(rawRef || "")
    .replace(/&amp;/g, "&")
    .trim();

  if (
    !value ||
    value.startsWith("#") ||
    /^(?:mailto:|tel:|data:|javascript:)/i.test(value) ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
  ) {
    return "";
  }

  value = value.split("#")[0].split("?")[0];
  if (!value || value === "/") return "";

  let target = value.startsWith("/")
    ? value.slice(1)
    : path.posix.normalize(
        path.posix.join(path.posix.dirname(fromRelativePath), value)
      );

  if (!path.posix.extname(target) && !target.endsWith("/")) {
    target += "/index.html";
  }
  if (target.endsWith("/")) {
    target += "index.html";
  }

  return target;
}

function addUploadRef(refs, fromRelativePath, rawRef) {
  const normalized = normalizeUploadRef(fromRelativePath, rawRef);
  if (normalized) refs.add(normalized);
}

async function pruneUnreferencedImages() {
  const files = await collectUploadFiles();
  const refs = new Set();
  const imageExtensions = new Set([".gif", ".ico", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
  const keepImages = new Set(["fav.ico", "fav32px.png"]);

  for (const relativePath of files) {
    const extension = path.extname(relativePath).toLowerCase();
    if (extension !== ".html" && extension !== ".css") {
      continue;
    }

    const raw = await readFile(path.join(uploadRoot, relativePath), "utf8");
    const attributePattern =
      /\b(?:href|src|srcset|data-src|data-fullscreen-src|data-lightbox-src)\s*=\s*["']([^"']+)["']/gi;
    let match;

    while ((match = attributePattern.exec(raw))) {
      const attributeName = match[0].split("=")[0].toLowerCase();
      if (attributeName === "srcset") {
        for (const srcsetItem of match[1].split(",")) {
          addUploadRef(refs, relativePath, srcsetItem.trim().split(/\s+/)[0]);
        }
        continue;
      }
      addUploadRef(refs, relativePath, match[1]);
    }

    const cssUrlPattern = /url\(([^)]+)\)/gi;
    while ((match = cssUrlPattern.exec(raw))) {
      addUploadRef(refs, relativePath, match[1].replace(/^['"]|['"]$/g, ""));
    }
  }

  const configPath = path.join(uploadRoot, "assets", "vscimage", "config.json");
  try {
    const config = JSON.parse(await readFile(configPath, "utf8"));
    for (const logoPath of Object.values(config.logos || {})) {
      addUploadRef(refs, "index.html", logoPath);
    }
    for (const projectConfig of Object.values(config.projects || {})) {
      for (const assetKey of ["thumb", "large", "fullscreen"]) {
        addUploadRef(refs, "index.html", projectConfig?.[assetKey]);
      }
    }
  } catch (error) {
    // If the optional image config is unavailable, keep pruning based on markup/CSS.
  }

  for (const relativePath of files) {
    if (!imageExtensions.has(path.extname(relativePath).toLowerCase())) {
      continue;
    }
    if (refs.has(relativePath) || keepImages.has(relativePath)) {
      continue;
    }
    await unlink(path.join(uploadRoot, relativePath));
  }
}

async function writeBundleNotes() {
  const readme = `# ${variantLabel()} Static FTP Upload

Source folder:
- \`${variant}/\`

Upload target:
- Upload the contents of \`ftp-upload/\` into the host web root.

Included:
- \`index.html\`
- \`experience.html\`
- \`styles.css\`
- \`script.js\`
- \`case-studies/\`
- \`aidesign/\`
- \`assets/\`
- \`.htaccess\`

Important:
- This package is static only.
- It does not include the Express runtime, Next.js analytics app, or databases.
- App-only routes such as \`/analytics\`, \`/app\`, and \`/login\` are redirected to the homepage.
`;

  await writeFile(path.join(bundleRoot, "README.md"), readme, "utf8");
}

async function main() {
  await rm(bundleRoot, { recursive: true, force: true });
  await mkdir(uploadRoot, { recursive: true });

  await copyTree();
  await pruneUnreferencedImages();
  await writeBundleNotes();

  process.stdout.write(`${variantLabel()} static bundle created at ${bundleRoot}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
