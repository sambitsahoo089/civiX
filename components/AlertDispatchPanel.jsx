"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { servicesForCategory } from "@/lib/categories";
import { SERVICES } from "@/lib/services";
import {
  AlertIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
  SendIcon,
  ServiceIcon,
} from "@/components/ServiceIcons";

function timeLabel(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ChannelRow({ channel }) {
  const tone =
    channel.status === "SENT"
      ? "bg-emerald-100 text-emerald-800"
      : channel.status === "FAILED"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";
  return (
    <li className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-full px-2 py-0.5 font-semibold ${tone}`}>
        {channel.channel} · {channel.status}
      </span>
      <span className="text-slate-600">{channel.detail}</span>
    </li>
  );
}

/**
 * Authority-facing emergency dispatch panel.
 *
 * A forward button is rendered ONLY for services that have not been informed
 * yet — if the citizen already called the police, that service shows as
 * "informed by citizen" with no button.
 */
export default function AlertDispatchPanel({ issueId, category, notified = [] }) {
  const router = useRouter();
  const services = servicesForCategory(category);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [localNotified, setLocalNotified] = useState(notified);

  // After router.refresh() the server sends the authoritative list; keep in sync so
  // a forwarded service never keeps showing its button.
  const notifiedKey = notified.map((n) => `${n.service}:${n.by}:${n.at || ""}`).join("|");
  useEffect(() => {
    setLocalNotified(notified);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifiedKey]);

  if (services.length === 0) return null;

  const citizenAt = (key) =>
    localNotified.find((n) => n.service === key && n.by === "CITIZEN")?.at || null;
  const authorityAt = (key) =>
    localNotified.find((n) => n.service === key && n.by === "AUTHORITY")?.at || null;

  const pending = services.filter((key) => !citizenAt(key) && !authorityAt(key));
  const allHandled = pending.length === 0;

  async function forward(via) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/reports/${issueId}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ via }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Forwarding failed. Please try again.");
        return;
      }
      if (data.notified?.length) setLocalNotified(data.notified);
      setResult(data);
      router.refresh();
    } catch {
      setError("Forwarding failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50 px-5 py-4">
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700 ring-1 ring-red-200">
          <span className="absolute inset-0 animate-siren rounded-xl bg-red-400/25" />
          <AlertIcon className="relative h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-red-700">
            Emergency dispatch
          </h2>
          <p className="mt-0.5 text-xs text-red-900/70">
            Forward the full report — photo, coordinates, address and description — to the
            police, ambulance and fire brigade helplines.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {services.map((key) => {
          const service = SERVICES[key];
          const byCitizen = citizenAt(key);
          const byAuthority = authorityAt(key);
          const informed = byCitizen || byAuthority;
          return (
            <li
              key={key}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${
                    informed ? "bg-slate-400" : service.solid
                  }`}
                >
                  <ServiceIcon service={key} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{service.label}</p>
                  <p className="truncate text-xs text-slate-500">
                    {informed ? (
                      byCitizen ? (
                        <span className="text-emerald-700">
                          Citizen informed this service on {timeLabel(byCitizen)}
                        </span>
                      ) : (
                        <span className="text-sky-700">
                          Forwarded by authority on {timeLabel(byAuthority)}
                        </span>
                      )
                    ) : (
                      `Not informed yet · ${service.phone}`
                    )}
                  </p>
                </div>
              </div>

              {informed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <CheckIcon className="h-4 w-4" />
                  No action needed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => forward(key)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
                >
                  <SendIcon className="h-4 w-4" />
                  {busy ? "Forwarding…" : `Forward to ${service.label}`}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
        <p className="text-xs text-slate-600">
          {allHandled
            ? "Every emergency service has already been informed — no buttons are shown."
            : "Tapping any button sends the report to all three helplines (phone + email)."}
        </p>
        {!allHandled && (
          <button
            type="button"
            onClick={() => forward(pending[0])}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60"
          >
            <SendIcon className="h-4 w-4" />
            {busy ? "Forwarding…" : "Forward to all services"}
          </button>
        )}
      </div>

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {result?.alreadyForwarded && (
        <p className="border-t border-sky-100 bg-sky-50 px-5 py-3 text-xs font-medium text-sky-800">
          {result.message}
        </p>
      )}

      {result && !result.alreadyForwarded && (
        <div className="space-y-3 border-t border-emerald-100 bg-emerald-50/60 px-5 py-4">
          <p className="text-xs font-semibold text-emerald-800">
            Forwarded to {result.services?.join(", ")} — alert recorded.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-700">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">
              <PhoneIcon className="h-4 w-4 text-slate-500" />
              {result.recipients?.phone}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">
              <MailIcon className="h-4 w-4 text-slate-500" />
              {result.recipients?.email}
            </span>
          </div>
          <ul className="space-y-1.5">
            {result.channels?.map((channel) => (
              <ChannelRow key={channel.channel} channel={channel} />
            ))}
          </ul>
          {result.alreadyInformedByCitizen?.length > 0 && (
            <p className="text-xs text-slate-600">
              The citizen had already informed:{" "}
              {result.alreadyInformedByCitizen
                .map((key) => SERVICES[key]?.label || key)
                .join(", ")}
              .
            </p>
          )}
        </div>
      )}
    </section>
  );
}
