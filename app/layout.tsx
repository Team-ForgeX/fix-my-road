import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fix My Road",
  description: "Civic issue reporting platform for streets, utilities, and public infrastructure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
