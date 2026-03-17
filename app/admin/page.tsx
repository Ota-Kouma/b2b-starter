import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getSession, hasPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteForm } from "./_components/InviteForm";
import { BulkInviteForm } from "./_components/BulkInviteForm";
import { UserSearch } from "./_components/UserSearch";

const ROLE_LABEL: Record<string, string> = {
  COMPANY_ADMIN: "会社管理者",
  COMPANY_MANAGER: "マネージャー",
  COMPANY_AUDITOR: "監査者",
  EMPLOYEE: "社員",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "COMPANY_AUDITOR")) redirect("/login");

  const { q } = await searchParams;

  const users = session.companyId
    ? await db.user.findMany({
        where: {
          companyId: session.companyId,
          ...(q && {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }),
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const canInvite = hasPermission(session.role, "COMPANY_MANAGER") && !!session.companyId;
  const canChangeRole = hasPermission(session.role, "COMPANY_ADMIN") && !!session.companyId;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">管理画面</h1>
          {hasPermission(session.role, "COMPANY_AUDITOR") && (
            <Link href="/admin/audit" className="text-sm text-blue-600 hover:underline">
              監査ログ →
            </Link>
          )}
        </div>

        {canInvite && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>ユーザー招待</CardTitle>
              </CardHeader>
              <CardContent>
                <InviteForm role={session.role} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>一括招待</CardTitle>
              </CardHeader>
              <CardContent>
                <BulkInviteForm />
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>ユーザー一覧</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense>
              <UserSearch />
            </Suspense>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white border rounded-lg gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.name ?? user.email}</p>
                    {user.name && <p className="text-sm text-gray-500 truncate">{user.email}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {ROLE_LABEL[user.role] ?? user.role}
                    </Badge>
                    {!user.isActive && <Badge variant="destructive">無効</Badge>}
                    {canChangeRole && (
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        編集
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  {q ? `「${q}」に一致するユーザーがいません` : "ユーザーがいません"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
