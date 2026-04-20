import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
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

const excludedNames = new Set([".DS_Store", "README.md"]);

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

async function copyTree(relativePath = "") {
  const sourcePath = path.join(sourceRoot, relativePath);
  const targetPath = path.join(uploadRoot, relativePath);
  const sourceStat = await stat(sourcePath);

  if (sourceStat.isDirectory()) {
    await mkdir(targetPath, { recursive: true });
    const entries = await readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      if (excludedNames.has(entry.name)) {
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

  await cp(sourcePath, targetPath);
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
  await writeBundleNotes();

  process.stdout.write(`${variantLabel()} static bundle created at ${bundleRoot}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
