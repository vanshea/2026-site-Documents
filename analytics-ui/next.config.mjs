import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function readRootEnvValue(key) {
  const directValue = process.env[key];
  if (directValue) {
    return directValue;
  }

  try {
    const envPath = path.join(currentDir, "..", ".env");
    const raw = fs.readFileSync(envPath, "utf8");

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const entryKey = trimmed.slice(0, separatorIndex).trim();
      if (entryKey !== key) {
        continue;
      }

      let entryValue = trimmed.slice(separatorIndex + 1).trim();
      if (
        (entryValue.startsWith('"') && entryValue.endsWith('"')) ||
        (entryValue.startsWith("'") && entryValue.endsWith("'"))
      ) {
        entryValue = entryValue.slice(1, -1);
      }

      return entryValue;
    }
  } catch (_error) {
    // Ignore missing root env files during clean CI builds.
  }

  return "";
}

function readTrustedServerActionHosts() {
  const hosts = new Set(["localhost:3000", "127.0.0.1:3000"]);
  const configuredOrigins = String(readRootEnvValue("TRUSTED_WEB_ORIGINS"))
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  for (const origin of configuredOrigins) {
    try {
      hosts.add(new URL(origin).host);
    } catch (_error) {
      // Ignore malformed values so one typo does not break the whole build.
    }
  }

  return Array.from(hosts);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/analytics",
  experimental: {
    typedRoutes: false,
    externalDir: true,
    outputFileTracingRoot: path.join(currentDir, ".."),
    serverActions: {
      allowedOrigins: readTrustedServerActionHosts()
    }
  }
};

export default nextConfig;
