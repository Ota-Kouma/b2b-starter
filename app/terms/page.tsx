import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function TermsPage() {
  const session = await getSession();
  const homeUrl = session ? getHomeUrl(session.role) : "/login";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        <Link href={homeUrl} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" />
          ホームへ戻る
        </Link>
        <h1 className="text-2xl font-bold">利用規約</h1>
        <Card>
          <CardHeader>
            <CardTitle>Nexus 利用規約</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4 text-sm text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-semibold text-base mb-2">第1条（適用）</h2>
              <p>本規約は、Nexus（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意した上で本サービスをご利用ください。</p>
            </section>
            <section>
              <h2 className="font-semibold text-base mb-2">第2条（利用登録）</h2>
              <p>利用登録は、会社の管理者が招待メールを送信し、ユーザーが所定の手続きを完了することで完了します。</p>
            </section>
            <section>
              <h2 className="font-semibold text-base mb-2">第3条（禁止事項）</h2>
              <p>ユーザーは、以下の行為を行ってはなりません。</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>他のユーザーへの不正アクセス</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>
            <section>
              <h2 className="font-semibold text-base mb-2">第4条（サービスの停止・変更）</h2>
              <p>当社は、システムメンテナンスや不可抗力等の理由により、事前通知なく本サービスを停止・変更することがあります。</p>
            </section>
            <section>
              <h2 className="font-semibold text-base mb-2">第5条（免責事項）</h2>
              <p>当社は、本サービスの利用により生じた損害について、当社の故意または重過失による場合を除き、責任を負いません。</p>
            </section>
            <section>
              <h2 className="font-semibold text-base mb-2">第6条（規約の変更）</h2>
              <p>当社は、必要に応じて本規約を変更することができます。変更後も本サービスを継続して利用した場合、変更後の規約に同意したものとみなします。</p>
            </section>
            <p className="text-gray-400 pt-4">制定日：2024年1月1日</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
