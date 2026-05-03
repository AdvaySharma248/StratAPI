import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { roleLabels, userRoles } from "@/lib/auth-model";
import { hashPassword, setSessionCookie, toPublicUser } from "@/lib/auth-server";
import { authenticateBackendUser } from "@/lib/backend-api";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

const registerSchema = z.object({
  idToken: z.string().min(1, "Firebase ID token is required."),
  name: z.string().trim().min(2, "Please enter your full name.").max(80, "Name is too long."),
  email: z.string().trim().email("Enter a valid email address.").max(120),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
  role: z.enum(userRoles),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username is too long.")
    .regex(/^[a-z0-9_]+$/, "Username may only contain letters, numbers, and underscores.")
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsedBody = registerSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Invalid registration details." },
        { status: 400 }
      );
    }

    const { idToken, email: rawEmail, password, role, name, username: rawUsername } = parsedBody.data;
    const email = rawEmail.trim().toLowerCase();

    // 1. Verify the Firebase ID token
    let firebaseUid: string;
    try {
      const decoded = await verifyFirebaseToken(idToken);
      firebaseUid = decoded.uid;

      if (decoded.email?.toLowerCase() !== email) {
        return NextResponse.json({ error: "Token email mismatch." }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Firebase token verification failed." }, { status: 401 });
    }

    // 2. Check email uniqueness in local DB
    const existingEmail = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // 3. Derive / validate username
    const derivedUsername =
      (rawUsername ??
        email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .slice(0, 32)
          .replace(/^_+|_+$/g, "")) || "user";

    let finalUsername = derivedUsername.length >= 3 ? derivedUsername : derivedUsername.padEnd(3, "0");

    // Check username uniqueness
    const existingUsername = await db.user.findUnique({
      where: { username: finalUsername },
      select: { id: true },
    });

    if (existingUsername) {
      finalUsername = `${finalUsername}${Math.floor(Math.random() * 9000) + 1000}`.slice(0, 32);
    }

    // 4. Create local SQLite record (stores hashed password for backend auth)
    const createdUser = await db.user.create({
      data: {
        email,
        username: finalUsername,
        name: name.trim(),
        passwordHash: await hashPassword(password),
        role,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      },
    });

    const user = toPublicUser(createdUser);

    // 5. Authenticate against the backend MongoDB service
    let backendSession;
    try {
      backendSession = await authenticateBackendUser({
        email,
        password,
        username: finalUsername,
      });
    } catch (backendError) {
      // Roll back the local user record to prevent "email already exists" on retry
      await db.user.delete({ where: { id: createdUser.id } }).catch(() => {});
      console.error("Backend auth failed during registration, rolled back local user:", backendError);
      return NextResponse.json(
        { error: "Unable to connect to the backend service. Please check it is running and try again." },
        { status: 503 }
      );
    }

    // 6. Set the StratAPI session cookie
    const response = NextResponse.json(
      {
        user,
        message: `${roleLabels[user.role]} account created successfully.`,
      },
      { status: 201 }
    );

    setSessionCookie(response, user, idToken, backendSession);

    return response;
  } catch (error) {
    console.error("Failed to register account", error);
    return NextResponse.json({ error: "Unable to create the account right now." }, { status: 500 });
  }
}
