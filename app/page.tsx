import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "../components/navbar/Navbar";
import { Button } from "../components/ui/Button";

export const metadata: Metadata = {
  title: "Fix road issues and report local infrastructure problems | fix-my-roads",
  description:
    "Report potholes, streetlight outages, water leaks, and garbage issues in your area with fix-my-roads. Track local civic problems and help improve neighborhood infrastructure.",
  keywords: [
    "report road issues",
    "pothole reporting",
    "streetlight outage reports",
    "water leak reporting",
    "local infrastructure issues",
    "municipal issue reporting"
  ],
  alternates: {
    canonical: "https://fix-my-roads.netlify.app/"
  },
  openGraph: {
    title: "Fix local road issues and report infrastructure problems",
    description:
      "Use fix-my-roads to report and track neighborhood road problems, utility issues, and city maintenance requests.",
    url: "https://fix-my-roads.netlify.app/",
    type: "website",
    siteName: "fix-my-roads"
  }
};

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
    <div className="min-h-screen bg-[#09090b] text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-100 shadow-glow">
              <Sparkles className="h-4 w-4 text-red-300" />
              Civic-tech designed for faster action
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Report road problems before they become bigger ones.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/70">
                Fix My Road helps communities report potholes, blocked drains, water leaks, garbage build-up, and broken streetlights with clarity, speed, and accountability.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/report">
                <Button size="lg">Report an Issue</Button>
              </Link>
              <Link href="/dashboard" className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-red-400/60 hover:text-white">
                Explore dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#101014]/80 p-6 shadow-soft backdrop-blur-xl">
            <div className="space-y-5">
              <div className="rounded-[1.5rem] bg-[#0b0b0d] p-6 ring-1 ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">How it works</p>
                <div className="mt-6 space-y-4">
                  {[
                    ["1", "Report", "Submit the issue with precise location, photos, and details so it reaches the right team quickly."],
                    ["2", "Verify", "The system checks similar reports and confirms the issue before it is escalated."],
                    ["3", "Resolve", "Track repair progress from report to action with transparent status updates."]
                  ].map(([step, title, description]) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-violet-500 text-sm font-bold text-white shadow-glow">
                        {step}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{title}</p>
                        <p className="text-sm leading-6 text-white/60">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {issueTypes.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium text-white">{item}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-[#0b0b0d] p-4 text-center">
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/45">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[2rem] border border-white/10 bg-[#111114]/80 p-8 shadow-soft">
            <div className="flex items-center gap-4 text-red-300">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em]">Community impact</span>
            </div>
            <h2 className="mt-5 text-3xl font-bold text-white">Make problems visible, not invisible.</h2>
            <p className="mt-4 max-w-2xl text-white/65">
              Citizens can report issues quickly, and local administrators can act on confirmed incidents with more confidence. The platform emphasizes accountability, transparency, and measurable progress.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-[#0b0b0d] p-6">
                <p className="text-3xl font-black text-white">80%</p>
                <p className="mt-2 text-sm text-white/60">Faster issue visibility for teams</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#0b0b0d] p-6">
                <p className="text-3xl font-black text-white">72K</p>
                <p className="mt-2 text-sm text-white/60">Collective reports filed last quarter</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111114]/80 p-8 shadow-soft">
            <div className="flex items-center gap-3 text-violet-300">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em]">Why it matters</span>
            </div>
            <ul className="mt-6 space-y-4 text-white/65">
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-red-500 to-violet-500" /> Improve responsiveness to local infrastructure failures.</li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-red-500 to-violet-500" /> Keep every citizen report separate from consolidated incident tracking.</li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-red-500 to-violet-500" /> Use evidence and location details to reduce duplicate work.</li>
            </ul>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-white/10 bg-[#111114]/80 p-8 shadow-soft">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300">Explore fix-my-roads</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Quick links for every citizen report flow</h2>
              <p className="mt-4 max-w-2xl text-white/65">
                Visit key pages directly to sign up, log in, submit a report, or view your dashboard. These internal links help search engines discover your site structure and make the platform easier to use.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/signup" className="rounded-2xl border border-white/10 bg-[#0b0b0d] px-5 py-4 text-sm font-semibold text-white transition hover:border-red-400/60 hover:text-red-100">Sign up</Link>
              <Link href="/login" className="rounded-2xl border border-white/10 bg-[#0b0b0d] px-5 py-4 text-sm font-semibold text-white transition hover:border-red-400/60 hover:text-red-100">Login</Link>
              <Link href="/report" className="rounded-2xl border border-white/10 bg-[#0b0b0d] px-5 py-4 text-sm font-semibold text-white transition hover:border-red-400/60 hover:text-red-100">Report an issue</Link>
              <Link href="/dashboard" className="rounded-2xl border border-white/10 bg-[#0b0b0d] px-5 py-4 text-sm font-semibold text-white transition hover:border-red-400/60 hover:text-red-100">Dashboard</Link>
              <Link href="/reports" className="rounded-2xl border border-white/10 bg-[#0b0b0d] px-5 py-4 text-sm font-semibold text-white transition hover:border-red-400/60 hover:text-red-100">Reports overview</Link>
              <Link href="/nearby" className="rounded-2xl border border-white/10 bg-[#0b0b0d] px-5 py-4 text-sm font-semibold text-white transition hover:border-red-400/60 hover:text-red-100">Nearby issues</Link>
              <Link href="/notifications" className="rounded-2xl border border-white/10 bg-[#0b0b0d] px-5 py-4 text-sm font-semibold text-white transition hover:border-red-400/60 hover:text-red-100">Notifications</Link>
              <Link href="/profile" className="rounded-2xl border border-white/10 bg-[#0b0b0d] px-5 py-4 text-sm font-semibold text-white transition hover:border-red-400/60 hover:text-red-100">Profile</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
