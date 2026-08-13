"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/verify");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <p className="text-slate-400">Redirecting to verification page...</p>
    </div>
  );
}
