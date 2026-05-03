import "server-only";

import { db } from "@/lib/db";
import { toPublicUser } from "@/lib/auth-server";
import { userRoles, type User, type UserRole } from "@/lib/auth-model";

type LocalUserProfileRow = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  company: string | null;
  timezone: string | null;
  role: string;
};

export type ProfileUpdateInput = {
  name: string;
  email: string;
  company: string;
  timezone: string;
};

let profileColumnsReady = false;

function isUserRole(value: string): value is UserRole {
  return userRoles.includes(value as UserRole);
}

function normalizeLocalUser(row: LocalUserProfileRow): User {
  return toPublicUser({
    ...row,
    role: isUserRole(row.role) ? row.role : "owner",
  });
}

/**
 * Ensures the User table exists and has all expected columns.
 * Safe to call repeatedly — skips work once columns are confirmed.
 */
export async function ensureLocalUserProfileColumns() {
  if (profileColumnsReady) {
    return;
  }

  // First check that the User table itself exists
  const tables = await db.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type='table' AND name='User'
  `;

  if (tables.length === 0) {
    // Table doesn't exist yet — Prisma will create it via db push / migrate.
    // Don't crash; the caller will get null from the query and handle it.
    return;
  }

  const columns = await db.$queryRaw<Array<{ name: string }>>`PRAGMA table_info("User")`;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("company")) {
    await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "company" TEXT');
  }

  if (!columnNames.has("timezone")) {
    await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "timezone" TEXT DEFAULT \'UTC\'');
  }

  if (!columnNames.has("username")) {
    await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "username" TEXT');
  }

  profileColumnsReady = true;
}

export async function findLocalUserProfileById(userId: string) {
  await ensureLocalUserProfileColumns();

  try {
    const rows = await db.$queryRaw<LocalUserProfileRow[]>`
      SELECT id, email, username, name, company, timezone, role
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `;
    return rows[0] ? normalizeLocalUser(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function findLocalUserProfileByEmail(email: string) {
  await ensureLocalUserProfileColumns();

  try {
    const rows = await db.$queryRaw<LocalUserProfileRow[]>`
      SELECT id, email, username, name, company, timezone, role
      FROM "User"
      WHERE email = ${email}
      LIMIT 1
    `;
    return rows[0] ? normalizeLocalUser(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function updateLocalUserProfile(userId: string, profile: ProfileUpdateInput) {
  await ensureLocalUserProfileColumns();

  const emailOwner = await findLocalUserProfileByEmail(profile.email);

  if (emailOwner && emailOwner.id !== userId) {
    throw new Error("An account with this email already exists.");
  }

  await db.$executeRaw`
    UPDATE "User"
    SET
      name = ${profile.name},
      email = ${profile.email},
      company = ${profile.company || null},
      timezone = ${profile.timezone},
      updatedAt = ${new Date().toISOString()}
    WHERE id = ${userId}
  `;

  return findLocalUserProfileById(userId);
}
