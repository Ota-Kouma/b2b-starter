export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "COMPANY_AUDITOR")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!session.companyId) {
    return NextResponse.json({ error: "NO_COMPANY" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;

  const logs = await db.auditLog.findMany({
    where: {
      user: { companyId: session.companyId },
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await db.auditLog.count({
    where: { user: { companyId: session.companyId } },
  });

  return NextResponse.json({ logs, total, page, limit });
}
