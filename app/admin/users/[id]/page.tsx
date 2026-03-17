import { redirect, notFound } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditUserForm } from "./_components/EditUserForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "COMPANY_ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;

  const user = await db.user.findUnique({ where: { id } });
  if (!user || user.companyId !== session.companyId) {
    notFound();
  }

  const isSelf = user.id === session.dbId;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            管理画面に戻る
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ユーザー編集</CardTitle>
          </CardHeader>
          <CardContent>
            <EditUserForm
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
              }}
              sessionRole={session.role}
              isSelf={isSelf}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
