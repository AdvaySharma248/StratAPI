import "server-only";

import type { NextRequest, NextResponse } from "next/server";
import { authCookieName, fallbackNameForEmail, type User, type UserRole } from "@/lib/auth-model";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

// ---------------------------------------------------------------------------
// Session cookie format
// We store a lightweight JSON payload as an HttpOnly cookie.
// The session is validated server-side by verifying the Firebase ID token
// embedded in the payload.
// ---------------------------------------------------------------------------

type SessionPayload = {
  firebaseUid: string;
  firebaseIdToken: string;      // raw Firebase ID token for re-verification
  email: string;
  username: string;
  name: string;
  company?: string;
  timezone?: string;
  role: UserRole;
  backendAccessToken?: string;
  backendRefreshToken?: string;
  backendUserId?: string;
  exp: number;                  // unix seconds
};

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type BackendAuthSession = {
  accessToken: string;
  refreshToken?: string;
  user?: {
    id?: string;
  };
};

// ---------------------------------------------------------------------------
// Password hashing (still used for the local SQLite shadow record)
// ---------------------------------------------------------------------------
import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) return false;
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (derivedKey.length !== storedBuffer.length) return false;
  return timingSafeEqual(derivedKey, storedBuffer);
}

// ---------------------------------------------------------------------------
// Public user helper
// ---------------------------------------------------------------------------
export function toPublicUser(user: {
  id: string;
  email: string;
  username?: string | null;
  name: string | null;
  company?: string | null;
  timezone?: string | null;
  role: UserRole;
}): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username ?? "",
    name: user.name?.trim() || fallbackNameForEmail(user.email),
    company: user.company?.trim() || "",
    timezone: user.timezone?.trim() || "UTC",
    role: user.role,
  };
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------
function cookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function buildSessionPayload(
  user: User,
  firebaseIdToken: string,
  backendSession?: BackendAuthSession
): SessionPayload {
  return {
    firebaseUid: user.id,
    firebaseIdToken,
    email: user.email,
    username: user.username ?? "",
    name: user.name,
    company: user.company,
    timezone: user.timezone,
    role: user.role,
    backendAccessToken: backendSession?.accessToken,
    backendRefreshToken: backendSession?.refreshToken,
    backendUserId: backendSession?.user?.id,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
}

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeSession(encoded: string): SessionPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API used by Next.js route handlers
// ---------------------------------------------------------------------------

/**
 * Set the StratAPI session cookie after a successful Firebase sign-in.
 * `firebaseIdToken` is the raw Firebase ID token from the client.
 */
export function setSessionCookie(
  response: NextResponse,
  user: User,
  firebaseIdToken: string,
  backendSession?: BackendAuthSession
) {
  const payload = buildSessionPayload(user, firebaseIdToken, backendSession);
  response.cookies.set(authCookieName, encodeSession(payload), cookieOptions());
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(authCookieName, "", cookieOptions(0));
}

function getSessionPayloadFromRequest(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(authCookieName)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export function getSessionUserFromRequest(request: NextRequest): User | null {
  const payload = getSessionPayloadFromRequest(request);
  if (!payload) return null;
  return {
    id: payload.firebaseUid,
    email: payload.email,
    username: payload.username ?? "",
    name: payload.name,
    company: payload.company?.trim() || "",
    timezone: payload.timezone?.trim() || "UTC",
    role: payload.role,
  };
}

export function getBackendAccessTokenFromRequest(request: NextRequest) {
  return getSessionPayloadFromRequest(request)?.backendAccessToken ?? null;
}

export function getBackendAuthSessionFromRequest(
  request: NextRequest
): BackendAuthSession | undefined {
  const payload = getSessionPayloadFromRequest(request);
  if (!payload?.backendAccessToken) return undefined;
  return {
    accessToken: payload.backendAccessToken,
    refreshToken: payload.backendRefreshToken,
    user: payload.backendUserId ? { id: payload.backendUserId } : undefined,
  };
}

/**
 * Re-verify the stored Firebase ID token.
 * Returns the decoded token or null if invalid/expired.
 * Used by the /api/auth/me route to strongly validate the session.
 */
export async function verifySessionToken(
  request: NextRequest
): Promise<import("firebase-admin").auth.DecodedIdToken | null> {
  const payload = getSessionPayloadFromRequest(request);
  if (!payload?.firebaseIdToken) return null;
  try {
    return await verifyFirebaseToken(payload.firebaseIdToken);
  } catch {
    return null;
  }
}

/**
 * Get the raw Firebase ID token from the session (used to refresh the
 * backend token or call Firebase-authenticated endpoints).
 */
export function getFirebaseIdTokenFromRequest(request: NextRequest): string | null {
  return getSessionPayloadFromRequest(request)?.firebaseIdToken ?? null;
}
