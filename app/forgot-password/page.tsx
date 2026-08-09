import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "../../components/navbar/Navbar";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

export const metadata: Metadata = {
  title: "Forgot Password | fix-my-roads",
  description: "Reset your fix-my-roads password and regain access to your citizen report dashboard.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Password recovery</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Reset your account password</h1>
            <p className="mt-2 text-slate-400">Enter your email address and we’ll send instructions to restore access to your fix-my-roads account.</p>
          </div>
          <form className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
              <Input type="email" placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full">Send reset link</Button>
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
