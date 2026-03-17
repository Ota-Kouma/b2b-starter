export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const updated = await db.user.update({
    where: { id: session.dbId },
    data: { name: parsed.data.name },
  });

  await logAudit(session.dbId, "PROFILE_UPDATED", session.dbId, `name:${parsed.data.name}`);

  return NextResponse.json({ ok: true, user: updated });
}
