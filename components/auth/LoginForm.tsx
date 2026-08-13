"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "../navbar/Navbar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { useAuth } from "../AuthContext";

type LoginMode = "citizen" | "admin";

export function LoginForm() {
  const router = useRouter();
  const { user, ready, login, adminLogin } = useAuth();
  const [mode, setMode] = useState<LoginMode>("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) return;

    if (!user.verified) {
      router.replace("/verify");
      return;
    }

    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }

    router.replace("/dashboard");
  }, [ready, router, user]);

  const handleCitizenSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error ?? "Unable to sign in.");
        return;
      }
      if (result.needsVerification) {
        router.push("/verify");
        return;
      }

      if (result.user?.role === "admin") {
        router.push("/admin");
        return;
      }

      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!adminCode.trim()) {
        setError("Admin access code is required.");
        return;
      }

      const result = await adminLogin(email, password, adminCode);
      if (!result.success) {
        setError(result.error ?? "Unable to sign in as admin.");
        return;
      }

      router.push("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          <div className="flex gap-4 border-b border-slate-700">
            <button
              onClick={() => {
                setMode("citizen");
                setError(null);
                setAdminCode("");
              }}
              className={`pb-3 px-1 font-medium text-sm uppercase tracking-[0.1em] border-b-2 transition ${
                mode === "citizen"
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Citizen Login
            </button>
            <button
              onClick={() => {
                setMode("admin");
                setError(null);
              }}
              className={`pb-3 px-1 font-medium text-sm uppercase tracking-[0.1em] border-b-2 transition ${
                mode === "admin"
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Admin Login
            </button>
          </div>

          {mode === "citizen" && (
            <>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Citizen login</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">Access your reports and updates</h1>
                <p className="mt-2 text-slate-400">Sign in to submit a new issue, review pending reports, and track incident progress.</p>
              </div>
              <form className="space-y-6" onSubmit={handleCitizenSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-teal-300">
                  <Link href="/forgot-password" className="hover:text-teal-200">
                    Forgot password?
                  </Link>
                </div>
                {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Login"}
                </Button>
              </form>
              <p className="text-center text-sm text-slate-400">
                New to the platform?{' '}
                <Link href="/signup" className="font-semibold text-teal-300 hover:text-teal-200">
                  Create an account
                </Link>
              </p>
            </>
          )}

          {mode === "admin" && (
            <>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Admin login</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">City operations dashboard</h1>
                <p className="mt-2 text-slate-400">Sign in with your admin credentials and access code to manage reports and incidents.</p>
              </div>
              <form className="space-y-6" onSubmit={handleAdminSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@fixmyroad.local"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Admin Access Code</label>
                  <Input
                    type="password"
                    value={adminCode}
                    onChange={(event) => setAdminCode(event.target.value)}
                    placeholder="Enter admin access code"
                    disabled={isLoading}
                  />
                  <p className="mt-2 text-xs text-slate-500">Contact your administrator for the admin access code.</p>
                </div>
                {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Admin Login"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
