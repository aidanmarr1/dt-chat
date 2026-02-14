import { client } from "./db";

let initialized = false;

export async function ensurePollTables() {
  if (initialized) return;

  await client.execute(`
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL,
      message_id TEXT REFERENCES messages(id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS pollVotes (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id),
      option_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL
    )
  `);

  initialized = true;
}

let statusInitialized = false;

export async function ensureStatusColumn() {
  if (statusInitialized) return;
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN status TEXT`);
  } catch {
    // Column already exists
  }
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN status_set_at INTEGER`);
  } catch {
    // Column already exists
  }
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN status_expires_at INTEGER`);
  } catch {
    // Column already exists
  }
  statusInitialized = true;
}

let todoInitialized = false;

export async function ensureTodoTable() {
  if (todoInitialized) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_by TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      position INTEGER NOT NULL DEFAULT 0
    )
  `);
  todoInitialized = true;
}
