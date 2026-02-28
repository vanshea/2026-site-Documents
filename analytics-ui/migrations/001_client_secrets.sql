CREATE TABLE IF NOT EXISTS client_secrets (
  clientId TEXT PRIMARY KEY,
  passwordHash TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
