"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/lib/generated/prisma/enums";

const ROLE_LABEL: Record<string, string> = {
  COMPANY_ADMIN: "会社管理者",
  COMPANY_MANAGER: "マネージャー",
  COMPANY_AUDITOR: "監査者",
  EMPLOYEE: "社員",
};

const ROLE_LEVEL: Record<Role, number> = {
  PLATFORM_OWNER: 100,
  PLATFORM_OPERATOR: 80,
  COMPANY_ADMIN: 60,
  COMPANY_MANAGER: 40,
  COMPANY_AUDITOR: 20,
  EMPLOYEE: 10,
};

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: Role;
    isActive: boolean;
  };
  sessionRole: Role;
  isSelf: boolean;
};

export function EditUserForm({ user, sessionRole, isSelf }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const selectableRoles = (
    ["COMPANY_ADMIN", "COMPANY_MANAGER", "COMPANY_AUDITOR", "EMPLOYEE"] as Role[]
  ).filter((r) => ROLE_LEVEL[r] < ROLE_LEVEL[sessionRole]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const body: Record<string, string> = {};
    if (name !== (user.name ?? "")) body.name = name;
    if (email !== user.email) body.email = email;
    if (!isSelf && role !== user.role) body.role = role;

    if (Object.keys(body).length === 0) {
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const messages: Record<string, string> = {
        UNAUTHORIZED: "権限がありません",
        NO_COMPANY: "会社情報がありません",
        INVALID_INPUT: "入力内容が正しくありません",
        USER_NOT_FOUND: "ユーザーが見つかりません",
        CANNOT_CHANGE_OWN_ROLE: "自分自身のロールは変更できません",
        INSUFFICIENT_PERMISSION: "権限が足りません",
        UPDATE_FAILED: "更新に失敗しました",
      };
      toast.error(messages[data.error] ?? "エラーが発生しました");
      return;
    }

    toast.success("更新しました");
    router.refresh();
  }

  async function handleToggleActive() {
    setStatusLoading(true);

    const newStatus = !isActive;
    const res = await fetch(`/api/admin/users/${user.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newStatus }),
    });

    const data = await res.json();
    setStatusLoading(false);

    if (!res.ok) {
      const messages: Record<string, string> = {
        CANNOT_DEACTIVATE_SELF: "自分自身を無効化できません",
        UPDATE_FAILED: "更新に失敗しました",
      };
      toast.error(messages[data.error] ?? "エラーが発生しました");
      return;
    }

    toast.success(newStatus ? "ユーザーを有効化しました" : "ユーザーを無効化しました");
    setIsActive(newStatus);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">名前</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>ロール</Label>
          {isSelf ? (
            <p className="text-sm text-gray-500 py-2">
              {ROLE_LABEL[user.role] ?? user.role}（自分自身のロールは変更できません）
            </p>
          ) : (
            <Select
              value={role}
              onValueChange={(v) => setRole(v as Role)}
            >
              <SelectTrigger>
                <SelectValue>{ROLE_LABEL[role] ?? role}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {selectableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
                {!selectableRoles.includes(role) && (
                  <SelectItem value={role} disabled>
                    {ROLE_LABEL[role] ?? role}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "更新中..." : "保存する"}
        </Button>
      </form>

      {!isSelf && (
        <div className="border-t pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                アカウント状態：
                <span className={isActive ? "text-green-600" : "text-red-600"}>
                  {isActive ? "有効" : "無効"}
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isActive
                  ? "無効化するとログインできなくなります"
                  : "有効化するとログインできるようになります"}
              </p>
            </div>
            <Button
              type="button"
              variant={isActive ? "destructive" : "outline"}
              disabled={statusLoading}
              onClick={handleToggleActive}
            >
              {statusLoading ? "処理中..." : isActive ? "無効化" : "有効化"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
