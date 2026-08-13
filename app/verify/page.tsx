"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export default function VerifyPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState("Checking your email verification status...");

  const checkStatus = async () => {
    setChecking(true);
    setMessage("Checking your email verification status...");

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      setMessage(error?.message || "Please log in or sign up to verify your email address.");
      setChecking(false);
      return;
    }

    const user = data.user;
    const confirmed = Boolean(user.email_confirmed_at);
    setEmail(user.email ?? null);
    setIsVerified(confirmed);

    if (confirmed) {
      setMessage("Your email is verified! Setting up your profile...");

      // Ensure profile row exists in case SQL trigger didn't run
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        const fullName = user.user_metadata?.full_name || "User";
        const phone = user.user_metadata?.phone || null;
        await supabase.from("profiles").insert({
          id: user.id,
          full_name: fullName,
          phone: phone,
          role: "client"
        });
      }

      const userRole = profile?.role || "client";
      setMessage("Your account is ready! Redirecting...");
      setChecking(false);

      setTimeout(() => {
        if (userRole === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 1000);
      return;
    }

    setMessage("Your email is not confirmed yet. Please open the verification link sent to your inbox.");
    setChecking(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const resendVerification = async () => {
    if (!email) {
      const { data } = await supabase.auth.getUser();
      if (!data?.user?.email) {
        setMessage("We could not find your email. Please sign up again.");
        return;
      }
      setEmail(data.user.email);
    }

    const targetEmail = email;
    if (!targetEmail) return;

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail
    });

    if (resendError) {
      setMessage(resendError.message || "Unable to resend the verification email.");
      return;
    }

    setMessage(`A new verification email has been sent to ${targetEmail}. Please check your inbox.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Email verification</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              {isVerified ? "Email verified" : "Verify your email address"}
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
            <p className="text-slate-300">{message}</p>
            {email ? (
              <p className="mt-3 text-sm text-slate-400">Account email: {email}</p>
            ) : null}
          </div>

          {!isVerified && (
            <div className="space-y-4">
              <Button type="button" className="w-full" onClick={checkStatus} disabled={checking}>
                {checking ? "Checking..." : "Check verification status"}
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={resendVerification}>
                Resend verification email
              </Button>
            </div>
          )}

          {isVerified && (
            <Button type="button" className="w-full" onClick={() => router.push("/dashboard")}>
              Continue to dashboard
            </Button>
          )}
        </Card>
      </main>
    </div>
  );
}
