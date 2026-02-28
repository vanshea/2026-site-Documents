#!/usr/bin/env node

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const DOCUMENTS_ROOT = "/Library/WebServer/Documents";
const CLIENTS_ROOT = path.join(DOCUMENTS_ROOT, "clients");
const CLIENT_INDEX_PATH = path.join(DOCUMENTS_ROOT, "content", "clients", "index.json");
const ANALYTICS_BASE_PATH = "/analytics";

function usage() {
  console.error(
    [
      "Usage:",
      '  npm run client:scaffold -- <clientId> [--title "Client Name"] [--access public|password]',
      "",
      "Example:",
      '  npm run client:scaffold -- acme --title "ACME" --access password'
    ].join("\n")
  );
}

function toTitleCase(clientId) {
  return clientId
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeClientId(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error("clientId must match ^[a-z0-9]+(?:-[a-z0-9]+)*$");
  }

  return normalized;
}

function parseArgs(argv) {
  const positionals = [];
  let title = "";
  let access = "public";

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--title") {
      title = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }

    if (token === "--access") {
      const candidate = String(argv[index + 1] || "").trim().toLowerCase();
      if (candidate !== "public" && candidate !== "password") {
        throw new Error('--access must be "public" or "password".');
      }
      access = candidate;
      index += 1;
      continue;
    }

    positionals.push(token);
  }

  if (positionals.length === 0) {
    usage();
    process.exit(1);
  }

  const clientId = normalizeClientId(positionals[0]);

  return {
    access,
    clientId,
    title: title || toTitleCase(clientId)
  };
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function ensureJsonFile(filePath, defaultValue) {
  if (await pathExists(filePath)) {
    return;
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(defaultValue, null, 2)}\n`, "utf8");
}

async function readJson(filePath, fallbackValue) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return fallbackValue;
    }
    throw error;
  }
}

function buildCoverSvg(title) {
  const escapedTitle = title
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="900" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="900" fill="#103431"/>
  <rect x="56" y="56" width="1488" height="788" rx="36" fill="url(#panel)"/>
  <path d="M148 216C364 92 628 82 842 164C1056 246 1248 420 1452 412V844H148V216Z" fill="url(#glow)" fill-opacity="0.68"/>
  <path d="M1442 180C1190 300 1004 312 808 252C612 192 396 178 148 312V56H1442V180Z" fill="#E3F0E8" fill-opacity="0.26"/>
  <text x="148" y="190" fill="#D9F0E9" font-size="34" font-family="Arial, sans-serif" letter-spacing="0.28em">CLIENT ROOM</text>
  <text x="148" y="350" fill="#F8FCFA" font-size="118" font-family="Arial, sans-serif" font-weight="700">${escapedTitle}</text>
  <text x="148" y="430" fill="#D9F0E9" font-size="36" font-family="Arial, sans-serif">Slides, imagery, and future website code stay together in /clients/&lt;id&gt;.</text>
  <rect x="148" y="620" width="332" height="84" rx="42" fill="#F6D6BF"/>
  <text x="206" y="674" fill="#8A4A32" font-size="30" font-family="Arial, sans-serif" font-weight="700">Portfolio delivery</text>
  <defs>
    <linearGradient id="panel" x1="120" y1="80" x2="1450" y2="848" gradientUnits="userSpaceOnUse">
      <stop stop-color="#194742"/>
      <stop offset="0.55" stop-color="#1F6F5F"/>
      <stop offset="1" stop-color="#9FD0C5"/>
    </linearGradient>
    <linearGradient id="glow" x1="148" y1="154" x2="1234" y2="782" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F5E6D8"/>
      <stop offset="1" stop-color="#D8F0E6"/>
    </linearGradient>
  </defs>
</svg>
`;
}

function buildStarterContent({ clientId, title, access }) {
  return {
    clientId,
    title,
    access,
    updatedAt: new Date().toISOString().slice(0, 10),
    summary:
      "Starter content scaffold. Replace these slides with the actual presentation narrative for the client.",
    slides: [
      {
        id: "overview",
        eyebrow: "Overview",
        title: `${title} presentation room`,
        body:
          "This slide deck loads from the file system after the server-side access check passes.\n\nKeep high-level narrative here and add images in /clients/<clientId>/images.",
        bullets: [
          "Canonical runtime content lives in /clients/<clientId>/content.json.",
          "The lightweight public registry entry lives in /content/clients/index.json.",
          "Future website implementation files belong in /clients/<clientId>/http."
        ],
        image: {
          asset: "cover.svg",
          alt: `${title} cover`,
          caption: "Starter cover image generated by the scaffold script."
        }
      },
      {
        id: "delivery",
        eyebrow: "Delivery",
        title: "Replace this with project-specific slides",
        body:
          "Each slide can include plain body copy, bullet lists, and an optional image asset path.\n\nIf this client should be locked, set CLIENT_PASSWORD_<CLIENTID_UPPER_SNAKE> in the environment and keep access set to password.",
        bullets: [
          "Edit the narrative directly in content.json.",
          "Add supporting images under /images.",
          "Place future website source or prototypes under /http."
        ]
      }
    ]
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const clientDir = path.join(CLIENTS_ROOT, options.clientId);
  const imagesDir = path.join(clientDir, "images");
  const httpDir = path.join(clientDir, "http");
  const contentPath = path.join(clientDir, "content.json");
  const httpReadmePath = path.join(httpDir, "README.md");
  const coverImagePath = path.join(imagesDir, "cover.svg");

  await mkdir(imagesDir, { recursive: true });
  await mkdir(httpDir, { recursive: true });
  await mkdir(path.dirname(CLIENT_INDEX_PATH), { recursive: true });

  if (!(await pathExists(httpReadmePath))) {
    await writeFile(httpReadmePath, "future website code lives here\n", "utf8");
  }

  if (!(await pathExists(coverImagePath))) {
    await writeFile(coverImagePath, buildCoverSvg(options.title), "utf8");
  }

  await ensureJsonFile(contentPath, buildStarterContent(options));

  const registry = await readJson(CLIENT_INDEX_PATH, []);
  if (!Array.isArray(registry)) {
    throw new Error("content/clients/index.json must contain an array.");
  }

  const coverImage = `${ANALYTICS_BASE_PATH}/clients/${options.clientId}/cover/cover.svg`;
  const nextEntry = {
    access: options.access,
    clientId: options.clientId,
    coverImage,
    title: options.title
  };

  const filteredRegistry = registry.filter((entry) => entry && entry.clientId !== options.clientId);
  filteredRegistry.push(nextEntry);
  filteredRegistry.sort((left, right) => String(left.clientId).localeCompare(String(right.clientId)));

  await writeFile(CLIENT_INDEX_PATH, `${JSON.stringify(filteredRegistry, null, 2)}\n`, "utf8");

  console.log(`Client scaffold ready for ${options.clientId}`);
  console.log(`- ${contentPath}`);
  console.log(`- ${imagesDir}`);
  console.log(`- ${httpReadmePath}`);
  console.log(`- ${CLIENT_INDEX_PATH}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
