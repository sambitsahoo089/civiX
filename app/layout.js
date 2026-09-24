import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Logo, { LogoDefs } from "@/components/Logo";

const COPYRIGHT = "© 2026 sambitsahoo089. All rights reserved.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CiviX — Public Infrastructure Reporting",
  description:
    "Report potholes, broken streetlights, water leaks and emergencies like fires or accidents with geo-tagged photos, call the police / ambulance / fire brigade, and track every report to resolution.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900">
        <LogoDefs />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
            <div>
              <Logo size={30} showTagline className="max-w-[15rem]" />
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Civic issue reporting for citizens and municipal teams — geo-tagged photos,
                transparent status tracking and emergency dispatch.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              <p className="text-sm font-semibold text-slate-700">Quick links</p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  <Link href="/report" className="hover:text-emerald-700">
                    Report an issue
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="hover:text-emerald-700">
                    My reports
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-emerald-700">
                    Emergency help lines
                  </Link>
                </li>
              </ul>
            </div>
            <div className="text-xs text-slate-500">
              <p className="text-sm font-semibold text-slate-700">Project</p>
              <p className="mt-2">
                CiviX is a civic issue reporting platform for residents and municipal teams —
                geo-tagged photo proof, transparent status tracking and one-tap emergency dispatch.
              </p>
              <p className="mt-2">
                Built with Next.js, MongoDB and Auth.js, with a three.js city scene.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-slate-600">{COPYRIGHT}</p>
              <p>
                CiviX is an independent civic-tech project — not affiliated with any municipality.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
