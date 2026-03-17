"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Result = { inviteLink: string; companyName: string } | null;

export function CreateCompanyForm() {
  const [companyName, setCompanyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/platform/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, adminEmail, adminName: adminName || undefined }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      const messages: Record<string, string> = {
        EMAIL_ALREADY_USED: "このメールアドレスはすでに別の会社に登録されています",
        INVALID_INPUT: "入力内容が正しくありません",
        CREATE_FAILED: "作成に失敗しました",
      };
      toast.error(messages[data.error] ?? "エラーが発生しました");
      return;
    }

    setResult({ inviteLink: data.inviteLink, companyName });
    setCompanyName("");
    setAdminEmail("");
    setAdminName("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>会社名 *</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="株式会社〇〇"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>管理者名（任意）</Label>
            <Input
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="山田 太郎"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>管理者メールアドレス *</Label>
          <Input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@company.com"
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "作成中..." : "会社を作成して招待リンクを発行"}
        </Button>
      </form>

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <p className="text-sm font-medium text-green-800">✓ 「{result.companyName}」を作成しました</p>
          <p className="text-xs text-green-700">管理者への招待リンク（このリンクを管理者に送付してください）：</p>
          <code className="block text-xs bg-white border border-green-200 rounded p-2 break-all">
            {result.inviteLink}
          </code>
        </div>
      )}
    </div>
  );
}
