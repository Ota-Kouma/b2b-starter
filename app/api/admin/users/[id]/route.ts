export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import type { Role } from "@/lib/generated/prisma/enums";

const ROLE_LEVEL: Record<Role, number> = {
  PLATFORM_OWNER: 100,
  PLATFORM_OPERATOR: 80,
  COMPANY_ADMIN: 60,
  COMPANY_MANAGER: 40,
  COMPANY_AUDITOR: 20,
  EMPLOYEE: 10,
};

const schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["COMPANY_ADMIN", "COMPANY_MANAGER", "COMPANY_AUDITOR", "EMPLOYEE"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "COMPANY_ADMIN")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!session.companyId) {
    return NextResponse.json({ error: "NO_COMPANY" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;

  // 同じ会社のユーザーのみ編集可能
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.companyId !== session.companyId) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // 自分自身のロール変更は不可
  if (parsed.data.role && target.id === session.dbId) {
    return NextResponse.json({ error: "CANNOT_CHANGE_OWN_ROLE" }, { status: 400 });
  }

  // 自分以上のロールには変更不可
  if (parsed.data.role && ROLE_LEVEL[parsed.data.role] >= ROLE_LEVEL[session.role]) {
    return NextResponse.json({ error: "INSUFFICIENT_PERMISSION" }, { status: 403 });
  }

  try {
    // DB更新を先に行い、成功後にFirebaseを同期（競合状態防止）
    const updated = await db.user.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email }),
        ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      },
    });

    // メール変更の場合はFirebaseも更新
    if (parsed.data.email && parsed.data.email !== target.email) {
      try {
        const firebaseUser = await adminAuth.getUserByEmail(target.email);
        await adminAuth.updateUser(firebaseUser.uid, { email: parsed.data.email });
      } catch (firebaseErr) {
        console.error("Firebase email sync error (DB already updated):", firebaseErr);
      }
    }

    const changes = [];
    if (parsed.data.name !== undefined) changes.push(`name:${parsed.data.name}`);
    if (parsed.data.email !== undefined) changes.push(`email:${parsed.data.email}`);
    if (parsed.data.role !== undefined) changes.push(`role:${parsed.data.role}`);
    await logAudit(session.dbId, "USER_UPDATED", id, changes.join(" "));

    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }
}
