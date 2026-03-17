import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCompanyForm } from "./_components/CreateCompanyForm";

export default async function PlatformPage() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "PLATFORM_OPERATOR")) redirect("/login");

  const companies = await db.company.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">プラットフォーム管理</h1>

        <Card>
          <CardHeader>
            <CardTitle>会社を新規作成</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateCompanyForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>会社一覧（{companies.length}社）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-gray-500">ID: {company.id}</p>
                  </div>
                  <span className="text-sm text-gray-600">{company._count.users}名</span>
                </div>
              ))}
              {companies.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">会社が登録されていません</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
