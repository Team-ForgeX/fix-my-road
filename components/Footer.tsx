import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 px-6 py-10 text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">fix-my-roads</p>
          <p className="mt-3 max-w-xl text-sm text-slate-400">
            A citizen-first platform for reporting potholes, garbage, water leaks, and streetlight outages. Use these links to navigate directly to the most important pages.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/signup" className="text-sm font-semibold text-slate-200 hover:text-teal-300">
            Sign up
          </Link>
          <Link href="/login" className="text-sm font-semibold text-slate-200 hover:text-teal-300">
            Login
          </Link>
          <Link href="/report" className="text-sm font-semibold text-slate-200 hover:text-teal-300">
            Report issue
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-slate-200 hover:text-teal-300">
            Dashboard
          </Link>
          <Link href="/reports" className="text-sm font-semibold text-slate-200 hover:text-teal-300">
            Reports
          </Link>
          <Link href="/profile" className="text-sm font-semibold text-slate-200 hover:text-teal-300">
            Profile
          </Link>
        </div>
      </div>
    </footer>
  );
}
