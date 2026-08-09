import type { Metadata } from "next";
import { Navbar } from "../../components/navbar/Navbar";
import { Card } from "../../components/ui/Card";

export const metadata: Metadata = {
  title: "Nearby Issues | fix-my-roads",
  description: "Browse nearby reported infrastructure issues in your area and discover recent local incident reports.",
};

export default function NearbyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Nearby reports</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Reports near your location</h1>
            <p className="mt-2 text-slate-400">Discover recent issues reported nearby, including potholes, streetlight outages, and water leaks.</p>
          </Card>
          <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-8 shadow-soft">
            <p className="text-sm text-slate-400">The nearby issues page is a placeholder for upcoming location-aware issue discovery, helping citizens and teams track local problem spots.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
