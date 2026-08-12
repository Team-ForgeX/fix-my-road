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
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");

  const validation = useMemo(() => {
    return {
      passwordsMatch: password === confirmPassword,
      completed: fullName.trim() !== "" && email.trim() !== "" && phone.trim() !== "" && password.trim() !== "" && confirmPassword.trim() !== ""
    };
  }, [confirmPassword, email, fullName, password, phone]);

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
      const result = await signup({ full_name: fullName, email, phone, password });
      
      if (!result.success) {
        setError(result.error ?? "Unable to create account.");
        setIsLoading(false);
        return;
      }

      // Email verification required
      if (result.needsEmailVerification) {
        setEmailVerificationSent(true);
        setSignupEmail(email);
        setError(null);
        setIsLoading(false);
        return;
      }

      // Success - redirect to verify page
      setIsLoading(false);
      router.push("/verify");
    } finally {
      setIsLoading(false);
    }
  };

  // Show email verification prompt
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
                We've sent a verification link to <strong>{signupEmail}</strong>. Please check your inbox and click the link to complete your signup.
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
              <p className="text-sm text-slate-300 mb-4">
                <strong>What's next?</strong>
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Check your email inbox for the verification message</li>
                <li>• Click the verification link in the email</li>
                <li>• You'll be redirected to verify your identity</li>
                <li>• After identity verification, you can start reporting issues!</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
              <p className="text-sm text-slate-300 mb-4">
                <strong>Didn't receive an email?</strong>
              </p>
              <p className="text-sm text-slate-400 mb-4">
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
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Create account</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Join the community reporting platform</h1>
            <p className="mt-2 text-slate-400">Sign up to submit issues, follow updates, and see incident progress in your area.</p>
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
                <p className="mt-2 text-xs text-slate-500">We'll send a verification link to this email</p>
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
                placeholder="Repeat password"
                disabled={isLoading}
              />
            </div>
            {!validation.passwordsMatch && confirmPassword.length > 0 ? (
              <p className="text-sm text-rose-300">Passwords do not match.</p>
            ) : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <Button 
              type="submit" 
              disabled={!validation.completed || !validation.passwordsMatch || isLoading} 
              className="w-full"
            >
              {isLoading ? "Creating account..." : "Create account"}
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
