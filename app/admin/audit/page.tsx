import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTION_LABEL: Record<string, string> = {
  USER_INVITED: "ユーザー招待",
  USER_ACTIVATED: "ユーザー有効化",
  USER_DEACTIVATED: "ユーザー無効化",
  USER_UPDATED: "ユーザー更新",
  PROFILE_UPDATED: "プロフィール更新",
  COMPANY_CREATED: "会社作成",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "COMPANY_AUDITOR")) redirect("/login");
  if (!session.companyId) redirect("/dashboard");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));
  const limit = 50;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: { user: { companyId: session.companyId } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({
      where: { user: { companyId: session.companyId } },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">監査ログ</h1>

        <Card>
          <CardHeader>
            <CardTitle>操作履歴 ({total}件)</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">ログがありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-4 font-medium">日時</th>
                      <th className="pb-2 pr-4 font-medium">操作者</th>
                      <th className="pb-2 pr-4 font-medium">操作</th>
                      <th className="pb-2 font-medium">詳細</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="font-medium">
                            {log.user.name ?? log.user.email}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                            {ACTION_LABEL[log.action] ?? log.action}
                          </span>
                        </td>
                        <td className="py-2 text-gray-600 text-xs font-mono">
                          {log.detail ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {page > 1 && (
                  <a
                    href={`/admin/audit?page=${page - 1}`}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    前へ
                  </a>
                )}
                <span className="px-3 py-1 text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={`/admin/audit?page=${page + 1}`}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    次へ
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
