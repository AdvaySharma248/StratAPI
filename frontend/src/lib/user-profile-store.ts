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

function isUserRole(value: string): value is UserRole {
  return userRoles.includes(value as UserRole);
}

function normalizeLocalUser(user: any): User {
  return toPublicUser({
    ...user,
    role: isUserRole(user.role) ? user.role : "owner",
  });
}

export async function findLocalUserProfileById(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    return user ? normalizeLocalUser(user) : null;
  } catch {
    return null;
  }
}

export async function findLocalUserProfileByEmail(email: string) {
  try {
    const user = await db.user.findUnique({
      where: { email }
    });
    return user ? normalizeLocalUser(user) : null;
  } catch {
    return null;
  }
}

export async function updateLocalUserProfile(userId: string, profile: ProfileUpdateInput) {
  const emailOwner = await findLocalUserProfileByEmail(profile.email);

  if (emailOwner && emailOwner.id !== userId) {
    throw new Error("An account with this email already exists.");
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      name: profile.name,
      email: profile.email,
      company: profile.company || null,
      timezone: profile.timezone,
    }
  });

  return normalizeLocalUser(updatedUser);
}
