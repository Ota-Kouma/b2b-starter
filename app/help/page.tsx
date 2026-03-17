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

const faqs = [
  {
    q: "パスワードを忘れました",
    a: "ログイン画面の「パスワードを忘れた方はこちら」からリセットメールを送信できます。",
  },
  {
    q: "メールアドレスを変更したい",
    a: "メールアドレスの変更は管理者が行います。会社の管理者にお問い合わせください。",
  },
  {
    q: "アカウントが無効になっています",
    a: "管理者によってアカウントが無効化されています。会社の管理者にご連絡ください。",
  },
  {
    q: "招待メールが届きません",
    a: "迷惑メールフォルダをご確認ください。それでも届かない場合は管理者に再送を依頼してください。",
  },
  {
    q: "ロールを変更したい",
    a: "ロールの変更は会社管理者のみ行えます。会社の管理者にお問い合わせください。",
  },
];

export default async function HelpPage() {
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
        <h1 className="text-2xl font-bold">ヘルプ</h1>
        <Card>
          <CardHeader>
            <CardTitle>よくある質問</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-medium">Q. {faq.q}</p>
                <p className="text-sm text-gray-600 pl-4">A. {faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>お問い合わせ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              解決しない場合は、サポートまでお問い合わせください。
            </p>
            <p className="text-sm text-gray-900 font-medium mt-2">support@nexus.example.com</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
