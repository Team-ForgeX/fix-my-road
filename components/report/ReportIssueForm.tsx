"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../navbar/Navbar";
import { ReportForm } from "./ReportForm";
import { Card } from "../ui/Card";
import { useAuth } from "../AuthContext";


export function ReportIssueForm() {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    } else if (!user.verified) {
      router.replace("/verify");
    }
  }, [ready, router, user]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-96px)] items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md border border-white/10 bg-slate-900/70 p-8 text-center shadow-soft">
            <p className="text-sm uppercase tracking-[0.35em] text-teal-300">Loading</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Checking your session...</h2>
          </Card>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-md items-center justify-center px-6 py-12">
          <Card className="w-full border border-white/10 bg-slate-900/70 p-8 text-center shadow-soft">
            <p className="text-sm uppercase tracking-[0.35em] text-teal-300">Redirecting</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Please sign in to report an issue...</h2>
          </Card>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Report an issue</p>
            <h1 className="text-3xl font-semibold text-white">Submit a new civic issue in your locality</h1>
            <p className="max-w-2xl text-slate-400">
              Use the form below to describe the problem, upload evidence, and share the location details so the right teams can respond.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <ReportForm />
        </div>
      </main>
    </div>
  );
}
