"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, User, Bell, HelpCircle, FileText, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavMenu() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100 transition-colors outline-none">
        <Menu className="w-5 h-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem className="p-0">
          <Link href="/settings" className="flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer">
            <User className="w-4 h-4" />
            プロフィール
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <Link href="/notifications" className="flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer">
            <Bell className="w-4 h-4" />
            通知設定
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <Link href="/help" className="flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer">
            <HelpCircle className="w-4 h-4" />
            ヘルプ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <Link href="/terms" className="flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer">
            <FileText className="w-4 h-4" />
            利用規約
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 cursor-pointer focus:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
