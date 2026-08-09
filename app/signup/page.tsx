"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Navbar } from "../../components/navbar/Navbar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../components/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { user, ready, signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validation = useMemo(() => {
    return {
      passwordsMatch: password === confirmPassword,
      completed: fullName.trim() !== "" && email.trim() !== "" && phone.trim() !== "" && password.trim() !== "" && confirmPassword.trim() !== ""
    };
  }, [confirmPassword, email, fullName, password, phone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!validation.completed || !validation.passwordsMatch) {
      setError("Please complete all fields and ensure passwords match.");
      return;
    }
    const result = await signup({ full_name: fullName, email, phone, password });
    if (!result.success) {
      setError(result.error ?? "Unable to create account.");
      return;
    }
    router.push("/verify");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Create account</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Join the community reporting platform</h1>
            <p className="mt-2 text-slate-400">Sign up to submit issues, follow updates, and see incident progress in your area.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Full name</label>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Phone</label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter phone number" />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Confirm password</label>
              <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" />
            </div>
            {!validation.passwordsMatch && confirmPassword.length > 0 ? (
              <p className="text-sm text-rose-300">Passwords do not match.</p>
            ) : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <Button type="submit" disabled={!validation.completed || !validation.passwordsMatch} className="w-full">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-teal-300 hover:text-teal-200">
              Sign in
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
