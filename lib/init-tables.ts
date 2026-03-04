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

let settingsInitialized = false;

export async function ensureSettingsColumn() {
  if (settingsInitialized) return;
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN settings TEXT`);
  } catch {
    // Column already exists
  }
  settingsInitialized = true;
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

let bookmarkInitialized = false;

export async function ensureBookmarkTable() {
  if (bookmarkInitialized) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      message_id TEXT NOT NULL REFERENCES messages(id),
      content TEXT,
      display_name TEXT,
      created_at TEXT,
      file_name TEXT,
      bookmarked_at INTEGER NOT NULL
    )
  `);
  bookmarkInitialized = true;
}

let reminderInitialized = false;

export async function ensureReminderTable() {
  if (reminderInitialized) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      message_id TEXT NOT NULL REFERENCES messages(id),
      message_preview TEXT,
      reminder_time INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  reminderInitialized = true;
}

let linkPreviewInitialized = false;

export async function ensureLinkPreviewTable() {
  if (linkPreviewInitialized) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS linkPreviews (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id),
      url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      image_url TEXT,
      site_name TEXT,
      fetched_at INTEGER NOT NULL
    )
  `);
  linkPreviewInitialized = true;
}
