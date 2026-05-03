import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const sessionUser = getSessionUserFromRequest(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const rows = await db.$queryRaw<
      Array<{
        id: string;
        email: string;
        name: string | null;
        role: string;
        createdAt: string;
      }>
    >`SELECT id, email, name, role, createdAt FROM "User" ORDER BY createdAt DESC`;

    const users = rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name ?? u.email.split("@")[0],
      role: u.role,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error("Failed to fetch admin users list", error);
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 });
  }
}
