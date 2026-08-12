"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../components/AuthContext";

export default function ConfirmPage() {
  const router = useRouter();
  const { ready } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Get the session to check if email verification worked
        const { data, error } = await supabase.auth.getSession();

        if (error || !data?.session?.user) {
          // Session might not be available yet, try to get it from URL hash
          const hash = window.location.hash;
          if (hash.includes("type=email_confirmation")) {
            // Wait a moment for Supabase to process the confirmation
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const { data: newSession } = await supabase.auth.getSession();
            if (newSession?.session?.user && newSession.session.user.email_confirmed_at) {
              // Create profile
              await createUserProfile(newSession.session.user.id, newSession.session.user.user_metadata?.full_name || "User");
              setStatus("success");
              setMessage("Email verified successfully! Redirecting to identity verification...");
              setTimeout(() => {
                router.push("/verify");
              }, 2000);
              return;
            }
          }
          throw new Error("Email verification failed.");
        }

        if (data.session.user.email_confirmed_at) {
          // Create profile with data from user metadata or session
          const fullName = data.session.user.user_metadata?.full_name || "User";
          await createUserProfile(data.session.user.id, fullName);
          
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to identity verification...");
          setTimeout(() => {
            router.push("/verify");
          }, 2000);
        } else {
          throw new Error("Email not yet confirmed.");
        }
      } catch (err: any) {
        console.error("Confirmation error:", err);
        setStatus("error");
        setMessage("Email verification failed. Please try signing up again or contact support.");
      }
    };

    const createUserProfile = async (userId: string, fullName: string) => {
      try {
        const response = await fetch("/api/auth/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, fullName })
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          console.warn("Profile creation warning:", result.error);
          // Don't fail completely if profile creation has issues
          // User can still proceed to verify identity
        }
      } catch (err) {
        console.error("Profile creation error:", err);
        // Don't fail completely if profile creation fails
      }
    };

    if (ready) {
      handleConfirmation();
    }
  }, [ready, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12 lg:px-8">
        <Card className="w-full space-y-8 p-10">
          {status === "loading" && (
            <>
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Verifying email</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">Processing your confirmation</h1>
              </div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
              </div>
              <p className="text-center text-slate-400">Please wait...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Success</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">Email verified!</h1>
              </div>
              <p className="text-center text-slate-400">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-rose-300">Error</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">Verification failed</h1>
              </div>
              <p className="text-center text-slate-400">{message}</p>
              <Button
                type="button"
                className="w-full"
                onClick={() => router.push("/signup")}
              >
                Back to signup
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
