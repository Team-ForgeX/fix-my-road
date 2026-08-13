"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "../navbar/Navbar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { useAuth } from "../AuthContext";

type AuthMode = "user" | "admin";

const getModeFromParams = (searchParams: URLSearchParams): AuthMode =>
  searchParams.get("role") === "admin" ? "admin" : "user";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();
  const initialMode = useMemo(() => getModeFromParams(searchParams), [searchParams]);
  const [mode, setMode] = useState<AuthMode>(initialMode);
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
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setAdminCode("");
    const href = nextMode === "admin" ? "/signup?role=admin" : "/signup?role=user";
    router.replace(href);
  };

  const isAdminAccount = mode === "admin";

  const validation = useMemo(() => {
    return {
      passwordsMatch: password === confirmPassword,
      completed:
        fullName.trim() !== "" &&
        email.trim() !== "" &&
        phone.trim() !== "" &&
        password.trim() !== "" &&
        confirmPassword.trim() !== "" &&
        (!isAdminAccount || adminCode.trim() !== "")
    };
  }, [adminCode, confirmPassword, email, fullName, isAdminAccount, password, phone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!validation.completed || !validation.passwordsMatch) {
      setError(
        isAdminAccount
          ? "Please complete all fields, confirm the passwords, and enter the admin access code."
          : "Please complete all fields and ensure passwords match."
      );
      setIsLoading(false);
      return;
    }

    try {
      const result = await signup({
        full_name: fullName,
        email,
        phone,
        password,
        isAdmin: isAdminAccount,
        adminCode
      });

      if (!result.success) {
        setError(result.error ?? "Unable to create account.");
        setIsLoading(false);
        return;
      }

      if (result.needsEmailVerification) {
        setEmailVerificationSent(true);
        setSignupEmail(email);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.push("/verify");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailVerificationSent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
          <Card className="w-full space-y-8 p-10">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Verify your email</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Confirm your email address</h1>
              <p className="mt-2 text-slate-400">
                We&apos;ve sent a verification link to <strong>{signupEmail}</strong>. Please check your inbox and click the link to complete your signup.
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
              <p className="mb-4 text-sm text-slate-300">
                <strong>What&apos;s next?</strong>
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Check your email inbox for the verification message</li>
                <li>• Click the verification link in the email</li>
                <li>• Your account profile will be created automatically once verified</li>
                <li>• You can then log in and start reporting issues!</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
              <p className="mb-4 text-sm text-slate-300">
                <strong>Didn&apos;t receive an email?</strong>
              </p>
              <p className="mb-4 text-sm text-slate-400">
                Check your spam folder or try signing up again with a different email address.
              </p>
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
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          <div className="flex gap-4 border-b border-slate-700">
            <button
              type="button"
              onClick={() => switchMode("user")}
              className={`border-b-2 px-1 pb-3 text-sm font-medium uppercase tracking-[0.1em] transition ${
                mode === "user"
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => switchMode("admin")}
              className={`border-b-2 px-1 pb-3 text-sm font-medium uppercase tracking-[0.1em] transition ${
                mode === "admin"
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Admin
            </button>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
              {mode === "user" ? "Create user account" : "Create admin account"}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              {mode === "user" ? "Join the community reporting platform" : "Secure city operations access"}
            </h1>
            <p className="mt-2 text-slate-400">
              {mode === "user"
                ? "Sign up to submit issues, follow updates, and see incident progress in your area."
                : "Create a secure admin account to review reports and manage city maintenance workflows."}
            </p>
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

            {isAdminAccount && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Admin access code</label>
                <Input
                  type="password"
                  value={adminCode}
                  onChange={(event) => setAdminCode(event.target.value)}
                  placeholder="Enter admin access code"
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-slate-500">This code is required to create an admin account.</p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={mode === "user" ? "you@example.com" : "admin@fixmyroad.local"}
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-slate-500">We&apos;ll send a verification link to this email</p>
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

            {!validation.passwordsMatch && confirmPassword && (
              <p className="text-sm text-rose-300">Passwords do not match.</p>
            )}

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading || !validation.completed}>
              {isLoading ? "Creating account..." : mode === "user" ? "Create User Account" : "Create Admin Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href={mode === "user" ? "/login" : "/login?role=admin"} className="font-semibold text-teal-300 hover:text-teal-200">
              {mode === "user" ? "Sign in as User" : "Sign in as Admin"}
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
