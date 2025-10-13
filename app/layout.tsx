import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const rubik = Rubik({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Building in Public | Transparency",
  description: "Building one project every 2 days. Full transparency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={rubik.className}>
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
