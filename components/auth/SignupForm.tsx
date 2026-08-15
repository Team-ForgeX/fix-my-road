"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, UserRound } from "lucide-react";
import { Navbar } from "../navbar/Navbar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { useAuth } from "../AuthContext";

export function SignupForm() {
  const router = useRouter();
  const { user, ready, signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    window.location.href = user.role === "admin" ? "/admin" : "/dashboard";
  }, [ready, user]);


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

  const validation = useMemo(() => ({
    passwordsMatch: password === confirmPassword,
    completed:
      fullName.trim() !== "" &&
      email.trim() !== "" &&
      phone.trim() !== "" &&
      password.trim() !== "" &&
      confirmPassword.trim() !== ""
  }), [confirmPassword, email, fullName, password, phone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!validation.completed || !validation.passwordsMatch) {
      setError("Please complete all fields and ensure passwords match.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signup({
        full_name: fullName,
        email,
        phone,
        password,
      });

      if (!result.success) {
        setError(result.error ?? "Unable to create account.");
        setIsLoading(false);
        return;
      }

      router.push("/verify");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailVerificationSent) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_30%),_linear-gradient(135deg,_#09111f_0%,_#0b1120_35%,_#111827_100%)] text-white">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-4xl items-center px-6 py-12 lg:px-8">
          <Card className="w-full space-y-8 p-8 sm:p-10">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Check your inbox</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Verify your email</h1>
              <p className="mt-3 text-slate-300">
                We&apos;ve sent a verification link to <strong className="text-white">{signupEmail}</strong>. Follow it to activate your account.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <p className="font-semibold text-white">Next step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Open the verification email</li>
                  <li>• Click the confirmation link</li>
                  <li>• Sign in and start reporting issues</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <p className="font-semibold text-white">Need help?</p>
                <p className="mt-3 text-sm text-slate-300">Check your spam folder or submit the form again if you did not receive the email.</p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setEmailVerificationSent(false);
                setFullName("");
                setEmail("");
                setPhone("");
                setPassword("");
                setConfirmPassword("");
                setAdminCode("");
                setError(null);
              }}
            >
              Back to signup
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_32%),_linear-gradient(135deg,_#0b1120_0%,_#0f172a_50%,_#111827_100%)] text-white">
      <Navbar />
      <main className="mx-auto grid min-h-[calc(100vh-96px)] max-w-6xl items-center gap-8 px-6 py-12 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <section className="hidden justify-center lg:flex">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 shadow-[0_35px_90px_rgba(16,185,129,0.18)] backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              <UserRound className="h-4 w-4" />
              Public access
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white">Create your citizen account.</h1>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Sign up to report potholes, streetlight failures, water leaks, and other civic issues in your area.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Submit reports with location and photos",
                "Track issue updates and repair progress",
                "Upgrade to admin later with your access code"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="w-full border border-white/10 bg-slate-900/70 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.75)] backdrop-blur-xl sm:p-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Join the network</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Create account</h2>
            <p className="mt-2 text-sm text-slate-400">Clients and admins use the same login flow after signup.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Full name</label>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Phone</label>
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Enter phone number"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-slate-500">A verification email will be sent here.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Confirm password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Admin access code (optional)</label>
              <Input
                type="password"
                value={adminCode}
                onChange={(event) => setAdminCode(event.target.value)}
                placeholder="Enter admin code to sign up as admin, or leave blank for client"
                disabled={isLoading}
              />
              <p className="mt-2 text-xs text-slate-500">If you have an admin code and enter it correctly, your account will be created as admin. Otherwise, it will be created as a regular client account.</p>
            </div>

            {!validation.passwordsMatch && confirmPassword && (
              <p className="text-sm text-rose-300">Passwords do not match.</p>
            )}

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading || !validation.completed}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/5 px-4 py-3 text-sm text-violet-100">
            <ShieldCheck className="h-4 w-4" />
            Become admin at signup with a code, or upgrade later from your profile.
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-300 hover:text-emerald-200">
              Sign in
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
