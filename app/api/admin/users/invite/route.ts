export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { sendInviteEmail } from "@/lib/mailer";
import { inviteRateLimit } from "@/lib/rate-limit";
import { inviteSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import type { Role } from "@/lib/generated/prisma/enums";

// 招待できるロール（COMPANY_MANAGER以上）
const INVITABLE_ROLES: Role[] = ["COMPANY_ADMIN", "COMPANY_MANAGER", "COMPANY_AUDITOR", "EMPLOYEE"];

export async function POST(request: Request) {
  const session = await getSession();

  // COMPANY_MANAGER以上のみ招待可能
  if (!session || !hasPermission(session.role, "COMPANY_MANAGER")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!session.companyId) {
    return NextResponse.json({ error: "NO_COMPANY" }, { status: 400 });
  }

  // レート制限
  const { success } = await inviteRateLimit.limit(session.dbId);
  if (!success) {
    return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429 });
  }

  // 入力バリデーション
  const body = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, name, role } = parsed.data;

  // COMPANY_MANAGERはADMINより上のロールを招待できない
  if (!INVITABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "INVALID_ROLE" }, { status: 400 });
  }
  if (session.role === "COMPANY_MANAGER" && role === "COMPANY_ADMIN") {
    return NextResponse.json({ error: "INSUFFICIENT_PERMISSION" }, { status: 403 });
  }

  // 既存ユーザーの会社チェック（別会社への上書きを防止）
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser?.companyId && existingUser.companyId !== session.companyId) {
    return NextResponse.json({ error: "USER_BELONGS_TO_OTHER_COMPANY" }, { status: 409 });
  }

  try {
    // Firebaseユーザー作成（存在する場合はスキップ）
    const tempPassword = Math.random().toString(36).slice(-10) + "Aa1!";
    try {
      await adminAuth.createUser({ email, password: tempPassword });
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "auth/email-already-exists") throw err;
    }

    // DB登録・更新
    await db.user.upsert({
      where: { email },
      update: { name: name ?? undefined, role, companyId: session.companyId },
      create: { email, name: name ?? null, role, companyId: session.companyId },
    });

    // 招待リンク生成
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const inviteLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${baseUrl}/login`,
    });

    // 会社名取得してメール送信（Resend未設定の場合はリンクを返す）
    const company = await db.company.findUnique({ where: { id: session.companyId } });
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      await sendInviteEmail({ to: email, inviteLink, companyName: company?.name ?? "your company" });
      emailSent = true;
    }

    const invitedUser = await db.user.findUnique({ where: { email } });
    await logAudit(session.dbId, "USER_INVITED", invitedUser?.id, `email:${email} role:${role}`);

    return NextResponse.json({ ok: true, emailSent, inviteLink: emailSent ? undefined : inviteLink });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: "INVITE_FAILED" }, { status: 500 });
  }
}
