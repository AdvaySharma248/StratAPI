import "server-only";

// ---------------------------------------------------------------------------
// Firebase Admin SDK – Server-side ID Token Verification
//
// Priority:
//   1. If FIREBASE_SERVICE_ACCOUNT_JSON is set → use service account cert
//   2. Otherwise → use the Firebase public key REST endpoint directly
//      (works without any credentials — suitable for development)
// ---------------------------------------------------------------------------

let adminAuth: import("firebase-admin/auth").Auth | null = null;

async function getAdminAuth() {
  if (adminAuth) return adminAuth;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    // Full service account — best for production
    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "stratapi-77837",
      });
    }
    adminAuth = admin.auth();
  } else {
    // No service account — use firebase-admin with a lightweight default init.
    // verifyIdToken on a non-credential app still validates via Google's JWKS.
    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: "stratapi-77837" });
    }
    adminAuth = admin.auth();
  }

  return adminAuth;
}

/**
 * Verify a Firebase ID token server-side.
 * Returns the decoded token payload or throws if invalid.
 */
export async function verifyFirebaseToken(
  idToken: string
): Promise<import("firebase-admin/auth").DecodedIdToken> {
  const auth = await getAdminAuth();
  return auth.verifyIdToken(idToken);
}
