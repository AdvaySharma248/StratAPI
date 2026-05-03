import type { PageId } from "@/lib/store";

export const pageRouteById: Record<PageId, string> = {
  dashboard: "/dashboard",
  apis: "/apis",
  "api-keys": "/api-keys",
  analytics: "/analytics",
  billing: "/billing",
  settings: "/settings",
  overview: "/overview",
  "my-api-keys": "/my-api-keys",
  "usage-history": "/usage-history",
  "all-users": "/all-users",
  "all-apis": "/all-apis",
  "system-stats": "/system-stats",
};

export const pageIds = Object.keys(pageRouteById) as PageId[];

export function getPageRoute(pageId: PageId) {
  return pageRouteById[pageId];
}

export function isPageId(value: string): value is PageId {
  return pageIds.includes(value as PageId);
}
