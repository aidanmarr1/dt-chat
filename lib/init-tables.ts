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
