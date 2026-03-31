import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { hashSync } from "bcryptjs";
import crypto from "crypto";
import { users, inviteCodes, posts, atmosphericDetails, acknowledgments } from "./schema";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_URL || "./data/today.db";
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Remove existing DB for clean seed
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log("Removed existing database.");
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

// Run migrations
console.log("Running migrations...");
migrate(db, { migrationsFolder: path.resolve("drizzle") });
console.log("Migrations complete.");

// Seed users
const password = hashSync("password123", 12);

console.log("Seeding users...");

const seededUsers = db
  .insert(users)
  .values([
    {
      username: "magalhini",
      displayName: "Ricardo Magalhães",
      email: "magalhini@gmail.com",
      passwordHash: password,
      role: "admin",
      location: "Berlin, Germany",
      inviteCodesRemaining: 99,
    },
    {
      username: "lena_writes",
      displayName: "Lena Moreau",
      email: "lena@example.com",
      passwordHash: password,
      role: "member",
      location: "Montreal, Canada",
      inviteCodesRemaining: 3,
    },
    {
      username: "kai",
      displayName: "Kai Nakamura",
      email: "kai@example.com",
      passwordHash: password,
      role: "member",
      location: "Tokyo, Japan",
      inviteCodesRemaining: 3,
    },
  ])
  .returning()
  .all();

const adminId = seededUsers[0].id;

// Seed invite codes for admin — some available, one used by lena, one expired
console.log("Seeding invite codes...");

const thirtyDaysFromNow = new Date(
  Date.now() + 30 * 24 * 60 * 60 * 1000
).toISOString();
const thirtyDaysAgo = new Date(
  Date.now() - 30 * 24 * 60 * 60 * 1000
).toISOString();

db.insert(inviteCodes)
  .values([
    {
      code: crypto.randomBytes(6).toString("hex"),
      createdBy: adminId,
      expiresAt: thirtyDaysFromNow,
    },
    {
      code: crypto.randomBytes(6).toString("hex"),
      createdBy: adminId,
      expiresAt: thirtyDaysFromNow,
    },
    {
      code: "used-by-lena-00",
      createdBy: adminId,
      usedBy: seededUsers[1].id,
      usedAt: new Date().toISOString(),
      expiresAt: thirtyDaysFromNow,
    },
    {
      code: "expired-code-00",
      createdBy: adminId,
      expiresAt: thirtyDaysAgo,
    },
  ])
  .run();

// Give lena some codes too
db.insert(inviteCodes)
  .values([
    {
      code: crypto.randomBytes(6).toString("hex"),
      createdBy: seededUsers[1].id,
      expiresAt: thirtyDaysFromNow,
    },
  ])
  .run();

// Seed sample posts
console.log("Seeding posts...");

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

const seededPosts = db.insert(posts)
  .values([
    {
      authorId: seededUsers[1].id,
      title: "The café on Saint-Laurent",
      body: `<p>There is a café on Saint-Laurent where the chairs face the window and nobody talks. I sat there for an hour this morning watching the snow gather on the sill. The barista knows my order. She doesn\u2019t ask anymore.</p><p>I think about how many mornings I have left like this one — quiet, unremarkable, <em>perfect</em>. The kind you forget until years later when you\u2019d give anything to sit in that chair again.</p><blockquote><p>The coffee was too hot. I burned my tongue. I didn\u2019t mind.</p></blockquote>`,
      wordCount: 85,
      status: "published",
      draftStartedAt: daysAgo(2),
      publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      locationName: "Montreal, Canada",
    },
    {
      authorId: seededUsers[2].id,
      title: "Trains at dusk",
      body: `<p>The Chūō Line at dusk is a painting that moves. Everything outside turns amber. Inside, everyone is looking at their phones except me and one old man across the aisle. We make eye contact briefly. He nods.</p><p>I wonder if he also feels it — this strange gratitude for being carried somewhere at exactly the right speed, not too fast, not too slow, while the sky does what it does every evening without anyone asking it to.</p><p><strong>I get off one stop early just to walk.</strong></p>`,
      wordCount: 89,
      status: "published",
      draftStartedAt: daysAgo(1),
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      locationName: "Tokyo, Japan",
    },
    {
      authorId: seededUsers[0].id,
      title: "On silence in the Tiergarten",
      body: `<p>Berlin is loud in a way that makes silence feel earned. I walked through the Tiergarten this afternoon after the rain stopped. The leaves were still dripping. No one was on the path.</p><p>I stood at the edge of the pond and listened to <em>absolutely nothing</em> for what felt like five minutes. It was probably thirty seconds. Time does that when you\u2019re alone and paying attention.</p><p>I should do this more often. I never do.</p>`,
      wordCount: 76,
      status: "published",
      draftStartedAt: daysAgo(0),
      publishedAt: new Date().toISOString(),
      locationName: "Berlin, Germany",
    },
  ])
  .returning()
  .all();

// Seed atmospheric details
console.log("Seeding atmospheric details...");

db.insert(atmosphericDetails)
  .values([
    {
      postId: seededPosts[0].id,
      type: "weather_condition",
      value: "Snow: light snow",
      displayText: "The snow was falling quietly in Montreal, Canada",
    },
    {
      postId: seededPosts[0].id,
      type: "moon_phase",
      value: "waxing crescent",
      displayText: "Under a waxing crescent",
    },
    {
      postId: seededPosts[1].id,
      type: "golden_blue_hour",
      value: "golden hour (evening)",
      displayText: "Written during the golden hour",
    },
    {
      postId: seededPosts[1].id,
      type: "temperature",
      value: "16°C",
      displayText: "A mild 16°",
    },
    {
      postId: seededPosts[1].id,
      type: "poetic_season",
      value: "early spring",
      displayText: "It was early spring",
    },
    {
      postId: seededPosts[2].id,
      type: "weather_condition",
      value: "Rain: light rain",
      displayText: "A light rain was falling outside in Berlin, Germany",
    },
    {
      postId: seededPosts[2].id,
      type: "time_of_day",
      value: "afternoon",
      displayText: "The afternoon was creamy",
    },
  ])
  .run();

// Seed acknowledgments
console.log("Seeding acknowledgments...");

db.insert(acknowledgments)
  .values([
    // Lena's café post: acknowledged by Ricardo and Kai
    { postId: seededPosts[0].id, userId: seededUsers[0].id },
    { postId: seededPosts[0].id, userId: seededUsers[2].id },
    // Kai's trains post: acknowledged by Lena
    { postId: seededPosts[1].id, userId: seededUsers[1].id },
    // Ricardo's Tiergarten post: acknowledged by Lena and Kai
    { postId: seededPosts[2].id, userId: seededUsers[1].id },
    { postId: seededPosts[2].id, userId: seededUsers[2].id },
  ])
  .run();

console.log("Seed complete!");
console.log("");
console.log("Users created:");
console.log("  magalhini@gmail.com  (admin)  password: password123");
console.log("  lena@example.com     (member) password: password123");
console.log("  kai@example.com      (member) password: password123");
console.log("");
console.log("Invite codes: 2 available (admin), 1 used, 1 expired, 1 available (lena)");
console.log("Posts: 3 published (one per user)");

sqlite.close();
