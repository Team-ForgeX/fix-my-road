"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { Navbar } from "../../components/navbar/Navbar";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/callback?next=/profile`
    });

    if (error) {
      setStatus("error");
      setMessage(error.message || "Unable to send password reset email.");
    } else {
      setStatus("success");
      setMessage("If an account exists for this email, password reset instructions have been sent.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Password recovery</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Reset your account password</h1>
            <p className="mt-2 text-slate-400">Enter your registered email address and we’ll send instructions to restore access.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={status === "loading"}
              />
            </div>

            {message && (
              <p className={`text-sm ${status === "error" ? "text-rose-300" : "text-teal-300"}`}>
                {message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Sending reset link..." : "Send reset link"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Remembered your password?{' '}
            <Link href="/login" className="font-semibold text-teal-300 hover:text-teal-200">
              Sign in
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
