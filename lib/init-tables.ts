import { client } from "./db";

// Single initialization promise — all tables/columns are ensured once, atomically
let initPromise: Promise<void> | null = null;

async function runAllMigrations() {
  // Tables
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

  // Indexes — idempotent, cheap if they already exist
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_link_previews_message_id ON linkPreviews(message_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON pollVotes(poll_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id)`);

  // Columns (ALTER TABLE fails if column exists, which is fine)
  const alterStatements = [
    `ALTER TABLE users ADD COLUMN status TEXT`,
    `ALTER TABLE users ADD COLUMN status_set_at INTEGER`,
    `ALTER TABLE users ADD COLUMN status_expires_at INTEGER`,
    `ALTER TABLE users ADD COLUMN settings TEXT`,
    `ALTER TABLE messages ADD COLUMN pin_label TEXT`,
  ];
  for (const stmt of alterStatements) {
    try { await client.execute(stmt); } catch { /* column already exists */ }
  }
}

/** Single entry point — ensures all tables and columns exist. Safe to call from any route. */
export function ensureAllTables(): Promise<void> {
  if (!initPromise) {
    initPromise = runAllMigrations().catch((err) => {
      // Reset so next request retries instead of caching the failure
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

// Legacy named exports — all delegate to the single init for backwards compat
export const ensurePollTables = ensureAllTables;
export const ensureStatusColumn = ensureAllTables;
export const ensureSettingsColumn = ensureAllTables;
export const ensureTodoTable = ensureAllTables;
export const ensureBookmarkTable = ensureAllTables;
export const ensureReminderTable = ensureAllTables;
export const ensurePinLabelColumn = ensureAllTables;
export const ensureLinkPreviewTable = ensureAllTables;
