import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "../../components/auth/SignupForm";
import { Card } from "../../components/ui/Card";
import { Navbar } from "../../components/navbar/Navbar";

export const metadata: Metadata = {
  title: "Create Account | fix-my-roads",
  description:
    "Join fix-my-roads to report potholes, streetlight failures, water leaks, and other local civic issues in your community.",
  keywords: [
    "report road issues sign up",
    "join civic reporting platform",
    "municipal issue reporting account",
    "community road repair signup"
  ],
  alternates: {
    canonical: "https://fix-my-roads.netlify.app/signup"
  },
  robots: {
    index: false,
    follow: false
  }
};

function SignupFormSkeleton() {
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

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFormSkeleton />}>
      <SignupForm />
    </Suspense>
  );
}
