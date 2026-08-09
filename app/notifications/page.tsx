import type { Metadata } from "next";
import { Navbar } from "../../components/navbar/Navbar";
import { Card } from "../../components/ui/Card";

export const metadata: Metadata = {
  title: "Notifications | fix-my-roads",
  description: "See the latest notifications for your reports and account activity on fix-my-roads.",
};

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Notifications</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Recent activity and alerts</h1>
            <p className="mt-2 text-slate-400">This page provides a summary of your latest report updates, verification requests, and system messages.</p>
          </Card>
          <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-8 shadow-soft">
            <p className="text-sm text-slate-400">Notification support is coming soon. You can check this page for report progress updates and account alerts as they become available.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
