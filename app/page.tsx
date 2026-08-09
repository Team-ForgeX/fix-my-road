import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "../components/navbar/Navbar";
import { Button } from "../components/ui/Button";

const issueTypes = [
  "Garbage accumulation",
  "Potholes / damaged roads",
  "Water leakage",
  "Broken streetlights",
  "Drainage problems"
];

const stats = [
  { label: "Reports tracked", value: "3.2K" },
  { label: "Verified issues", value: "1.4K" },
  { label: "Cities engaged", value: "12" }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-500/10 px-4 py-2 text-sm text-teal-200">
              <Sparkles className="h-4 w-4" />
              Civic tech made practical for every citizen
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Report issues in your neighborhood, verify impact, and help resolve public infrastructure problems faster.
              </h1>
              <p className="max-w-2xl text-lg text-slate-400">
                Fix My Road helps citizens submit real-world reports for garbage, potholes, water leaks, and streetlight outages. The platform makes local infrastructure issue reporting simple, while tracking issue status and incident resolution.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/report">
                <Button size="lg">Report an Issue</Button>
              </Link>
              <Link href="/dashboard" className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm text-slate-200 transition hover:border-teal-400 hover:text-white">
                Explore dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/70 p-8 shadow-soft backdrop-blur-xl">
            <div className="space-y-5">
              <div className="rounded-[1.75rem] bg-slate-950/90 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">How it works</p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-300">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-white">Report</p>
                      <p className="text-sm text-slate-400">Submit the issue with location, description, and evidence for faster municipal response.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-300">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-white">Verify</p>
                      <p className="text-sm text-slate-400">The platform matches similar reports and checks the issue status.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-300">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-white">Resolve</p>
                      <p className="text-sm text-slate-400">Track progress until the incident is addressed by the right team.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {issueTypes.map((item) => (
                  <div key={item} className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5">
                    <p className="font-semibold text-white">{item}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 text-center">
                    <p className="text-3xl font-semibold text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-10 shadow-soft">
            <div className="flex items-center gap-4 text-teal-300">
              <MapPin className="h-5 w-5" />
              <span className="text-sm uppercase tracking-[0.3em]">Community impact</span>
            </div>
            <h2 className="mt-5 text-3xl font-semibold text-white">Make problems visible, not invisible.</h2>
            <p className="mt-4 max-w-2xl text-slate-400">
              Citizens can report issues quickly, and local administrators can act on confirmed incidents with more confidence. The platform emphasizes accountability, transparency, and measurable progress.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-3xl font-semibold text-white">80%</p>
                <p className="mt-2 text-sm text-slate-400">Faster issue visibility for teams</p>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-3xl font-semibold text-white">72K</p>
                <p className="mt-2 text-sm text-slate-400">Collective reports filed last quarter</p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-10 shadow-soft">
            <div className="flex items-center gap-3 text-teal-300">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm uppercase tracking-[0.3em]">Why it matters</span>
            </div>
            <ul className="mt-6 space-y-4 text-slate-400">
              <li>Improve responsiveness to local infrastructure failures.</li>
              <li>Keep every citizen report separate from consolidated incident tracking.</li>
              <li>Use evidence and location details to reduce duplicate work.</li>
            </ul>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-10 shadow-soft">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Explore fix-my-roads</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Quick links for every citizen report flow</h2>
              <p className="mt-4 max-w-2xl text-slate-400">
                Visit key pages directly to sign up, log in, submit a report, or view your dashboard. These internal links help search engines discover your site structure and make the platform easier to use.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/signup" className="rounded-3xl border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-300">Sign up</Link>
              <Link href="/login" className="rounded-3xl border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-300">Login</Link>
              <Link href="/report" className="rounded-3xl border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-300">Report an issue</Link>
              <Link href="/dashboard" className="rounded-3xl border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-300">Dashboard</Link>
              <Link href="/reports" className="rounded-3xl border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-300">Reports overview</Link>
              <Link href="/nearby" className="rounded-3xl border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-300">Nearby issues</Link>
              <Link href="/notifications" className="rounded-3xl border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-300">Notifications</Link>
              <Link href="/profile" className="rounded-3xl border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-300">Profile</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
