import "server-only";

import { timingSafeEqual } from "node:crypto";
import path from "node:path";
import { readFile } from "node:fs/promises";

export const DOCUMENTS_ROOT = path.resolve(process.cwd(), "..");
export const CLIENTS_ROOT = path.join(DOCUMENTS_ROOT, "clients");
export const CONTENT_CLIENTS_ROOT = path.join(DOCUMENTS_ROOT, "content", "clients");
export const CLIENT_INDEX_PATH = path.join(CONTENT_CLIENTS_ROOT, "index.json");
export const DATA_ROOT = path.join(DOCUMENTS_ROOT, "data");
export const ROOT_ENV_PATH = path.join(DOCUMENTS_ROOT, ".env");

let rootEnvCachePromise: Promise<Record<string, string>> | null = null;

export function safeCompare(left: string | Buffer, right: string | Buffer): boolean {
  const leftBuffer = Buffer.isBuffer(left) ? left : Buffer.from(left);
  const rightBuffer = Buffer.isBuffer(right) ? right : Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function assertValidClientId(clientId: string): string {
  const normalizedClientId = String(clientId || "").trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedClientId)) {
    throw new Error("Invalid client id.");
  }

  return normalizedClientId;
}

export function resolveInside(rootPath: string, ...segments: string[]): string {
  const resolvedPath = path.resolve(rootPath, ...segments);
  const relativePath = path.relative(rootPath, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Path escapes the allowed content root.");
  }

  return resolvedPath;
}

export function normalizeAssetPath(assetPath: string): string {
  const normalized = String(assetPath || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");

  if (!normalized || normalized.includes("..")) {
    throw new Error("Invalid asset path.");
  }

  return normalized;
}

function parseDotEnv(raw: string): Record<string, string> {
  const envMap: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    envMap[key] = value.replaceAll("\\n", "\n");
  }

  return envMap;
}

async function readRootEnvMap(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(ROOT_ENV_PATH, "utf8");
    return parseDotEnv(raw);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

export async function readServerEnv(key: string): Promise<string> {
  const directValue = process.env[key];
  if (typeof directValue === "string" && directValue.length > 0) {
    return directValue;
  }

  if (!rootEnvCachePromise) {
    rootEnvCachePromise = readRootEnvMap();
  }

  const rootEnv = await rootEnvCachePromise;
  return rootEnv[key] || "";
}
