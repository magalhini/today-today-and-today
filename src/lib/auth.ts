import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashSync, compareSync } from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "session_id";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashPassword(password: string): string {
  return hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  db.insert(sessions).values({ id: sessionId, userId, expiresAt }).run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return sessionId;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();

  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
    return null;
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  if (!user) return null;

  return { session, user };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
    cookieStore.delete(SESSION_COOKIE);
  }
}
