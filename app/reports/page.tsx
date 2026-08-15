import type { Metadata } from "next";
import { ReportsPageContent } from "../../components/reports/ReportsPageContent";

export const metadata: Metadata = {
  title: "Reports | fix-my-roads",
  description: "View and filter civic issue reports with status, severity, and location details.",
  keywords: [
    "road reports",
    "local issue status tracking",
    "pothole report history",
    "civic issue report timeline"
  ],
  alternates: {
    canonical: "https://fix-my-roads.netlify.app/reports"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function ReportsPage() {
  return <ReportsPageContent />;
}
