import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/AuthContext";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://fix-my-roads.netlify.app"),
  title: "fix-my-roads | Fix road issues, report potholes, and improve local road repair",
  description:
    "fix-my-roads helps citizens report road issues like potholes, garbage, streetlight outages, and water leaks. Learn how to fix road problems in your area, submit local issue reports, and track resolution progress.",
  keywords: [
    "fix road",
    "road issues",
    "how to fix road",
    "pothole reporting",
    "road repair",
    "infrastructure issue reporting",
    "streetlight outage",
    "water leak reporting",
    "local road maintenance"
  ],
  applicationName: "fix-my-roads",
  openGraph: {
    title: "fix-my-roads | Fix road issues and report local infrastructure problems",
    description:
      "Use fix-my-roads to report road issues, potholes, streetlight outages, and water leaks in your neighborhood. Track fixes and make local road repair more visible.",
    type: "website",
    siteName: "fix-my-roads"
  },
  twitter: {
    card: "summary_large_image",
    title: "fix-my-roads | Fix road issues and report local problems",
    description:
      "Report road issues, potholes, and damaged infrastructure with fix-my-roads, and follow the progress of local repairs.",
    creator: "@fix-my-roads"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="relative min-h-screen bg-slate-950 text-white antialiased selection:bg-violet-500/30">
        <div className="fixed inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
        <AuthProvider>
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

