import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import "dotenv/config";

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = getAuth();
const DEFAULT_PASSWORD = "Test1234!";

const users = [
  { email: "owner@platform.com",    displayName: "プラットフォームオーナー" },
  { email: "operator@platform.com", displayName: "プラットフォーム運営" },
  { email: "admin@company-a.com",   displayName: "管理者A" },
  { email: "manager@company-a.com", displayName: "マネージャーA" },
  { email: "auditor@company-a.com", displayName: "監査者A" },
  { email: "emp1@company-a.com",    displayName: "社員A-1" },
  { email: "emp2@company-a.com",    displayName: "社員A-2" },
  { email: "admin@company-b.com",   displayName: "管理者B" },
  { email: "emp1@company-b.com",    displayName: "社員B-1" },
];

async function main() {
  for (const user of users) {
    try {
      await auth.createUser({
        email: user.email,
        password: DEFAULT_PASSWORD,
        displayName: user.displayName,
      });
      console.log(`✅ 作成: ${user.email}`);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "auth/email-already-exists") {
        console.log(`⏭️  スキップ（既存）: ${user.email}`);
      } else {
        console.error(`❌ エラー: ${user.email}`, err);
      }
    }
  }
  console.log(`\n全アカウントのパスワード: ${DEFAULT_PASSWORD}`);
}

main();
