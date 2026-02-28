import "server-only";

import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CLIENTS_ROOT,
  CONTENT_CLIENTS_ROOT,
  assertValidClientId,
  resolveInside
} from "@/lib/server-runtime";
import { ANALYTICS_BASE_PATH, type ClientAccess } from "@/lib/client-content";

type CreateClientScaffoldOptions = {
  clientId: string;
  title: string;
  access: ClientAccess;
  coverImage?: string;
};

function buildCoverSvg(title: string) {
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
  <text x="148" y="430" fill="#D9F0E9" font-size="36" font-family="Arial, sans-serif">Slides, imagery, and future website code live beside the registry entry.</text>
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

async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

export function getDefaultClientCoverImage(clientId: string) {
  const normalizedClientId = assertValidClientId(clientId);
  return `${ANALYTICS_BASE_PATH}/clients/${normalizedClientId}/cover/cover.svg`;
}

export async function ensureClientScaffold({
  clientId,
  title,
  access,
  coverImage
}: CreateClientScaffoldOptions) {
  const normalizedClientId = assertValidClientId(clientId);
  const clientDir = resolveInside(CLIENTS_ROOT, normalizedClientId);
  const httpDir = path.join(clientDir, "http");
  const imagesDir = path.join(clientDir, "images");
  const contentPath = resolveInside(CONTENT_CLIENTS_ROOT, `${normalizedClientId}.json`);
  const readmePath = path.join(httpDir, "README.md");
  const coverPath = path.join(imagesDir, "cover.svg");

  await mkdir(httpDir, { recursive: true });
  await mkdir(imagesDir, { recursive: true });
  await mkdir(CONTENT_CLIENTS_ROOT, { recursive: true });

  if (!(await pathExists(readmePath))) {
    await writeFile(readmePath, "future website code lives here\n", "utf8");
  }

  if (!(await pathExists(coverPath))) {
    await writeFile(coverPath, buildCoverSvg(title), "utf8");
  }

  if (!(await pathExists(contentPath))) {
    await writeFile(
      contentPath,
      `${JSON.stringify(
        {
          clientId: normalizedClientId,
          title,
          access,
          coverImage: coverImage || getDefaultClientCoverImage(normalizedClientId),
          updatedAt: new Date().toISOString(),
          summary: "",
          slides: []
        },
        null,
        2
      )}\n`,
      "utf8"
    );
  }

  return {
    clientDir,
    contentPath,
    coverImage: coverImage || getDefaultClientCoverImage(normalizedClientId)
  };
}
