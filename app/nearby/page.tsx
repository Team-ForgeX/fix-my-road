import type { Metadata } from "next";
import { Navbar } from "../../components/navbar/Navbar";
import { NearbyIssues } from "../../components/nearby/NearbyIssues";

export const metadata: Metadata = {
  title: "Nearby Issues in Your Area | fix-my-roads",
  description:
    "Find nearby potholes, streetlight outages, garbage accumulation, and water leaks in your local area. Browse active road and infrastructure issues by location.",
  keywords: [
    "nearby road issues",
    "local potholes",
    "streetlight outage near me",
    "water leak report",
    "garbage accumulation near me",
    "infrastructure incidents by area",
    "municipal issue tracker"
  ],
  alternates: {
    canonical: "https://fix-my-roads.netlify.app/nearby"
  },
  openGraph: {
    title: "Nearby road issues and local infrastructure reports",
    description:
      "Explore active civic issues near your selected location, including repaired and pending incidents across your community.",
    url: "https://fix-my-roads.netlify.app/nearby",
    type: "website",
    siteName: "fix-my-roads"
  },
  twitter: {
    card: "summary_large_image",
    title: "Nearby road issues in your area",
    description: "Browse local road defects, water leaks, garbage hotspots, and streetlight outages near your selected location."
  }
};

export default function NearbyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <NearbyIssues />
      </main>
    </div>
  );
}
