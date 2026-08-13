import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "../../components/auth/LoginForm";
import { Card } from "../../components/ui/Card";
import { Navbar } from "../../components/navbar/Navbar";

export const metadata: Metadata = {
  title: "Citizen Login | fix-my-roads",
  description:
    "Log in to fix-my-roads to submit road issues, track civic reports, and review the status of local infrastructure problems.",
  keywords: [
    "citizen login",
    "report road issue login",
    "municipal issue dashboard access",
    "fix my road sign in"
  ],
  alternates: {
    canonical: "https://fix-my-roads.netlify.app/login"
  },
  robots: {
    index: false,
    follow: false
  }
};

function LoginFormSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          <div className="h-40 animate-pulse bg-slate-800 rounded"></div>
        </Card>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
