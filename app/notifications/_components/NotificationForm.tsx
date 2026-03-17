"use client";

import { useState } from "react";
import { toast } from "sonner";

type Props = {
  notifyInvite: boolean;
  notifySystem: boolean;
};

export function NotificationForm({ notifyInvite, notifySystem }: Props) {
  const [invite, setInvite] = useState(notifyInvite);
  const [system, setSystem] = useState(notifySystem);
  const [saving, setSaving] = useState<string | null>(null);

  async function update(field: "notifyInvite" | "notifySystem", value: boolean) {
    if (field === "notifyInvite") setInvite(value);
    else setSystem(value);

    setSaving(field);

    const res = await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    setSaving(null);
    if (!res.ok) {
      if (field === "notifyInvite") setInvite(!value);
      else setSystem(!value);
      toast.error("更新に失敗しました");
    } else {
      toast.success("通知設定を更新しました");
    }
  }

  return (
    <div className="space-y-4">
      <NotificationRow
        label="招待通知"
        description="ユーザーが招待されたときにメールで通知します"
        checked={invite}
        disabled={saving === "notifyInvite"}
        onChange={(v) => update("notifyInvite", v)}
      />
      <div className="border-t" />
      <NotificationRow
        label="システム通知"
        description="メンテナンスや重要なお知らせをメールで通知します"
        checked={system}
        disabled={saving === "notifySystem"}
        onChange={(v) => update("notifySystem", v)}
      />
    </div>
  );
}

function NotificationRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
          checked ? "bg-gray-900" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
