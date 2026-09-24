"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import { CheckIcon } from "@/components/ServiceIcons";

const FEATURES = [
  {
    title: "Geo-tagged photo proof",
    text: "Snap the damage — the exact coordinates and address travel with it.",
    accent: "bg-sky-50 text-sky-600 ring-sky-200",
  },
  {
    title: "One-tap emergency calls",
    text: "Police, ambulance or fire brigade, dialled straight into your call log.",
    accent: "bg-red-50 text-red-600 ring-red-200",
  },
  {
    title: "Track to resolution",
    text: "A live timeline from reported to acknowledged to fixed.",
    accent: "bg-violet-50 text-violet-600 ring-violet-200",
  },
  {
    title: "Authority dashboard",
    text: "Prioritised queues, KPIs and helpline dispatch in one place.",
    accent: "bg-amber-50 text-amber-700 ring-amber-200",
  },
];

const STATS = [
  { label: "Serving since", value: "2026" },
  { label: "Services wired in", value: "3" },
  { label: "Report categories", value: "9" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setBusy(false);
      return;
    }

    const session = await fetch("/api/auth/session").then((r) => r.json());
    router.push(session?.user?.role === "AUTHORITY" ? "/admin" : "/reports");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14 lg:py-20">
      <div className="grid items-start gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-12">
        {/* About CiviX.
            Phones: rendered first, so the project description leads and the sign-in form follows.
            Tablet / laptop / PC (md+): stays in the left column, form on the right. */}
        <section>
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-orange-400/12 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl"
            />

            <div className="relative">
              <Logo size={42} showTagline className="max-w-[19rem]" />

              <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Report a civic issue.
                <br className="hidden sm:block" /> Watch it get fixed.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
                CiviX lets residents report potholes, broken streetlights, water leaks, damaged
                footpaths and open drains with a geo-tagged photo — then follow every step until
                the municipality closes it. For a fire, road accident or medical emergency, one
                tap dials the right helpline and the authority is told which service you already
                informed.
              </p>

              <ul className="mt-6 space-y-3.5">
                {FEATURES.map((feature) => (
                  <li key={feature.title} className="flex gap-3">
                    <span
                      className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ${feature.accent}`}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800">
                        {feature.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                        {feature.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-7 grid grid-cols-3 gap-3 border-t border-slate-200 pt-5">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-slate-900 sm:text-base">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Sign-in card */}
        <section className="w-full md:max-w-md md:justify-self-end">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back. Track your reports or manage civic issues.
            </p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              New here?{" "}
              <Link href="/register" className="font-medium text-emerald-700 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
