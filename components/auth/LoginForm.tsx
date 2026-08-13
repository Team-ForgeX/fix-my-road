"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "../navbar/Navbar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { useAuth } from "../AuthContext";

export function LoginForm() {
  const router = useRouter();
  const { user, ready, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;

    if (!user.verified) {
      router.replace("/verify");
      return;
    }

    router.replace(user.role === "admin" ? "/admin" : "/dashboard");
  }, [ready, router, user]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-96px)] items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md border border-white/10 bg-slate-900/70 p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.7)]">
            <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Loading</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Checking your session...</h2>
          </Card>
        </main>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-96px)] items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md border border-white/10 bg-slate-900/70 p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.7)]">
            <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Redirecting</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Opening your dashboard...</h2>
          </Card>
        </main>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error ?? "Unable to sign in.");
        setIsLoading(false);
        return;
      }

      if (result.user) {
        if (!result.user.verified) {
          router.replace("/verify");
        } else {
          router.replace(result.user.role === "admin" ? "/admin" : "/dashboard");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.25),_transparent_40%),_linear-gradient(135deg,_#0b1020_0%,_#09090b_45%,_#111827_100%)] text-white">
      <Navbar />
      <main className="mx-auto grid min-h-[calc(100vh-96px)] max-w-6xl items-center gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="hidden justify-center lg:flex">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(76,29,149,0.35)] backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
              <ShieldCheck className="h-4 w-4" />
              Secure access
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white">
              Sign in to keep street issues moving.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
              Track citizen reports, review repair status, and respond to city maintenance issues from one place.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Route reports to the right team faster",
                "Monitor status updates and verified incidents",
                "Access your dashboard based on your account role"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="w-full border border-white/10 bg-slate-900/70 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.7)] backdrop-blur-xl sm:p-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Welcome back</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Login to fix-my-roads</h2>
            <p className="mt-2 text-sm text-slate-400">Use the same login for clients and admins. Your role is detected automatically.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
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

            <div className="flex items-center justify-between gap-4 text-sm">
              <Link href="/forgot-password" className="font-medium text-violet-300 transition hover:text-violet-200">
                Forgot password?
              </Link>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Need an account? {" "}
            <Link href="/signup" className="font-semibold text-violet-300 hover:text-violet-200">
              Create one now
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
