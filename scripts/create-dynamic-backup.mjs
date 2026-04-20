import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const timestamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+/, "")
  .replace("T", "_");

const backupRoot = path.resolve(
  process.env.DYNAMIC_BACKUP_OUTPUT_DIR ||
    path.join(process.env.HOME || projectRoot, "Backups", "portfolio-site", "dynamic-preserved", timestamp)
);
const snapshotRoot = path.join(backupRoot, "project-snapshot");
const privateStateRoot = path.join(backupRoot, "private-state");
const zipPath = `${backupRoot}.zip`;

const topLevelFiles = [
  ".env",
  ".env.example",
  ".gitignore",
  "README.md",
  "analytics.js",
  "experience.html",
  "index.html",
  "package-lock.json",
  "package.json",
  "postgres_dump_20260218_081301.sql",
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
  "data",
  "docs",
  "large_web_portfolio",
  "lib",
  "prisma",
  "scripts",
  "views"
];

const excludedNames = new Set([
  ".DS_Store",
  ".git",
  ".next",
  "node_modules"
]);

function shouldCopy(sourcePath) {
  const relative = path.relative(projectRoot, sourcePath);
  const parts = relative.split(path.sep).filter(Boolean);
  return !parts.some((part) => excludedNames.has(part));
}

async function copyIfPresent(relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  if (!existsSync(sourcePath)) {
    return;
  }

  await cp(sourcePath, path.join(snapshotRoot, relativePath), {
    recursive: true,
    filter: shouldCopy
  });
}

function extractEnvValue(envText, key) {
  const line = String(envText || "")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${key}=`));
  if (!line) return "";
  return line.slice(key.length + 1).trim();
}

async function copyPrivateFile(sourcePath, targetName) {
  if (!sourcePath || !existsSync(sourcePath)) {
    return false;
  }

  await mkdir(privateStateRoot, { recursive: true });
  await cp(sourcePath, path.join(privateStateRoot, targetName));
  return true;
}

function zipBackupDirectory() {
  const zipCheck = spawnSync("sh", ["-lc", "command -v zip >/dev/null 2>&1"], {
    stdio: "ignore"
  });
  if (zipCheck.status !== 0) {
    return false;
  }

  const parentDir = path.dirname(backupRoot);
  const folderName = path.basename(backupRoot);
  const result = spawnSync("zip", ["-rq", zipPath, folderName], {
    cwd: parentDir,
    stdio: "inherit"
  });

  return result.status === 0;
}

async function writeBackupNotes({ copiedExternalSqlite, copiedRepoSqlite, clientSecretsDbPath }) {
  const readme = `# Dynamic Site Backup

Created:
- ${new Date().toString()}

What this backup preserves:
- the current working copy of the dynamic Express + Next.js project
- the local .env file used on this machine
- the current repo data folder
- the external client password SQLite database when present
- the existing repo PostgreSQL dump file when present

Paths:
- project snapshot: \`project-snapshot/\`
- private state: \`private-state/\`

Private state copied:
- repo SQLite file copied: ${copiedRepoSqlite ? "yes" : "no"}
- external SQLite file copied: ${copiedExternalSqlite ? "yes" : "no"}
- external SQLite source path: ${clientSecretsDbPath || "(not configured)"}

PostgreSQL note:
- A fresh PostgreSQL analytics dump was not created automatically in this backup workflow.
- Reason: \`pg_dump\` was not available on this machine at backup time.
- Existing repo dump file included if present: ${existsSync(path.join(projectRoot, "postgres_dump_20260218_081301.sql")) ? "yes" : "no"}

Restore outline:
1. Copy \`project-snapshot/\` to a new working folder.
2. Restore files from \`private-state/\` as needed.
3. Run \`npm install\`.
4. Run \`npm --prefix analytics-ui install\`.
5. Start locally with \`npm run dev\`.
`;

  await writeFile(path.join(backupRoot, "README.md"), readme, "utf8");
}

async function main() {
  await rm(backupRoot, { recursive: true, force: true });
  await mkdir(snapshotRoot, { recursive: true });

  for (const file of topLevelFiles) {
    await copyIfPresent(file);
  }

  for (const dir of topLevelDirs) {
    await copyIfPresent(dir);
  }

  const envText = existsSync(path.join(projectRoot, ".env"))
    ? await readFile(path.join(projectRoot, ".env"), "utf8")
    : "";
  const clientSecretsDbPath = extractEnvValue(envText, "CLIENT_SECRETS_DB_PATH");

  const copiedRepoSqlite = await copyPrivateFile(
    path.join(projectRoot, "data", "client-secrets.sqlite"),
    "client-secrets.repo.sqlite"
  );
  const copiedExternalSqlite = await copyPrivateFile(
    clientSecretsDbPath,
    "client-secrets.external.sqlite"
  );

  await writeBackupNotes({
    copiedExternalSqlite,
    copiedRepoSqlite,
    clientSecretsDbPath
  });

  const zipped = zipBackupDirectory();
  process.stdout.write(
    `Dynamic backup created at ${backupRoot}${zipped ? ` and ${zipPath}` : ""}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
