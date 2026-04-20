import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const launchReadyRoot = path.resolve(
  process.env.LAUNCH_READY_OUTPUT_DIR ||
    path.join(process.env.HOME || projectRoot, "Backups", "portfolio-site", "launch-ready")
);
const uploadRoot = path.join(launchReadyRoot, "ftp-upload");

const topLevelFiles = [
  ".env.example",
  ".gitignore",
  "README.md",
  "analytics.js",
  "experience.html",
  "index.html",
  "package-lock.json",
  "package.json",
  "script.js",
  "server.js",
  "styles.css",
  "vscimage.css",
  "vscimage.js"
];

const topLevelDirs = [
  "analytics-ui",
  "assets",
  "clients",
  "content",
  "docs",
  "large_web_portfolio",
  "lib",
  "prisma",
  "scripts",
  "views"
];

const excludedNames = new Set([
  ".DS_Store",
  ".env",
  ".git",
  ".next",
  "launch-ready",
  "node_modules",
  "postgres_dump_20260218_081301.sql"
]);

function shouldCopy(sourcePath) {
  const relativePath = path.relative(projectRoot, sourcePath);
  const parts = relativePath.split(path.sep).filter(Boolean);

  if (parts.some((part) => excludedNames.has(part))) {
    return false;
  }

  if (relativePath === "data" || relativePath.startsWith(`data${path.sep}`)) {
    return false;
  }

  if (relativePath === "assets/vscimage/originals") {
    return false;
  }

  if (relativePath.startsWith(`assets${path.sep}vscimage${path.sep}originals${path.sep}`)) {
    return false;
  }

  return true;
}

async function copyIntoUpload(relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  const destinationPath = path.join(uploadRoot, relativePath);

  await cp(sourcePath, destinationPath, {
    recursive: true,
    filter: shouldCopy
  });
}

async function writeLaunchNotes() {
  const envExample = await readFile(path.join(projectRoot, ".env.example"), "utf8");

  const launchReadme = `# Launch-Ready FTP Upload

Source bundle:
- Upload the contents of \`ftp-upload/\` to your server checkout directory.
- This bundle excludes local-only secrets, the SQL dump, SQLite password DB, \`node_modules\`, and build artifacts.

Before you start the app on the server:
1. Copy \`.env.production.example\` to \`.env\`.
2. Fill in every placeholder secret and credential.
3. Set \`TRUSTED_WEB_ORIGINS\` to your real domain(s).
4. Set \`CLIENT_SECRETS_DB_PATH\` to a private absolute path outside the public web root.
5. Either copy your private SQLite file to that path securely or recreate client passwords from \`/analytics/home\`.

Server commands:
\`\`\`bash
npm install
npm --prefix analytics-ui install
npm run prisma:generate
npm run prisma:deploy
npm --prefix analytics-ui run build
npm start
npm --prefix analytics-ui run start
\`\`\`
`;

  const dataReadme = `This folder is intentionally empty in the FTP bundle.

Do not upload a live client password database into the public app directory.
Instead, point CLIENT_SECRETS_DB_PATH at a private absolute path on the server,
for example /var/lib/portfolio-site/client-secrets.sqlite.
`;

  await writeFile(path.join(launchReadyRoot, "README.md"), launchReadme, "utf8");
  await writeFile(path.join(uploadRoot, ".env.production.example"), envExample, "utf8");
  await mkdir(path.join(uploadRoot, "data"), { recursive: true });
  await writeFile(path.join(uploadRoot, "data", "README.md"), dataReadme, "utf8");
}

async function main() {
  await rm(launchReadyRoot, { recursive: true, force: true });
  await mkdir(uploadRoot, { recursive: true });

  for (const file of topLevelFiles) {
    await copyIntoUpload(file);
  }

  for (const dir of topLevelDirs) {
    await copyIntoUpload(dir);
  }

  await writeLaunchNotes();

  process.stdout.write(`Launch-ready FTP bundle created at ${launchReadyRoot}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
