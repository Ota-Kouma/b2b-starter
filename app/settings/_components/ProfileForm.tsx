"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/fetch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  name: string | null;
  email: string;
  roleLabel: string;
};

export function ProfileForm({ name, email, roleLabel }: Props) {
  const router = useRouter();
  const [nameValue, setNameValue] = useState(name ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nameValue === (name ?? "")) return;
    setLoading(true);

    const res = await apiFetch("/api/user/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameValue }),
    });

    setLoading(false);
    if (!res.ok) {
      toast.error("更新に失敗しました");
      return;
    }
    toast.success("プロフィールを更新しました");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">名前</Label>
        <Input
          id="name"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          placeholder="名前を入力"
        />
      </div>

      <div className="space-y-1.5">
        <Label>メールアドレス</Label>
        <Input value={email} disabled className="bg-gray-50 text-gray-500" />
        <p className="text-xs text-gray-400">メールアドレスの変更は管理者にお問い合わせください</p>
      </div>

      <div className="space-y-1.5">
        <Label>ロール</Label>
        <Input value={roleLabel} disabled className="bg-gray-50 text-gray-500" />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}
