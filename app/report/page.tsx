import type { Metadata } from "next";
import { ReportIssueForm } from "../../components/report/ReportIssueForm";

export const metadata: Metadata = {
  title: "Report a Road Issue | fix-my-roads",
  description:
    "Report potholes, broken streetlights, water leaks, garbage problems, and other local infrastructure issues in your area.",
  keywords: [
    "report local road issue",
    "broken streetlight report",
    "pothole report",
    "water leak reporting",
    "local infrastructure issue form"
  ],
  alternates: {
    canonical: "https://fix-my-roads.netlify.app/report"
  },
  robots: {
    index: false,
    follow: true
  }
};

export default function ReportPage() {
  return <ReportIssueForm />;
}
