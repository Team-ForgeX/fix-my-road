import type { Metadata } from "next";
import { SignupForm } from "../../components/auth/SignupForm";

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

export default function SignupPage() {
  return <SignupForm />;
}
