export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  companyName: z.string().min(1),
  adminEmail: z.string().email(),
  adminName: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "PLATFORM_OPERATOR")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { companyName, adminEmail, adminName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (existing?.companyId) {
    return NextResponse.json({ error: "EMAIL_ALREADY_USED" }, { status: 409 });
  }

  try {
    const company = await db.company.create({ data: { name: companyName } });

    const tempPassword = Math.random().toString(36).slice(-10) + "Aa1!";
    try {
      await adminAuth.createUser({ email: adminEmail, password: tempPassword });
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "auth/email-already-exists") throw err;
    }

    await db.user.upsert({
      where: { email: adminEmail },
      update: { name: adminName ?? null, role: "COMPANY_ADMIN", companyId: company.id },
      create: { email: adminEmail, name: adminName ?? null, role: "COMPANY_ADMIN", companyId: company.id },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const inviteLink = await adminAuth.generatePasswordResetLink(adminEmail, {
      url: `${baseUrl}/login`,
    });

    await logAudit(session.dbId, "COMPANY_CREATED", company.id, `name:${companyName} admin:${adminEmail}`);

    return NextResponse.json({ ok: true, company, inviteLink });
  } catch (err) {
    console.error("Create company error:", err);
    return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 });
  }
}
