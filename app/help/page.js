import Link from "next/link";
import { HELPLINE_EMAIL, HELPLINE_PHONE, SERVICES } from "@/lib/services";
import { CATEGORIES } from "@/lib/categories";
import { MailIcon, PhoneIcon, ServiceIcon, SirenIcon } from "@/components/ServiceIcons";

export const metadata = { title: "Emergency help lines — CiviX" };

export default function HelpPage() {
  const emergencyCategories = Object.entries(CATEGORIES).filter(([, meta]) => meta.emergency);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <div className="overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-red-950 via-rose-950 to-slate-950 px-5 py-8 text-white shadow-xl sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-100 ring-1 ring-red-400/40">
          <SirenIcon className="h-4 w-4" />
          Emergency helplines
        </span>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
          Call for help first — then report it here
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-rose-100/85">
          If someone is in danger, call the helpline below immediately. Reporting the issue in
          CiviX as well gives the municipal authority the photo, location and full details, and
          they will see which service you already informed.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {Object.values(SERVICES).map((service) => (
            <a
              key={service.key}
              href={`tel:${service.phone}`}
              className="tap flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/15 transition-colors hover:bg-white/10"
            >
              <span className="flex items-center gap-3">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl text-white ring-1 ${service.ring} ${service.solid}`}
                >
                  <ServiceIcon service={service.key} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{service.label}</span>
                  <span className="block text-[11px] text-white/60">{service.role}</span>
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <PhoneIcon className="h-4 w-4" />
                Call
              </span>
            </a>
          ))}
        </div>

        <dl className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-rose-200/70">Helpline number</dt>
            <dd className="mt-0.5 font-bold tracking-wide">{HELPLINE_PHONE}</dd>
          </div>
          <div>
            <dt className="text-xs text-rose-200/70">Helpline email</dt>
            <dd className="mt-0.5 flex items-center gap-2 break-all font-medium">
              <MailIcon className="h-4 w-4 shrink-0" />
              <a href={`mailto:${HELPLINE_EMAIL}`} className="hover:underline">
                {HELPLINE_EMAIL}
              </a>
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-rose-200/60">
          Phase 1 routes all three services to the shared control-room helpline above; the real
          control-room numbers can be configured per service without any UI change.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Which reports reach a helpline?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {emergencyCategories.map(([key, meta]) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${meta.color}`}>
                {meta.emoji}
              </span>
              <h3 className="mt-3 font-semibold">{meta.label}</h3>
              <p className="mt-1 text-xs text-slate-600">
                Alerts {meta.services.map((s) => SERVICES[s].label).join(", ")}.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">How the hand-off works</h3>
          <ol className="mt-3 space-y-3 text-sm text-slate-600">
            <li>
              <strong className="text-slate-800">1. Citizen calls.</strong> Tapping a service button
              dials the helpline from the phone, so the call is recorded in the call log.
            </li>
            <li>
              <strong className="text-slate-800">2. Report carries the flag.</strong> The report
              stores which services were informed, and when.
            </li>
            <li>
              <strong className="text-slate-800">3. Authority sees it.</strong> The dashboard shows
              &ldquo;citizen informed this service&rdquo; and hides that service&apos;s forward
              button to avoid duplicate dispatch.
            </li>
            <li>
              <strong className="text-slate-800">4. Authority forwards.</strong> For services not yet
              informed, the authority forwards the full report — photo link, coordinates, address and
              description — to the helpline number and email in one action.
            </li>
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/report"
            className="tap inline-flex items-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Report an emergency
          </Link>
          <Link
            href="/reports"
            className="tap inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400"
          >
            My reports
          </Link>
        </div>
      </section>
    </div>
  );
}
