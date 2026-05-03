import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  clearSessionCookie,
  getBackendAccessTokenFromRequest,
  getBackendAuthSessionFromRequest,
  getSessionUserFromRequest,
  setSessionCookie,
} from "@/lib/auth-server";
import { proxyBackendRequest } from "@/lib/backend-api";
import {
  findLocalUserProfileByEmail,
  findLocalUserProfileById,
  updateLocalUserProfile,
} from "@/lib/user-profile-store";

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80, "Name is too long."),
  email: z.string().trim().email("Enter a valid email address.").max(120),
  company: z.string().trim().max(120, "Company is too long.").optional().default(""),
  timezone: z.string().trim().min(1, "Select a timezone.").max(80),
});

async function readResponseError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message || body.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);

    if (!sessionUser) {
      const response = NextResponse.json({ error: "Not authenticated." }, { status: 401 });
      clearSessionCookie(response);
      return response;
    }

    const existingUser = await findLocalUserProfileById(sessionUser.id);

    if (!existingUser) {
      const response = NextResponse.json({ error: "Session is no longer valid." }, { status: 401 });
      clearSessionCookie(response);
      return response;
    }

    return NextResponse.json({ user: existingUser });
  } catch (error) {
    console.error("Failed to read session", error);
    const response = NextResponse.json({ error: "Unable to read the current session." }, { status: 500 });
    clearSessionCookie(response);
    return response;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);

    if (!sessionUser) {
      const response = NextResponse.json({ error: "Not authenticated." }, { status: 401 });
      clearSessionCookie(response);
      return response;
    }

    const parsedBody = profileUpdateSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Invalid profile details." },
        { status: 400 }
      );
    }

    const formData = {
      ...parsedBody.data,
      email: parsedBody.data.email.trim().toLowerCase(),
    };
    const existingUser = await findLocalUserProfileById(sessionUser.id);

    if (!existingUser) {
      const response = NextResponse.json({ error: "Session is no longer valid." }, { status: 401 });
      clearSessionCookie(response);
      return response;
    }

    const emailOwner = await findLocalUserProfileByEmail(formData.email);

    if (emailOwner && emailOwner.id !== sessionUser.id) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const accessToken = getBackendAccessTokenFromRequest(request);

    if (!accessToken) {
      return NextResponse.json({ error: "Backend API session is missing. Please sign in again." }, { status: 401 });
    }

    const backendResponse = await proxyBackendRequest("/api/v1/auth/me", accessToken, {
      method: "PUT",
      body: JSON.stringify(formData),
      contentType: "application/json",
    });

    if (!backendResponse.ok) {
      return NextResponse.json({ error: await readResponseError(backendResponse) }, { status: backendResponse.status });
    }

    const updatedUser = await updateLocalUserProfile(sessionUser.id, formData);

    if (!updatedUser) {
      const response = NextResponse.json({ error: "Session is no longer valid." }, { status: 401 });
      clearSessionCookie(response);
      return response;
    }

    const response = NextResponse.json({ user: updatedUser });
    setSessionCookie(response, updatedUser, getBackendAuthSessionFromRequest(request));

    return response;
  } catch (error) {
    console.error("Failed to update profile", error);
    return NextResponse.json({ error: "Unable to update profile right now." }, { status: 500 });
  }
}
