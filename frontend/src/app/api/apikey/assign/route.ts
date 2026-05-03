import { NextRequest, NextResponse } from "next/server";
import { getBackendAccessTokenFromRequest, getSessionUserFromRequest } from "@/lib/auth-server";
import { proxyBackendRequest } from "@/lib/backend-api";
import { db } from "@/lib/db";

// POST /api/apikey/assign
// Body: { apiKeyId, username }
// Owner assigns an API key to a consumer by their StratAPI username.
export async function POST(request: NextRequest) {
  const sessionUser = getSessionUserFromRequest(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (sessionUser.role !== "owner" && sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Only API owners can assign keys." }, { status: 403 });
  }

  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Backend session missing. Please sign in again." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.apiKeyId || !body.username) {
    return NextResponse.json({ error: "apiKeyId and username are required." }, { status: 400 });
  }

  const username = (body.username as string).trim().toLowerCase();

  // Resolve the consumer record from the local SQLite DB by username.
  // This lets us pass the email as a fallback identifier to the backend,
  // bridging any username mismatch between SQLite and MongoDB.
  const consumer = await db.user.findUnique({
    where: { username },
    select: { email: true, role: true },
  });

  if (!consumer) {
    return NextResponse.json(
      { error: `No user found with username "@${username}". Make sure they have a StratAPI account.` },
      { status: 404 }
    );
  }

  if (consumer.role !== "consumer") {
    return NextResponse.json(
      { error: `User "@${username}" is not a consumer. Only consumers can be assigned API keys.` },
      { status: 400 }
    );
  }

  return proxyBackendRequest("/api/v1/apikey/assign", accessToken, {
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify({
      apiKeyId: body.apiKeyId,
      username,
      email: consumer.email,   // fallback for existing accounts with mismatched MongoDB username
    }),
  });
}
