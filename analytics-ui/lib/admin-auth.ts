import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ANALYTICS_BASE_PATH } from "@/lib/client-content";
import { readServerEnv, safeCompare } from "@/lib/server-runtime";

export const ADMIN_SESSION_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const ADMIN_PASSWORD = "1013VS1#";

export class AdminSessionError extends Error {
  constructor(message = "Admin authentication required.") {
    super(message);
    this.name = "AdminSessionError";
  }
}

async function getAdminSessionSecret(): Promise<string> {
  const configuredSecret =
    (await readServerEnv("ADMIN_SESSION_COOKIE_SECRET")) ||
    (await readServerEnv("SESSION_SECRET")) ||
    (await readServerEnv("CLIENT_ACCESS_COOKIE_SECRET")) ||
    "admin-session-cookie-secret";

  return `${configuredSecret}:${ADMIN_PASSWORD}`;
}

async function signPayload(payload: string): Promise<string> {
  const secret = await getAdminSessionSecret();
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: `${ANALYTICS_BASE_PATH}/home`,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export async function verifyAdminPassword(submittedPassword: string): Promise<boolean> {
  return safeCompare(submittedPassword, ADMIN_PASSWORD);
}

export async function createSignedAdminSessionCookieValue(): Promise<string> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${issuedAt}:${expiresAt}:${randomBytes(16).toString("base64url")}`;
  const signature = await signPayload(payload);

  return `${payload}.${signature}`;
}

export async function hasValidAdminSession(): Promise<boolean> {
  const cookieValue = cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) {
    return false;
  }

  const separatorIndex = cookieValue.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return false;
  }

  const payload = cookieValue.slice(0, separatorIndex);
  const signature = cookieValue.slice(separatorIndex + 1);
  const expectedSignature = await signPayload(payload);

  if (!safeCompare(signature, expectedSignature)) {
    return false;
  }

  const payloadParts = payload.split(":");
  if (payloadParts.length < 3) {
    return false;
  }

  const expiresAt = Number(payloadParts[1]);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    return false;
  }

  return true;
}

export async function assertAdminSession(): Promise<true> {
  const valid = await hasValidAdminSession();
  if (!valid) {
    throw new AdminSessionError();
  }

  return true;
}

export async function requireAdminSessionOrRedirect() {
  const valid = await hasValidAdminSession();
  if (!valid) {
    redirect("/home/login");
  }
}
