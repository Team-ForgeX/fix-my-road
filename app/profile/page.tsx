"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function ProfilePage() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">User profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{user.full_name}</h1>
            <p className="mt-2 text-slate-400">Manage your profile details, verification status, and report history.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="space-y-4 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Identity</p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p>{user.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Verification status</p>
                  <p className={user.verified ? "text-emerald-300" : "text-amber-300"}>
                    {user.verified ? "Verified" : "Pending verification"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Actions</p>
              <div className="space-y-4">
                {!user.verified ? (
                  <Button onClick={() => router.push("/verify")}>Complete verification</Button>
                ) : (
                  <p className="text-sm text-slate-400">You can submit issue reports at any time once verified.</p>
                )}
                <Button variant="secondary" onClick={() => { logout(); router.push("/"); }}>
                  Logout
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
