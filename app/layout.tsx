import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/AuthContext";

export const metadata: Metadata = {
  title: "Fix My Road | Citizen issue reporting platform",
  description:
    "Fix My Road helps citizens report local infrastructure problems like potholes, garbage, streetlight outages, and water leaks. Track issue resolution and improve public accountability.",
  keywords: [
    "civic issue reporting",
    "pothole reporting",
    "streetlight outage",
    "garbage collection problems",
    "water leak reporting",
    "public infrastructure maintenance",
    "local government accountability",
    "community issue tracker",
    "citizen reporting platform"
  ],
  applicationName: "Fix My Road",
  openGraph: {
    title: "Fix My Road | Report local infrastructure issues",
    description:
      "Fix My Road helps citizens report potholes, garbage, water leaks and other public infrastructure problems, then track resolution progress.",
    type: "website",
    siteName: "Fix My Road"
  },
  twitter: {
    card: "summary_large_image",
    title: "Fix My Road | Report local infrastructure issues",
    description:
      "Submit and track community reports for potholes, streetlight failures, garbage, and other municipal issues.",
    creator: "@FixMyRoad"
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
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
