import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/generated/prisma/enums";

export type SessionPayload = {
  sub: string;       // Firebase UID
  dbId: string;      // DB の User.id
  email: string;
  role: Role;
  companyId: string | null;
  iat: number;
  exp: number;
};

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(payload.iat)
    .setExpirationTime(payload.exp)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SessionPayload;
}

export function getRedirectPathForRole(role: Role): string {
  switch (role) {
    case "PLATFORM_OWNER":
    case "PLATFORM_OPERATOR":
      return "/platform";
    case "COMPANY_ADMIN":
    case "COMPANY_MANAGER":
    case "COMPANY_AUDITOR":
      return "/admin";
    case "EMPLOYEE":
    default:
      return "/dashboard";
  }
}
