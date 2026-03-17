export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Role } from "@/lib/generated/prisma/enums";

const schema = z.object({
  role: z.enum([
    "COMPANY_ADMIN",
    "COMPANY_MANAGER",
    "COMPANY_AUDITOR",
    "EMPLOYEE",
  ]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  // COMPANY_ADMIN以上のみ変更可能
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

  // 対象ユーザーが同じ会社か確認
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.companyId !== session.companyId) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // 自分自身のロールは変更不可
  if (target.id === session.dbId) {
    return NextResponse.json({ error: "CANNOT_CHANGE_OWN_ROLE" }, { status: 400 });
  }

  // 自分より上位のロールには変更不可
  const ROLE_LEVEL: Record<Role, number> = {
    PLATFORM_OWNER: 100,
    PLATFORM_OPERATOR: 80,
    COMPANY_ADMIN: 60,
    COMPANY_MANAGER: 40,
    COMPANY_AUDITOR: 20,
    EMPLOYEE: 10,
  };
  if (ROLE_LEVEL[parsed.data.role] >= ROLE_LEVEL[session.role]) {
    return NextResponse.json({ error: "INSUFFICIENT_PERMISSION" }, { status: 403 });
  }

  const updated = await db.user.update({
    where: { id },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ ok: true, role: updated.role });
}
