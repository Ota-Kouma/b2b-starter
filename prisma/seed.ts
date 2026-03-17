import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // 会社を2社作成
  const companyA = await db.company.upsert({
    where: { id: "company-a" },
    update: { name: "株式会社テックA" },
    create: { id: "company-a", name: "株式会社テックA" },
  });

  const companyB = await db.company.upsert({
    where: { id: "company-b" },
    update: { name: "有限会社サンプルB" },
    create: { id: "company-b", name: "有限会社サンプルB" },
  });

  // ユーザーを各ロールで作成
  const users = [
    // プラットフォーム側
    { email: "owner@platform.com",    name: "プラットフォームオーナー", role: "PLATFORM_OWNER",    companyId: null },
    { email: "operator@platform.com", name: "プラットフォーム運営",     role: "PLATFORM_OPERATOR", companyId: null },
    // 会社A
    { email: "admin@company-a.com",   name: "管理者A",   role: "COMPANY_ADMIN",   companyId: companyA.id },
    { email: "manager@company-a.com", name: "マネージャーA", role: "COMPANY_MANAGER", companyId: companyA.id },
    { email: "auditor@company-a.com", name: "監査者A",   role: "COMPANY_AUDITOR", companyId: companyA.id },
    { email: "emp1@company-a.com",    name: "社員A-1",   role: "EMPLOYEE",        companyId: companyA.id },
    { email: "emp2@company-a.com",    name: "社員A-2",   role: "EMPLOYEE",        companyId: companyA.id },
    // 会社B
    { email: "admin@company-b.com",   name: "管理者B",   role: "COMPANY_ADMIN",   companyId: companyB.id },
    { email: "emp1@company-b.com",    name: "社員B-1",   role: "EMPLOYEE",        companyId: companyB.id },
  ] as const;

  for (const user of users) {
    await db.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, companyId: user.companyId },
      create: { email: user.email, name: user.name, role: user.role, companyId: user.companyId },
    });
  }

  // admin@test.com をPLATFORM_OWNERに設定
  await db.user.update({
    where: { email: "admin@test.com" },
    data: { role: "PLATFORM_OWNER" },
  });

  console.log("✅ シードデータ投入完了");
  console.log(`  会社: ${companyA.name}, ${companyB.name}`);
  console.log(`  ユーザー: ${users.length}名 + admin@test.com`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
