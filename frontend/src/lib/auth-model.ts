export const userRoles = ["owner", "consumer", "admin"] as const;

export type UserRole = (typeof userRoles)[number];

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  company: string;
  timezone: string;
  role: UserRole;
}

export const authCookieName = "stratapi_session";

export const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  owner: { label: "OWNER", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
  consumer: { label: "CONSUMER", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  admin: { label: "ADMIN", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
};

export const rolePages: Record<UserRole, string[]> = {
  owner: ["dashboard", "apis", "api-keys", "analytics", "billing", "settings"],
  consumer: ["overview", "my-api-keys", "usage-history"],
  admin: ["all-users", "all-apis", "system-stats"],
};

export const roleDefaultPage: Record<UserRole, string> = {
  owner: "dashboard",
  consumer: "overview",
  admin: "all-users",
};

export const roleLabels: Record<UserRole, string> = {
  owner: "API Owner",
  consumer: "Consumer",
  admin: "Admin",
};

export function fallbackNameForEmail(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
