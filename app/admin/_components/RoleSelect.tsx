"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  userId: string;
  currentRole: Role;
  sessionRole: Role;
};

export function RoleSelect({ userId, currentRole, sessionRole }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const selectableRoles = (
    ["COMPANY_ADMIN", "COMPANY_MANAGER", "COMPANY_AUDITOR", "EMPLOYEE"] as Role[]
  ).filter((r) => ROLE_LEVEL[r] < ROLE_LEVEL[sessionRole]);

  async function handleChange(value: string) {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: value }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Select
      value={currentRole}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-36 h-8 text-sm">
        <SelectValue>{ROLE_LABEL[currentRole] ?? currentRole}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {selectableRoles.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABEL[r]}
          </SelectItem>
        ))}
        {!selectableRoles.includes(currentRole) && (
          <SelectItem value={currentRole} disabled>
            {ROLE_LABEL[currentRole] ?? currentRole}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
