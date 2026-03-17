export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  isActive: z.boolean(),
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
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { id } = await params;

  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.companyId !== session.companyId) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // 自分自身の無効化は不可
  if (target.id === session.dbId) {
    return NextResponse.json({ error: "CANNOT_DEACTIVATE_SELF" }, { status: 400 });
  }

  try {
    // DB更新を先に行い、成功後にFirebaseを同期（競合状態防止）
    const updated = await db.user.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
    });

    try {
      const firebaseUser = await adminAuth.getUserByEmail(target.email);
      await adminAuth.updateUser(firebaseUser.uid, { disabled: !parsed.data.isActive });
    } catch (firebaseErr) {
      console.error("Firebase sync error (DB already updated):", firebaseErr);
    }

    await logAudit(session.dbId, parsed.data.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED", id);

    return NextResponse.json({ ok: true, isActive: updated.isActive });
  } catch (err) {
    console.error("Update status error:", err);
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }
}
