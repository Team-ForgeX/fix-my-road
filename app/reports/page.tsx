import { Navbar } from "../../components/navbar/Navbar";
import { ReportCard } from "../../components/report/ReportCard";
import { reports } from "../../lib/mockData";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">My reports</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">All reports you submitted</h1>
            <p className="mt-2 text-slate-400">Review any report, see its current status, and open the details.</p>
          </div>
          <div className="grid gap-5">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
