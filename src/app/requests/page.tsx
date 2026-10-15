"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RequestsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chats?tab=requests");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
      Redirecting to Requests in Chats...
    </div>
  );
}
