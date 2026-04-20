import "server-only";

import * as crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { DATA_ROOT, readServerEnv, readServerEnvSync, safeCompare } from "@/lib/server-runtime";

const configuredDatabasePath = readServerEnvSync("CLIENT_SECRETS_DB_PATH");
const DATABASE_PATH = configuredDatabasePath
  ? path.resolve(configuredDatabasePath)
  : path.join(DATA_ROOT, "client-secrets.sqlite");
const MIGRATIONS_PATH = path.join(process.cwd(), "migrations");
const ARGON2_MEMORY = 65536;
const ARGON2_PASSES = 3;
const ARGON2_PARALLELISM = 4;
const ARGON2_TAG_LENGTH = 32;

const argon2Sync = (
  crypto as typeof crypto & {
    argon2Sync: (
      algorithm: "argon2id",
      parameters: {
        message: Buffer;
        nonce: Buffer;
        parallelism: number;
        tagLength: number;
        memory: number;
        passes: number;
        secret?: Buffer;
      }
    ) => Buffer;
  }
).argon2Sync;

type ClientSecretRow = {
  clientId: string;
  passwordHash: string;
  updatedAt: string;
};

export type ClientPasswordStatus = {
  clientId: string;
  hasPassword: boolean;
  updatedAt: string | null;
};

let database: DatabaseSync | null = null;
let migrationsApplied = false;

function getDatabase(): DatabaseSync {
  if (!database) {
    fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
    database = new DatabaseSync(DATABASE_PATH);
  }

  if (!migrationsApplied) {
    runMigrations(database);
    migrationsApplied = true;
  }

  return database;
}

function runMigrations(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      appliedAt TEXT NOT NULL
    )
  `);

  const migrationFiles = fs
    .readdirSync(MIGRATIONS_PATH, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const appliedNames = new Set(
    db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((row) => String((row as { name: string }).name))
  );

  const insertMigration = db.prepare(
    "INSERT INTO schema_migrations (name, appliedAt) VALUES (?, ?)"
  );

  for (const migrationName of migrationFiles) {
    if (appliedNames.has(migrationName)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_PATH, migrationName), "utf8");
    db.exec(sql);
    insertMigration.run(migrationName, new Date().toISOString());
  }
}

function toEncodedHash(salt: Buffer, derivedKey: Buffer): string {
  return [
    "argon2id",
    `m=${ARGON2_MEMORY},t=${ARGON2_PASSES},p=${ARGON2_PARALLELISM},l=${ARGON2_TAG_LENGTH}`,
    salt.toString("base64url"),
    derivedKey.toString("base64url")
  ].join("$");
}

function parseEncodedHash(passwordHash: string) {
  const [algorithm, params, salt, digest] = String(passwordHash || "").split("$");
  if (algorithm !== "argon2id" || !params || !salt || !digest) {
    throw new Error("Unsupported password hash format.");
  }

  const parsedParams = Object.fromEntries(
    params.split(",").map((pair) => {
      const [key, value] = pair.split("=");
      return [key, Number(value)];
    })
  );

  return {
    algorithm,
    memory: Number(parsedParams.m),
    passes: Number(parsedParams.t),
    parallelism: Number(parsedParams.p),
    salt: Buffer.from(salt, "base64url"),
    tagLength: Number(parsedParams.l),
    digest: Buffer.from(digest, "base64url")
  };
}

async function getPasswordPepper(): Promise<Buffer | undefined> {
  const configuredPepper =
    (await readServerEnv("CLIENT_PASSWORD_PEPPER")) ||
    (await readServerEnv("SESSION_SECRET"));

  return configuredPepper ? Buffer.from(configuredPepper) : undefined;
}

async function hashPassword(plainPassword: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const pepper = await getPasswordPepper();
  const derivedKey = argon2Sync("argon2id", {
    message: Buffer.from(plainPassword),
    nonce: salt,
    parallelism: ARGON2_PARALLELISM,
    tagLength: ARGON2_TAG_LENGTH,
    memory: ARGON2_MEMORY,
    passes: ARGON2_PASSES,
    secret: pepper
  });

  return toEncodedHash(salt, Buffer.from(derivedKey));
}

async function verifyPasswordAgainstHash(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  const pepper = await getPasswordPepper();
  const parsed = parseEncodedHash(passwordHash);
  const derivedKey = argon2Sync(parsed.algorithm as "argon2id", {
    message: Buffer.from(plainPassword),
    nonce: parsed.salt,
    parallelism: parsed.parallelism,
    tagLength: parsed.tagLength,
    memory: parsed.memory,
    passes: parsed.passes,
    secret: pepper
  });

  return safeCompare(Buffer.from(derivedKey), parsed.digest);
}

function getClientSecretRow(clientId: string): ClientSecretRow | null {
  const db = getDatabase();
  const row = db
    .prepare(
      "SELECT clientId, passwordHash, updatedAt FROM client_secrets WHERE clientId = ? LIMIT 1"
    )
    .get(clientId) as ClientSecretRow | undefined;

  return row || null;
}

export async function setClientPassword(clientId: string, plainPassword: string) {
  if (!plainPassword) {
    throw new Error("Password cannot be empty.");
  }

  const db = getDatabase();
  const updatedAt = new Date().toISOString();
  const passwordHash = await hashPassword(plainPassword);

  db.prepare(
    `
      INSERT INTO client_secrets (clientId, passwordHash, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(clientId) DO UPDATE SET
        passwordHash = excluded.passwordHash,
        updatedAt = excluded.updatedAt
    `
  ).run(clientId, passwordHash, updatedAt);

  return {
    clientId,
    updatedAt
  };
}

export async function hasClientPassword(clientId: string): Promise<boolean> {
  return Boolean(getClientSecretRow(clientId)?.passwordHash);
}

export async function verifyClientPassword(clientId: string, plainPassword: string) {
  const row = getClientSecretRow(clientId);
  if (!row) {
    return "not-configured" as const;
  }

  const matches = await verifyPasswordAgainstHash(plainPassword, row.passwordHash);
  return matches ? ("ok" as const) : ("invalid" as const);
}

export async function getClientPasswordHash(clientId: string): Promise<string | null> {
  return getClientSecretRow(clientId)?.passwordHash || null;
}

export async function getClientPasswordStatus(clientId: string): Promise<ClientPasswordStatus> {
  const row = getClientSecretRow(clientId);

  return {
    clientId,
    hasPassword: Boolean(row),
    updatedAt: row?.updatedAt || null
  };
}

export async function loadClientPasswordStatuses(
  clientIds: string[]
): Promise<Record<string, ClientPasswordStatus>> {
  const db = getDatabase();
  const rows = db
    .prepare("SELECT clientId, updatedAt FROM client_secrets")
    .all() as Array<{ clientId: string; updatedAt: string }>;

  const statusMap: Record<string, ClientPasswordStatus> = Object.fromEntries(
    clientIds.map((clientId) => [
      clientId,
      {
        clientId,
        hasPassword: false,
        updatedAt: null
      }
    ])
  );

  for (const row of rows) {
    if (!(row.clientId in statusMap)) {
      continue;
    }

    statusMap[row.clientId] = {
      clientId: row.clientId,
      hasPassword: true,
      updatedAt: row.updatedAt
    };
  }

  return statusMap;
}
