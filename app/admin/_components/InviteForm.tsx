"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Role } from "@prisma/client";

type Props = { role: Role };

const INVITABLE_ROLES = [
  { value: "EMPLOYEE", label: "社員" },
  { value: "COMPANY_AUDITOR", label: "監査者" },
  { value: "COMPANY_MANAGER", label: "マネージャー" },
  { value: "COMPANY_ADMIN", label: "会社管理者" },
] as const;

export function InviteForm({ role }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("EMPLOYEE");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // MANAGERはADMINを招待できない
  const availableRoles = role === "COMPANY_MANAGER"
    ? INVITABLE_ROLES.filter((r) => r.value !== "COMPANY_ADMIN")
    : INVITABLE_ROLES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: name || undefined, role: selectedRole }),
    });

    if (res.ok) {
      const data = await res.json();
      setStatus("success");
      setEmail("");
      setName("");
      setSelectedRole("EMPLOYEE");
      // Resend未設定の場合は招待リンクを表示
      if (data.inviteLink) {
        setErrorMsg(`招待リンク（メール未送信）: ${data.inviteLink}`);
      }
    } else {
      const data = await res.json();
      setStatus("error");
      const messages: Record<string, string> = {
        USER_BELONGS_TO_OTHER_COMPANY: "このユーザーはすでに別の会社に所属しています。",
        TOO_MANY_REQUESTS: "招待の送信回数が上限に達しました。しばらく待ってから再試行してください。",
        INSUFFICIENT_PERMISSION: "このロールを招待する権限がありません。",
      };
      setErrorMsg(messages[data.error] ?? "招待の送信に失敗しました。");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">メールアドレス *</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-name">名前</Label>
          <Input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="田中 太郎"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">ロール</Label>
        <select
          id="invite-role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        >
          {availableRoles.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      {status === "success" && (
        <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          招待メールを送信しました。
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errorMsg}</p>
      )}
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "送信中..." : "招待メールを送る"}
      </Button>
    </form>
  );
}
