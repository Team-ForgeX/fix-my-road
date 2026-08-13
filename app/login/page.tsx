import type { Metadata } from "next";
import { LoginForm } from "../../components/auth/LoginForm";

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

export default function LoginPage() {
  return <LoginForm />;
}
