"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function UserSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      const params = new URLSearchParams(searchParams.toString());
      if (newValue) {
        params.set("q", newValue);
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        value={value}
        onChange={handleChange}
        placeholder="名前・メールアドレスで検索"
        className="pl-9"
      />
    </div>
  );
}
