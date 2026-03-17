import { db } from "@/lib/db";

export async function logAudit(
  userId: string,
  action: string,
  targetId?: string,
  detail?: string
) {
  try {
    await db.auditLog.create({
      data: { userId, action, targetId, detail },
    });
  } catch (err) {
    // 監査ログの失敗はメイン処理に影響させない
    console.error("Failed to write audit log:", err);
  }
}
