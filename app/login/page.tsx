"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "../../components/navbar/Navbar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../components/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (user) {
      router.replace(user.verified ? "/dashboard" : "/verify");
    }
  }, [ready, router, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error ?? "Unable to sign in.");
      return;
    }
    if (result.needsVerification) {
      router.push("/verify");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Citizen login</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Access your reports and updates</h1>
            <p className="mt-2 text-slate-400">Sign in to submit a new issue, review pending reports, and track incident progress.</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
            </div>
            <div className="flex items-center justify-between gap-4 text-sm text-teal-300">
              <Link href="/forgot-password" className="hover:text-teal-200">
                Forgot password?
              </Link>
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <Button type="submit" className="w-full">Login</Button>
          </form>
          <p className="text-center text-sm text-slate-400">
            New to the platform?{' '}
            <Link href="/signup" className="font-semibold text-teal-300 hover:text-teal-200">
              Create an account
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
