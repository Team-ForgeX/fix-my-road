"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Navbar } from "../../components/navbar/Navbar";

export default function ProfilePage() {
  const { user, ready, logout, elevateToAdmin, demoteToClient } = useAuth();
  const router = useRouter();
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showElevateForm, setShowElevateForm] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  const handleElevateToAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await elevateToAdmin(adminCode);
      if (!result.success) {
        setError(result.error ?? "Could not elevate to admin.");
        return;
      }
      setAdminCode("");
      setShowElevateForm(false);
      router.push("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngradeToClient = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await demoteToClient();
      if (!result.success) {
        setError(result.error ?? "Could not switch account to client.");
        return;
      }
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || !user) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
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
                <div>
                  <p className="text-sm text-slate-500">Account type</p>
                  <p className={user.role === "admin" ? "text-rose-300 font-semibold" : "text-teal-300"}>
                    {user.role === "admin" ? "Admin" : "Client"}
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
                  <>
                    <p className="text-sm text-emerald-300">✓ Email verified. You can submit reports.</p>
                    {user.role === "admin" ? (
                      <Button
                        variant="secondary"
                        onClick={handleDowngradeToClient}
                        disabled={isLoading}
                      >
                        {isLoading ? "Switching..." : "Switch to Client"}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => setShowElevateForm(!showElevateForm)}
                      >
                        {showElevateForm ? "Cancel" : "Upgrade to Admin"}
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                >
                  Logout
                </Button>
              </div>
            </Card>
          </div>

          {showElevateForm && user.role !== "admin" && (
            <Card className="space-y-6 p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Upgrade account</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Become an Admin</h2>
                <p className="mt-2 text-slate-400">Enter your admin access code to upgrade your account to admin privileges. This grants you access to the city operations dashboard.</p>
              </div>

              <form className="space-y-6" onSubmit={handleElevateToAdmin}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Admin access code</label>
                  <Input
                    type="password"
                    value={adminCode}
                    onChange={(event) => setAdminCode(event.target.value)}
                    placeholder="Enter your admin access code"
                    disabled={isLoading}
                  />
                  <p className="mt-2 text-xs text-slate-500">Contact your administrator for the access code.</p>
                </div>

                {error ? <p className="text-sm text-rose-300">{error}</p> : null}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading || !adminCode.trim()}
                  >
                    {isLoading ? "Verifying..." : "Upgrade to Admin"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      setShowElevateForm(false);
                      setAdminCode("");
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
