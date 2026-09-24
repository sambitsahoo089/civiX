"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { servicesForCategory } from "@/lib/categories";
import { HELPLINE_PHONE, SERVICES, telHref } from "@/lib/services";
import { CheckIcon, PhoneIcon, ServiceIcon, SirenIcon } from "@/components/ServiceIcons";

function timeLabel(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Citizen-facing emergency panel.
 *
 * variant="form"  → used inside the report form; taps are collected locally and
 *                   submitted with the report.
 * variant="issue" → used on the issue page; taps are saved straight away so the
 *                   authority sees the services were informed.
 */
export default function EmergencyCallPanel({
  category,
  issueId = null,
  notified = [],
  variant = "form",
  onNotifyChange,
}) {
  const router = useRouter();
  const services = servicesForCategory(category);
  const [marks, setMarks] = useState(() =>
    notified.map((n) => ({ service: n.service, at: n.at || new Date().toISOString() }))
  );
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  if (services.length === 0) return null;

  const informedAt = (key) => marks.find((m) => m.service === key)?.at || null;

  async function record(key) {
    const at = new Date().toISOString();
    setError("");

    if (variant === "form") {
      const next = [...marks.filter((m) => m.service !== key), { service: key, at }];
      setMarks(next);
      onNotifyChange?.(next.map((m) => m.service));
      return;
    }

    setBusy(key);
    try {
      const res = await fetch(`/api/reports/${issueId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: [key], method: "CALL" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not record the call. Please try again.");
        return;
      }
      setMarks((data.notified || []).map((n) => ({ service: n.service, at: n.at })));
      router.refresh();
    } catch {
      setError("Could not record the call. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-red-400/40 bg-gradient-to-br from-red-950 via-rose-950 to-slate-950 shadow-lg shadow-red-950/30">
      <div className="flex items-start gap-3 border-b border-white/10 bg-white/5 px-4 py-3 sm:px-5">
        <span className="relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/20 text-red-300 ring-1 ring-red-400/40">
          <span className="absolute inset-0 animate-siren rounded-xl bg-red-500/25" />
          <SirenIcon className="relative h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-red-50">Emergency — inform a helpline now</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-rose-200/80">
            {variant === "form"
              ? "If lives or property are at risk, tap the service below to dial the helpline from your phone. The call appears in your call log, and the authority will see that you already informed them."
              : "Tap a service to dial the helpline. The call appears in your call log and the authority is notified that you made it."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        {services.map((key) => {
          const service = SERVICES[key];
          const at = informedAt(key);
          const informed = Boolean(at);
          return (
            <a
              key={key}
              href={telHref(key)}
              onClick={() => record(key)}
              aria-label={`Call ${service.label} on ${service.phone}`}
              className={`group flex min-h-[104px] flex-col justify-between rounded-xl p-3.5 ring-1 transition-all active:scale-[0.98] ${
                informed
                  ? "bg-emerald-500/15 ring-emerald-400/40"
                  : "bg-white/5 ring-white/15 hover:bg-white/10 hover:ring-white/30"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-lg text-white ring-1 ${service.ring} ${service.solid}`}
                >
                  <ServiceIcon service={key} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">
                    {service.label}
                  </span>
                  <span className="block truncate text-[11px] text-white/60">{service.role}</span>
                </span>
              </span>

              <span className="mt-3 flex items-center gap-1.5 text-[11px] font-medium">
                {informed ? (
                  <>
                    <CheckIcon className="h-4 w-4 text-emerald-300" />
                    <span className="text-emerald-300">
                      {busy === key ? "Saving…" : `Informed at ${timeLabel(at)}`}
                    </span>
                  </>
                ) : (
                  <>
                    <PhoneIcon className="h-4 w-4 text-white/70" />
                    <span className="text-white/80">
                      {busy === key ? "Dialling…" : `Call ${service.phone}`}
                    </span>
                  </>
                )}
              </span>
            </a>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 bg-black/20 px-4 py-2.5 text-[11px] text-rose-200/70 sm:px-5">
        <span>
          Helpline <span className="font-semibold text-rose-100">{HELPLINE_PHONE}</span>
        </span>
        <span className="hidden h-3 w-px bg-white/15 sm:block" />
        <span>{variant === "form" ? "Taps are saved with your report." : "Recorded instantly."}</span>
      </div>
    </section>
  );
}
