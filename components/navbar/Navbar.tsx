"use client";

import Link from "next/link";
import { Menu, Bell, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { useAuth } from "../AuthContext";

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Report", href: "/report" },
  { label: "My Reports", href: "/reports" }
];

export function Navbar() {
  const { user, adminMode, logout, adminLogout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-semibold text-white">
          Fix My Road
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-300 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-300 hover:bg-slate-800">
            <Bell className="h-5 w-5" />
          </button>
          {adminMode ? (
            <Button variant="ghost" className="hidden md:inline-flex" onClick={() => { adminLogout(); router.push("/"); }}>
              Admin logout <LogOut className="ml-2 h-4 w-4" />
            </Button>
          ) : user ? (
            <Button variant="ghost" className="hidden md:inline-flex" onClick={() => router.push("/profile")}> 
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          ) : (
            <Button variant="ghost" className="hidden md:inline-flex" onClick={() => router.push("/login")}>
              Login
            </Button>
          )}
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-300 hover:bg-slate-800 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
