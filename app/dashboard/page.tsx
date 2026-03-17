import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_LABEL: Record<string, string> = {
  PLATFORM_OWNER: "プラットフォームオーナー",
  PLATFORM_OPERATOR: "プラットフォーム運営",
  COMPANY_ADMIN: "会社管理者",
  COMPANY_MANAGER: "マネージャー",
  COMPANY_AUDITOR: "監査者",
  EMPLOYEE: "社員",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Card>
          <CardHeader>
            <CardTitle>ユーザー情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-24">メール</span>
              <span className="font-medium">{session.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-24">ロール</span>
              <Badge>{ROLE_LABEL[session.role] ?? session.role}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
