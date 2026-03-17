"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      ログアウト
    </Button>
  );
}
