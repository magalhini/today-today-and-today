import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  location: text("location"),
  role: text("role", { enum: ["admin", "member"] })
    .notNull()
    .default("member"),
  inviteCodesRemaining: integer("invite_codes_remaining").notNull().default(3),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const inviteCodes = sqliteTable("invite_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  usedBy: integer("used_by").references(() => users.id),
  usedAt: text("used_at"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  bodyFormat: text("body_format", { enum: ["richtext", "markdown"] })
    .notNull()
    .default("richtext"),
  coverImagePath: text("cover_image_path"),
  locationName: text("location_name"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  wordCount: integer("word_count").notNull().default(0),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  draftStartedAt: text("draft_started_at").notNull(),
  publishedAt: text("published_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const atmosphericDetails = sqliteTable("atmospheric_details", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: [
      "moon_phase",
      "golden_blue_hour",
      "sunset_offset",
      "poetic_season",
      "time_of_day",
      "weather_condition",
      "temperature",
    ],
  }).notNull(),
  value: text("value").notNull(),
  displayText: text("display_text").notNull(),
});

export const acknowledgments = sqliteTable("acknowledgments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type InviteCode = typeof inviteCodes.$inferSelect;
