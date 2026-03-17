export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { createSessionToken, getRedirectPathForRole } from "@/lib/session";
import { loginRateLimit } from "@/lib/rate-limit";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7日

export async function POST(request: Request) {
  // レート制限（IPベース）
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await loginRateLimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.idToken) {
    return NextResponse.json({ error: "MISSING_ID_TOKEN" }, { status: 400 });
  }

  // Firebase IDトークン検証
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(body.idToken);
  } catch {
    return NextResponse.json({ error: "INVALID_ID_TOKEN" }, { status: 401 });
  }

  // DBにユーザーを作成or取得（初回ログインはEMPLOYEEとして登録）
  const user = await db.user.upsert({
    where: { email: decodedToken.email! },
    update: {},
    create: {
      email: decodedToken.email!,
      name: decodedToken.name ?? null,
      role: "EMPLOYEE",
    },
  });

  // 無効化されたユーザーはログイン不可
  if (!user.isActive) {
    return NextResponse.json({ error: "USER_DISABLED" }, { status: 403 });
  }

  const sessionToken = await createSessionToken({
    sub: decodedToken.uid,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    dbId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const response = NextResponse.json({
    redirectTo: getRedirectPathForRole(user.role),
  });

  response.cookies.set("session", sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
