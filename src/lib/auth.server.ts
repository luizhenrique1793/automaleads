import { useSession } from "@tanstack/react-start/server";
import { db } from "./db.server";
import type { User } from "./types";

const ITERATIONS = 100_000;

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(password, salt);
  return `pbkdf2$${ITERATIONS}$${toHex(salt.buffer as ArrayBuffer)}$${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const salt = fromHex(parts[2]!);
  const bits = await derive(password, salt);
  return toHex(bits) === parts[3];
}

interface SessionData {
  userId?: string;
}

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("SESSION_SECRET não configurado");
  return {
    password,
    name: "automa_session",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function setSessionUser(userId: string) {
  const session = await useSession<SessionData>(sessionConfig());
  await session.update({ userId });
}

export async function clearSessionUser() {
  const session = await useSession<SessionData>(sessionConfig());
  await session.clear();
}

export async function getSessionUser(): Promise<User | null> {
  let userId: string | undefined;
  try {
    const session = await useSession<SessionData>(sessionConfig());
    userId = session.data?.userId;
  } catch {
    return null;
  }
  if (!userId) return null;
  const sql = await db();
  const rows = await sql<User[]>`
    SELECT id, name, email, global_role, active FROM users WHERE id = ${userId} AND active = true
  `;
  return rows[0] ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("NAO_AUTENTICADO");
  return user;
}
