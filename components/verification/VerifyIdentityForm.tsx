"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

export function VerifyIdentityForm() {
  const { user, ready, verifyIdentity } = useAuth();
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    } else if (user.verified) {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const result = await verifyIdentity(otp);
    if (result.success) {
      router.push("/dashboard");
      return;
    }
    setMessage(result.error ?? "Verification failed.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Identity verification</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Complete your mock identity check</h1>
            <p className="mt-2 text-slate-400">
              Use the sample verification code to confirm your account, then continue submitting reports without repeating this step.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Verification code</label>
              <Input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter 123456"
              />
            </div>
            {message ? <p className="text-sm text-rose-300">{message}</p> : null}
            <Button type="submit" className="w-full">
              Verify identity
            </Button>
          </form>

          <p className="text-sm text-slate-400">
            If you already completed verification, return to your <Link href="/dashboard" className="text-teal-300 hover:text-teal-200">dashboard</Link>.
          </p>
        </Card>
      </main>
    </div>
  );
}
