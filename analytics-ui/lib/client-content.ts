import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";

export type ClientAccess = "public" | "password";

export type ClientRegistryEntry = {
  clientId: string;
  title: string;
  access: ClientAccess;
  coverImage: string;
};

export type ClientSlide = {
  id: string;
  eyebrow?: string;
  title: string;
  body?: string;
  bullets?: string[];
  image?: {
    asset: string;
    alt?: string;
    caption?: string;
  };
};

export type ClientContent = ClientRegistryEntry & {
  summary?: string;
  updatedAt?: string;
  slides: ClientSlide[];
};

export type ClientPasswordVerificationResult = "ok" | "invalid" | "not-configured";

export const ANALYTICS_BASE_PATH = "/analytics";
export const CLIENT_ACCESS_COOKIE_NAME = "vsc_client_access";
export const CLIENT_ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const DOCUMENTS_ROOT = path.resolve(process.cwd(), "..");
const CLIENTS_ROOT = path.join(DOCUMENTS_ROOT, "clients");
const CLIENT_INDEX_PATH = path.join(DOCUMENTS_ROOT, "content", "clients", "index.json");
const ROOT_ENV_PATH = path.join(DOCUMENTS_ROOT, ".env");

type ClientAccessErrorCode = "client-not-found" | "unlock-required" | "password-not-configured";

export class ClientAccessError extends Error {
  code: ClientAccessErrorCode;

  constructor(code: ClientAccessErrorCode, message: string) {
    super(message);
    this.name = "ClientAccessError";
    this.code = code;
  }
}

let rootEnvCachePromise: Promise<Record<string, string>> | null = null;

function assertValidClientId(clientId: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clientId)) {
    throw new ClientAccessError("client-not-found", "Invalid client id.");
  }

  return clientId;
}

function toClientPasswordEnvKey(clientId: string): string {
  return `CLIENT_PASSWORD_${clientId.replaceAll("-", "_").toUpperCase()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAccess(value: unknown): ClientAccess {
  return value === "password" ? "password" : "public";
}

function resolveInside(rootPath: string, ...segments: string[]): string {
  const resolvedPath = path.resolve(rootPath, ...segments);
  const relativePath = path.relative(rootPath, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Path escapes client content root.");
  }

  return resolvedPath;
}

function normalizeAssetPath(assetPath: string): string {
  const normalized = assetPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");

  if (!normalized || normalized.includes("..")) {
    throw new Error("Invalid client asset path.");
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

async function getRootEnvMap(): Promise<Record<string, string>> {
  if (!rootEnvCachePromise) {
    rootEnvCachePromise = readRootEnvMap();
  }

  return rootEnvCachePromise;
}

async function readServerEnv(key: string): Promise<string> {
  const directValue = process.env[key];
  if (typeof directValue === "string" && directValue.length > 0) {
    return directValue;
  }

  const rootEnvMap = await getRootEnvMap();
  return rootEnvMap[key] || "";
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function buildCookiePath(clientId: string): string {
  return `${ANALYTICS_BASE_PATH}/clients/${assertValidClientId(clientId)}`;
}

async function readClientRegistryFile(): Promise<unknown> {
  const raw = await readFile(CLIENT_INDEX_PATH, "utf8");
  return JSON.parse(raw);
}

function toClientRegistryEntry(value: unknown): ClientRegistryEntry {
  if (!isRecord(value)) {
    throw new Error("Client index entry must be an object.");
  }

  const clientId = assertValidClientId(String(value.clientId || ""));
  const title = String(value.title || "").trim();
  const coverImage = String(value.coverImage || "").trim();

  if (!title) {
    throw new Error(`Client "${clientId}" is missing a title in the index.`);
  }

  if (!coverImage) {
    throw new Error(`Client "${clientId}" is missing a coverImage in the index.`);
  }

  return {
    clientId,
    title,
    access: normalizeAccess(value.access),
    coverImage
  };
}

function toClientSlide(value: unknown, index: number): ClientSlide {
  if (!isRecord(value)) {
    throw new Error(`Slide ${index + 1} must be an object.`);
  }

  const title = String(value.title || "").trim();
  if (!title) {
    throw new Error(`Slide ${index + 1} is missing a title.`);
  }

  const bullets = Array.isArray(value.bullets)
    ? value.bullets.map((item) => String(item).trim()).filter(Boolean)
    : undefined;

  let image: ClientSlide["image"];
  if (isRecord(value.image)) {
    const asset = String(value.image.asset || "").trim();
    if (asset) {
      image = {
        asset,
        alt: String(value.image.alt || "").trim() || title,
        caption: String(value.image.caption || "").trim() || undefined
      };
    }
  }

  return {
    id: String(value.id || `slide-${index + 1}`),
    eyebrow: String(value.eyebrow || "").trim() || undefined,
    title,
    body: String(value.body || "").trim() || undefined,
    bullets: bullets && bullets.length > 0 ? bullets : undefined,
    image
  };
}

function toClientContent(value: unknown, registryEntry: ClientRegistryEntry): ClientContent {
  if (!isRecord(value)) {
    throw new Error(`Client "${registryEntry.clientId}" content must be an object.`);
  }

  const slidesSource = Array.isArray(value.slides) ? value.slides : [];

  if (slidesSource.length === 0) {
    throw new Error(`Client "${registryEntry.clientId}" content requires at least one slide.`);
  }

  const contentClientId = String(value.clientId || registryEntry.clientId).trim();
  if (contentClientId !== registryEntry.clientId) {
    throw new Error(
      `Client content mismatch. Expected "${registryEntry.clientId}", received "${contentClientId}".`
    );
  }

  const access = normalizeAccess(value.access ?? registryEntry.access);
  if (access !== registryEntry.access) {
    throw new Error(
      `Client access mismatch for "${registryEntry.clientId}". Keep index.json and content.json aligned.`
    );
  }

  return {
    ...registryEntry,
    summary: String(value.summary || "").trim() || undefined,
    updatedAt: String(value.updatedAt || "").trim() || undefined,
    slides: slidesSource.map(toClientSlide)
  };
}

async function getClientPassword(clientId: string): Promise<string> {
  return readServerEnv(toClientPasswordEnvKey(assertValidClientId(clientId)));
}

async function getCookieSecret(clientId: string, clientPassword: string): Promise<string> {
  const configuredSecret =
    (await readServerEnv("CLIENT_ACCESS_COOKIE_SECRET")) ||
    (await readServerEnv("SESSION_SECRET")) ||
    "client-access-cookie-secret";

  return `${configuredSecret}:${clientId}:${clientPassword}`;
}

async function createCookieSignature(
  clientId: string,
  payload: string,
  clientPassword: string
): Promise<string> {
  const secret = await getCookieSecret(clientId, clientPassword);
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

async function hasValidAccessCookie(clientId: string): Promise<boolean> {
  const clientPassword = await getClientPassword(clientId);
  if (!clientPassword) {
    return false;
  }

  const cookieValue = cookies().get(CLIENT_ACCESS_COOKIE_NAME)?.value;
  if (!cookieValue) {
    return false;
  }

  const separatorIndex = cookieValue.lastIndexOf(".");
  if (separatorIndex < 0) {
    return false;
  }

  const payload = cookieValue.slice(0, separatorIndex);
  const signature = cookieValue.slice(separatorIndex + 1);

  if (!payload.startsWith(`${clientId}:`)) {
    return false;
  }

  const expectedSignature = await createCookieSignature(clientId, payload, clientPassword);
  return safeCompare(signature, expectedSignature);
}

export async function getClientRegistry(): Promise<ClientRegistryEntry[]> {
  const parsed = await readClientRegistryFile();
  if (!Array.isArray(parsed)) {
    throw new Error("content/clients/index.json must contain an array.");
  }

  return parsed.map(toClientRegistryEntry);
}

export async function getClientMetadata(clientId: string): Promise<ClientRegistryEntry | null> {
  const normalizedClientId = assertValidClientId(clientId);
  const registry = await getClientRegistry();

  return registry.find((entry) => entry.clientId === normalizedClientId) || null;
}

export async function isClientPasswordConfigured(clientId: string): Promise<boolean> {
  return Boolean(await getClientPassword(clientId));
}

export async function verifySubmittedClientPassword(
  clientId: string,
  submittedPassword: string
): Promise<ClientPasswordVerificationResult> {
  const configuredPassword = await getClientPassword(clientId);
  if (!configuredPassword) {
    return "not-configured";
  }

  return safeCompare(submittedPassword, configuredPassword) ? "ok" : "invalid";
}

export async function createSignedClientAccessCookieValue(clientId: string): Promise<string> {
  const normalizedClientId = assertValidClientId(clientId);
  const configuredPassword = await getClientPassword(normalizedClientId);

  if (!configuredPassword) {
    throw new ClientAccessError(
      "password-not-configured",
      `Password env var ${toClientPasswordEnvKey(normalizedClientId)} is not configured.`
    );
  }

  const payload = `${normalizedClientId}:${Date.now()}`;
  const signature = await createCookieSignature(
    normalizedClientId,
    payload,
    configuredPassword
  );

  return `${payload}.${signature}`;
}

export function getClientAccessCookieOptions(clientId: string) {
  return {
    httpOnly: true,
    maxAge: CLIENT_ACCESS_COOKIE_MAX_AGE_SECONDS,
    path: buildCookiePath(clientId),
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export async function assertClientAccess(
  clientId: string,
  registryEntry?: ClientRegistryEntry
): Promise<true> {
  const entry = registryEntry || (await getClientMetadata(clientId));

  if (!entry) {
    throw new ClientAccessError("client-not-found", `Unknown client "${clientId}".`);
  }

  if (entry.access === "public") {
    return true;
  }

  const passwordConfigured = await isClientPasswordConfigured(entry.clientId);
  if (!passwordConfigured) {
    throw new ClientAccessError(
      "password-not-configured",
      `Password env var ${toClientPasswordEnvKey(entry.clientId)} is not configured.`
    );
  }

  const hasAccess = await hasValidAccessCookie(entry.clientId);
  if (!hasAccess) {
    throw new ClientAccessError(
      "unlock-required",
      `Client "${entry.clientId}" requires a valid access cookie.`
    );
  }

  return true;
}

export async function loadClientContent(clientId: string): Promise<ClientContent> {
  const registryEntry = await getClientMetadata(clientId);

  if (!registryEntry) {
    throw new ClientAccessError("client-not-found", `Unknown client "${clientId}".`);
  }

  const accessGranted = await assertClientAccess(registryEntry.clientId, registryEntry);
  if (accessGranted !== true) {
    throw new Error("Regression guard: client content cannot load before access passes.");
  }

  const contentPath = resolveInside(
    CLIENTS_ROOT,
    registryEntry.clientId,
    "content.json"
  );
  const raw = await readFile(contentPath, "utf8");
  const parsed = JSON.parse(raw);

  return toClientContent(parsed, registryEntry);
}

export function buildClientAppPath(clientId: string): string {
  return `/clients/${assertValidClientId(clientId)}`;
}

export function buildClientCoverHref(clientId: string, assetPath: string): string {
  const normalizedAssetPath = normalizeAssetPath(assetPath);
  return `${ANALYTICS_BASE_PATH}/clients/${assertValidClientId(clientId)}/cover/${normalizedAssetPath}`;
}

export function buildClientAssetHref(clientId: string, assetPath: string): string {
  const normalizedAssetPath = normalizeAssetPath(assetPath);
  return `${ANALYTICS_BASE_PATH}/clients/${assertValidClientId(clientId)}/assets/${normalizedAssetPath}`;
}

export function getRegistryCoverAssetPath(registryEntry: ClientRegistryEntry): string | null {
  const prefix = `${ANALYTICS_BASE_PATH}/clients/${registryEntry.clientId}/cover/`;

  try {
    const pathname = new URL(registryEntry.coverImage, "http://localhost").pathname;
    if (!pathname.startsWith(prefix)) {
      return null;
    }

    return pathname.slice(prefix.length).split("/").map(decodeURIComponent).join("/");
  } catch {
    return null;
  }
}

export async function readClientImageAsset(
  clientId: string,
  assetPath: string
): Promise<{ body: Buffer; contentType: string }> {
  const normalizedClientId = assertValidClientId(clientId);
  const normalizedAssetPath = normalizeAssetPath(assetPath);
  const filePath = resolveInside(
    CLIENTS_ROOT,
    normalizedClientId,
    "images",
    normalizedAssetPath
  );
  const body = await readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();

  const contentType =
    extension === ".svg"
      ? "image/svg+xml"
      : extension === ".png"
        ? "image/png"
        : extension === ".jpg" || extension === ".jpeg"
          ? "image/jpeg"
          : extension === ".webp"
            ? "image/webp"
            : extension === ".gif"
              ? "image/gif"
              : extension === ".avif"
                ? "image/avif"
                : "application/octet-stream";

  return {
    body,
    contentType
  };
}
