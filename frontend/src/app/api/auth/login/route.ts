import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { roleLabels, userRoles } from "@/lib/auth-model";
import { setSessionCookie, toPublicUser, verifyPassword } from "@/lib/auth-server";
import { authenticateBackendUser } from "@/lib/backend-api";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

const loginSchema = z.object({
  idToken: z.string().min(1, "Firebase ID token is required."),
  email: z.string().trim().email("Enter a valid email address.").max(120),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
  role: z.enum(userRoles),
});

export async function POST(request: NextRequest) {
  try {
    const parsedBody = loginSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Invalid sign-in details." },
        { status: 400 }
      );
    }

    const { idToken, email: rawEmail, password, role } = parsedBody.data;
    const email = rawEmail.trim().toLowerCase();

    // 1. Verify the Firebase ID token (proves the user authenticated with Firebase)
    let firebaseUid: string;
    try {
      const decoded = await verifyFirebaseToken(idToken);
      firebaseUid = decoded.uid;

      // Make sure the token belongs to the email the user entered
      if (decoded.email?.toLowerCase() !== email) {
        return NextResponse.json({ error: "Token email mismatch." }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Firebase token verification failed." }, { status: 401 });
    }

    // 2. Look up the local user record
    const existingUser = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "No account found with this email." }, { status: 401 });
    }

    // 3. Verify local password (keeps backward compatibility with SQLite shadow record)
    const passwordMatches = await verifyPassword(password, existingUser.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // 4. Enforce role selection
    if (existingUser.role !== role) {
      return NextResponse.json(
        { error: `This account is registered as ${roleLabels[existingUser.role]}. Choose that role to continue.` },
        { status: 403 }
      );
    }

    const user = toPublicUser(existingUser);

    // 5. Authenticate against the backend MongoDB service
    const backendSession = await authenticateBackendUser({ email, password });

    // 6. Set the StratAPI session cookie (stores Firebase UID + backend tokens)
    const response = NextResponse.json({ user });
    setSessionCookie(response, user, idToken, backendSession);

    return response;
  } catch (error) {
    console.error("Failed to sign in", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
