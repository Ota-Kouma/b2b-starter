import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./_components/ProfileForm";
import type { Role } from "@/lib/generated/prisma/enums";

const ROLE_LEVEL: Record<Role, number> = {
  PLATFORM_OWNER: 100, PLATFORM_OPERATOR: 80,
  COMPANY_ADMIN: 60, COMPANY_MANAGER: 40, COMPANY_AUDITOR: 20, EMPLOYEE: 10,
};
function getHomeUrl(role: Role): string {
  if (ROLE_LEVEL[role] >= 80) return "/platform";
  if (ROLE_LEVEL[role] >= 20) return "/admin";
  return "/dashboard";
}

const ROLE_LABEL: Record<string, string> = {
  PLATFORM_OWNER: "プラットフォームオーナー",
  PLATFORM_OPERATOR: "プラットフォーム運営",
  COMPANY_ADMIN: "会社管理者",
  COMPANY_MANAGER: "マネージャー",
  COMPANY_AUDITOR: "監査者",
  EMPLOYEE: "社員",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.dbId } });
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto p-8 space-y-6">
        <Link href={getHomeUrl(session.role)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" />
          ホームへ戻る
        </Link>
        <h1 className="text-2xl font-bold">プロフィール</h1>
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              name={user.name}
              email={user.email}
              roleLabel={ROLE_LABEL[user.role] ?? user.role}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
