import { cookies } from "next/headers";
import { verifySessionToken, type SessionPayload } from "@/lib/session";
import type { Role } from "@/lib/generated/prisma/enums";

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

// ロール階層（数値が高いほど上位）
const ROLE_LEVEL: Record<Role, number> = {
  PLATFORM_OWNER: 100,
  PLATFORM_OPERATOR: 80,
  COMPANY_ADMIN: 60,
  COMPANY_MANAGER: 40,
  COMPANY_AUDITOR: 20,
  EMPLOYEE: 10,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}
