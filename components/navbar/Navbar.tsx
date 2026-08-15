"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { useAuth } from "../AuthContext";

const citizenNavLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Report Issue", href: "/report" },
  { label: "My Reports", href: "/reports" },
  { label: "Nearby Issues", href: "/nearby" },
  { label: "Notifications", href: "/notifications" },
  { label: "Profile", href: "/profile" }
];

const adminNavLinks = [
  { label: "Admin Panel", href: "/admin" },
  { label: "All Reports", href: "/reports" },
  { label: "Nearby Issues", href: "/nearby" },
  { label: "Notifications", href: "/notifications" },
  { label: "Profile", href: "/profile" }
];

export function Navbar() {
  const { user, adminMode, logout, adminLogout, unreadNotificationCount } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = adminMode ? adminNavLinks : citizenNavLinks;

  const handleLogout = async () => {
    if (adminMode) {
      await adminLogout();
    } else {
      await logout();
    }
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-4 z-50 mx-auto max-w-[calc(100%-2rem)] md:max-w-7xl animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-slate-900/60 px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 font-semibold text-white transition hover:text-red-200">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-violet-500 text-sm font-black shadow-glow">
            F
          </span>
          <span className="text-lg tracking-tight">fix-my-roads</span>
        </Link>

        {/* Nav links — only shown when logged in */}
        {user && (
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
            <ul className="flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={[
                        "relative inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
                        "hover:bg-white/10 hover:text-white",
                        isActive
                          ? "bg-gradient-to-r from-red-500/20 via-violet-500/20 to-white/5 text-white shadow-[0_0_0_1px_rgba(168,85,247,0.35)] ring-1 ring-violet-400/40"
                          : "text-white/70"
                      ].join(" ")}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user && (
            <>
              <button
                onClick={() => router.push("/notifications")}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition hover:border-violet-400/70 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                {adminMode && (
                  <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </span>
                )}
                <Button
                  variant="ghost"
                  className="hidden md:inline-flex text-sm"
                  onClick={handleLogout}
                >
                  Logout
                  <LogOut className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {!user && (
            <Button variant="ghost" className="hidden md:inline-flex" onClick={() => router.push("/login")}>
              Login
            </Button>
          )}

          <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:border-violet-400/70 hover:text-white md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
