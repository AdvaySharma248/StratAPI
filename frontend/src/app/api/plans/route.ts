import { proxyPublicBackendRequest } from "@/lib/backend-api";

export async function GET() {
  return proxyPublicBackendRequest("/plans");
}
