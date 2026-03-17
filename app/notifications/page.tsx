import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationForm } from "./_components/NotificationForm";
import type { Role } from "@/lib/generated/prisma/enums";

const ROLE_LEVEL: Record<Role, number> = {
  PLATFORM_OWNER: 100, PLATFORM_OPERATOR: 80,
  COMPANY_ADMIN: 60, COMPANY_MANAGER: 40, COMPANY_AUDITOR: 20, EMPLOYEE: 10,
};
function getHomeUrl(role: Role) {
  if (ROLE_LEVEL[role] >= 80) return "/platform";
  if (ROLE_LEVEL[role] >= 20) return "/admin";
  return "/dashboard";
}

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.dbId } });
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        <Link href={getHomeUrl(session.role)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" />
          ホームへ戻る
        </Link>
        <h1 className="text-2xl font-bold">通知設定</h1>
        <Card>
          <CardHeader>
            <CardTitle>メール通知</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationForm
              notifyInvite={user.notifyInvite}
              notifySystem={user.notifySystem}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
