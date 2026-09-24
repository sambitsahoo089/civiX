import Link from "next/link";
import { auth } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { HELPLINE_PHONE, SERVICES } from "@/lib/services";
import Hero3D from "@/components/Hero3D";
import { AlertIcon, SirenIcon } from "@/components/ServiceIcons";

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const ctaHref = user ? (user.role === "AUTHORITY" ? "/admin" : "/report") : "/register";

  const civic = Object.entries(CATEGORIES).filter(([, meta]) => !meta.emergency);
  const emergency = Object.entries(CATEGORIES).filter(([, meta]) => meta.emergency);

  return (
    <div>
      {/* Hero with the 3D city model */}
      <section className="hero-wash relative overflow-hidden text-white">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Geo-tagged reporting · real-time tracking
            </span>

            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Report civic issues,{" "}
              <span className="gradient-text">alert the right service</span>, track them to
              resolution
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-emerald-50/80 sm:text-lg">
              Potholes, broken streetlights, water leaks — or a fire, collision or medical
              emergency. Snap a photo, pin the location, dial the helpline in one tap, and follow
              every step until it is fixed.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={ctaHref}
                className="tap inline-flex items-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/30 transition-transform hover:scale-[1.03] hover:bg-emerald-400"
              >
                {user ? (user.role === "AUTHORITY" ? "Open dashboard" : "Report an issue") : "Get started"}
              </Link>
              <Link
                href={user ? "/reports" : "/login"}
                className="tap inline-flex items-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                {user ? "My reports" : "Sign in"}
              </Link>
              <Link
                href="/help"
                className="tap inline-flex items-center gap-2 rounded-full bg-red-500/15 px-5 py-3 text-sm font-semibold text-red-100 ring-1 ring-red-400/40 backdrop-blur transition-colors hover:bg-red-500/25"
              >
                <SirenIcon className="h-4 w-4" />
                Emergency help
              </Link>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6 text-emerald-50/80">
              <div>
                <dt className="text-xs">Average first response</dt>
                <dd className="mt-1 text-xl font-bold text-white">under 24h</dd>
              </div>
              <div>
                <dt className="text-xs">Emergency helpline</dt>
                <dd className="mt-1 text-xl font-bold text-white">{HELPLINE_PHONE}</dd>
              </div>
              <div>
                <dt className="text-xs">Services wired in</dt>
                <dd className="mt-1 text-xl font-bold text-white">Police · Ambulance · Fire</dd>
              </div>
            </dl>
          </div>

          {/* 3D model */}
          <div className="animate-rise-slow">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1 shadow-2xl shadow-black/40 backdrop-blur">
              <Hero3D className="h-[300px] w-full rounded-[20px] sm:h-[380px] lg:h-[440px]" />
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2 text-[11px] font-medium text-emerald-50/80">
                <span className="rounded-full bg-black/35 px-2.5 py-1 ring-1 ring-white/15">
                  Live 3D block — drag to orbit
                </span>
                <span className="rounded-full bg-red-500/25 px-2.5 py-1 text-red-100 ring-1 ring-red-400/30">
                  Issue marker
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency band */}
      <section className="emergency-stripe border-y border-red-500/30 bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500/25 text-red-100 ring-1 ring-red-400/40">
              <span className="absolute inset-0 animate-siren rounded-xl bg-red-400/30" />
              <AlertIcon className="relative h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Fire, accident or medical emergency?</p>
              <p className="text-sm text-rose-100/80">
                Report it and dial the police, ambulance or fire brigade straight from the app —
                the call shows in your call log and the authority is told immediately.
              </p>
            </div>
          </div>
          <Link
            href="/report"
            className="tap inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-red-700 shadow-lg transition-transform hover:scale-[1.03]"
          >
            <SirenIcon className="h-4 w-4" />
            Report an emergency
          </Link>
        </div>
      </section>

      {/* Emergency categories */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">Emergency reporting with one-tap calls</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          These categories unlock direct call buttons for the relevant services. If you have
          already informed a service, the authority sees it — no duplicate dispatch.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {emergency.map(([key, meta]) => (
            <div
              key={key}
              className="card-lift relative overflow-hidden rounded-2xl border border-red-200 bg-white p-5"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.gradient}`}
                aria-hidden="true"
              />
              <div className="flex items-center justify-between">
                <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${meta.color}`}>
                  {meta.emoji}
                </span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                  Emergency
                </span>
              </div>
              <h3 className="mt-3 font-semibold">{meta.label}</h3>
              <p className="mt-1 text-sm text-slate-600">{meta.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {meta.services.map((service) => (
                  <span
                    key={service}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SERVICES[service].chipLight}`}
                  >
                    {SERVICES[service].emoji} {SERVICES[service].label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Civic categories */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <h2 className="text-center text-2xl font-bold">What else can you report?</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {civic.map(([key, meta]) => (
              <div
                key={key}
                className="card-lift flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-2xl ${meta.gradient}`}
                >
                  {meta.emoji}
                </span>
                <span className="text-sm font-semibold">{meta.label}</span>
                <span className="text-xs text-slate-500">{meta.blurb}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "1",
              title: "Report",
              text: "Describe the issue, add a photo and pin the exact location from your phone.",
            },
            {
              step: "2",
              title: "Alert if urgent",
              text: "Emergency categories give one-tap call buttons for police, ambulance or fire brigade.",
            },
            {
              step: "3",
              title: "Authorities respond",
              text: "The municipality acknowledges the report, dispatches crews and updates the status.",
            },
            {
              step: "4",
              title: "Track to resolution",
              text: "Follow the timeline until the issue is marked resolved — with proof of the fix.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="card-lift rounded-2xl border border-slate-200 bg-white p-6"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-sm font-bold text-white">
                {item.step}
              </span>
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
