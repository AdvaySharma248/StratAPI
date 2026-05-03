import "server-only";

import type { BackendAuthSession } from "@/lib/auth-server";

const backendBaseUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  `http://127.0.0.1:${process.env.BACKEND_PORT ?? "3001"}`
).replace(/\/+$/, "");

type BackendAuthPayload = {
  email: string;
  password: string;
  username?: string;
};

async function readBackendError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message || body.error || "Backend request failed.";
  } catch {
    return "Backend request failed.";
  }
}

async function postBackendAuth(path: string, body: Record<string, unknown>) {
  return fetch(`${backendBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function authenticateBackendUser({ email, password, username }: BackendAuthPayload): Promise<BackendAuthSession> {
  // Step 1: Try logging in — the backend account may already exist.
  let response = await postBackendAuth("/api/v1/auth/login", { email, password });

  if (response.ok) {
    return response.json() as Promise<BackendAuthSession>;
  }

  // Step 2: No backend account yet — register using the default "owner" role.
  // The backend role doesn't matter; the real role is stored in the local SQLite DB.
  // Forward the username so MongoDB stores the same value as SQLite (required for key assignment lookup).
  if (response.status === 401) {
    response = await postBackendAuth("/api/v1/auth/register", {
      email,
      password,
      role: "owner",
      ...(username ? { username } : {}),
    });

    if (response.ok) {
      return response.json() as Promise<BackendAuthSession>;
    }

    // Backend already has this account (race condition) — retry login.
    if (response.status === 409) {
      response = await postBackendAuth("/api/v1/auth/login", { email, password });

      if (response.ok) {
        return response.json() as Promise<BackendAuthSession>;
      }
    }

    // Registration was blocked by the backend (e.g. admin-only, rate limit, etc.)
    // Try one final login attempt in case the account exists but login failed earlier.
    if (!response.ok) {
      const finalAttempt = await postBackendAuth("/api/v1/auth/login", { email, password });

      if (finalAttempt.ok) {
        return finalAttempt.json() as Promise<BackendAuthSession>;
      }
    }
  }

  throw new Error(await readBackendError(response));
}

export async function proxyBackendRequest(
  path: string,
  accessToken: string,
  init: {
    method: string;
    body?: BodyInit | null;
    contentType?: string | null;
  }
) {
  const headers = new Headers({
    Authorization: `Bearer ${accessToken}`,
  });

  if (init.body && init.contentType) {
    headers.set("Content-Type", init.contentType);
  }

  const response = await fetch(`${backendBaseUrl}${path}`, {
    method: init.method,
    headers,
    body: init.body,
    cache: "no-store",
  });
  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");

  if (responseContentType) {
    responseHeaders.set("Content-Type", responseContentType);
  }

  if (response.status === 204) {
    return new Response(null, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  return new Response(await response.text(), {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function proxyPublicBackendRequest(path: string) {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    method: "GET",
    cache: "no-store",
  });
  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");

  if (responseContentType) {
    responseHeaders.set("Content-Type", responseContentType);
  }

  return new Response(await response.text(), {
    status: response.status,
    headers: responseHeaders,
  });
}
