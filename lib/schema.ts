import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }),
  typingAt: integer("typing_at"),
  avatarId: text("avatar_id"),
  bio: text("bio"),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  filePath: text("file_path"),
  replyToId: text("reply_to_id"),
  editedAt: integer("edited_at", { mode: "timestamp" }),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  pinnedAt: integer("pinned_at", { mode: "timestamp" }),
  pinnedBy: text("pinned_by"),
});

export const reactions = sqliteTable("reactions", {
  id: text("id").primaryKey(),
  messageId: text("message_id")
    .notNull()
    .references(() => messages.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  emoji: text("emoji").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const linkPreviews = sqliteTable("linkPreviews", {
  id: text("id").primaryKey(),
  messageId: text("message_id")
    .notNull()
    .references(() => messages.id),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url"),
  siteName: text("site_name"),
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
});

export const readReceipts = sqliteTable("readReceipts", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  lastReadMessageId: text("last_read_message_id")
    .notNull()
    .references(() => messages.id),
  readAt: integer("read_at", { mode: "timestamp" }).notNull(),
});

export const polls = sqliteTable("polls", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON array of {id, text}
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  messageId: text("message_id").references(() => messages.id),
});

export const pollVotes = sqliteTable("pollVotes", {
  id: text("id").primaryKey(),
  pollId: text("poll_id")
    .notNull()
    .references(() => polls.id),
  optionId: text("option_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
