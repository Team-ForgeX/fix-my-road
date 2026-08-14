import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-slate-950/80 px-6 py-10 text-white/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-violet-400">fix-my-roads</p>
          <p className="mt-3 max-w-xl text-sm text-white/50">
            A citizen-first platform for reporting potholes, garbage, water leaks, and streetlight outages. Use these links to navigate directly to the most important pages.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/signup" className="text-sm font-medium text-white/60 transition-colors duration-200 hover:text-violet-300">
            Sign up
          </Link>
          <Link href="/login" className="text-sm font-medium text-white/60 transition-colors duration-200 hover:text-violet-300">
            Login
          </Link>
          <Link href="/report" className="text-sm font-medium text-white/60 transition-colors duration-200 hover:text-violet-300">
            Report issue
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-white/60 transition-colors duration-200 hover:text-violet-300">
            Dashboard
          </Link>
          <Link href="/reports" className="text-sm font-medium text-white/60 transition-colors duration-200 hover:text-violet-300">
            Reports
          </Link>
          <Link href="/nearby" className="text-sm font-medium text-white/60 transition-colors duration-200 hover:text-violet-300">
            Nearby issues
          </Link>
          <Link href="/notifications" className="text-sm font-medium text-white/60 transition-colors duration-200 hover:text-violet-300">
            Notifications
          </Link>
          <Link href="/profile" className="text-sm font-medium text-white/60 transition-colors duration-200 hover:text-violet-300">
            Profile
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-white/[0.06] pt-6">
        <p className="text-center text-xs text-white/30">&copy; {new Date().getFullYear()} fix-my-roads. Built for communities.</p>
      </div>
    </footer>
  );
}
