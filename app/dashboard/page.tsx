import type { Metadata } from "next";
import { DashboardOverview } from "../../components/dashboard/DashboardOverview";

export const metadata: Metadata = {
  title: "Dashboard | fix-my-roads",
  description:
    "Track your submitted roadside, streetlight, utility, and civic issue reports on your fix-my-roads dashboard.",
  keywords: [
    "issue dashboard",
    "track civic report status",
    "infrastructure problem dashboard",
    "report progress overview"
  ],
  alternates: {
    canonical: "https://fix-my-roads.netlify.app/dashboard"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
