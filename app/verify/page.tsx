import type { Metadata } from "next";
import { VerifyIdentityForm } from "../../components/verification/VerifyIdentityForm";

export const metadata: Metadata = {
  title: "Verify Identity | fix-my-roads",
  description:
    "Complete your fix-my-roads identity verification to unlock report submission and dashboard access.",
  keywords: [
    "verify account",
    "road reporting identity check",
    "fix my road verification",
    "citizen report access"
  ],
  alternates: {
    canonical: "https://fix-my-roads.netlify.app/verify"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function VerifyPage() {
  return <VerifyIdentityForm />;
}
