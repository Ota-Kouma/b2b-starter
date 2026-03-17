"use client";

import { useState } from "react";
import { toast } from "sonner";
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
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  // MANAGERはADMINを招待できない
  const availableRoles = role === "COMPANY_MANAGER"
    ? INVITABLE_ROLES.filter((r) => r.value !== "COMPANY_ADMIN")
    : INVITABLE_ROLES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: name || undefined, role: selectedRole }),
    });

    const data = await res.json();
    setStatus("idle");

    if (res.ok) {
      setEmail("");
      setName("");
      setSelectedRole("EMPLOYEE");
      if (data.inviteLink) {
        toast.info(`招待リンク（メール未送信）: ${data.inviteLink}`, { duration: 10000 });
      } else {
        toast.success("招待メールを送信しました");
      }
    } else {
      const messages: Record<string, string> = {
        USER_BELONGS_TO_OTHER_COMPANY: "このユーザーはすでに別の会社に所属しています。",
        TOO_MANY_REQUESTS: "招待の送信回数が上限に達しました。しばらく待ってから再試行してください。",
        INSUFFICIENT_PERMISSION: "このロールを招待する権限がありません。",
      };
      toast.error(messages[data.error] ?? "招待の送信に失敗しました。");
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
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "送信中..." : "招待メールを送る"}
      </Button>
    </form>
  );
}
