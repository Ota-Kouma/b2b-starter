import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NavMenuClient } from "./NavMenuClient";
import type { Role } from "@/lib/generated/prisma/enums";

const SERVICE_NAME = "Nexus";

const ROLE_LEVEL: Record<Role, number> = {
  PLATFORM_OWNER: 100,
  PLATFORM_OPERATOR: 80,
  COMPANY_ADMIN: 60,
  COMPANY_MANAGER: 40,
  COMPANY_AUDITOR: 20,
  EMPLOYEE: 10,
};

function getHomeUrl(role: Role): string {
  if (ROLE_LEVEL[role] >= 80) return "/platform";
  if (ROLE_LEVEL[role] >= 20) return "/admin";
  return "/dashboard";
}

export async function Navbar() {
  const session = await getSession();
  if (!session) return null;

  const homeUrl = getHomeUrl(session.role);

  const company = session.companyId
    ? await db.company.findUnique({ where: { id: session.companyId } })
    : null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={homeUrl}
            className="font-bold text-lg tracking-tight hover:opacity-75 transition-opacity shrink-0"
          >
            {SERVICE_NAME}
          </Link>
          {company && (
            <>
              <span className="text-gray-300 shrink-0">/</span>
              <span className="text-sm text-gray-600 truncate">{company.name}</span>
            </>
          )}
        </div>
        <NavMenuClient />
      </div>
    </header>
  );
}
