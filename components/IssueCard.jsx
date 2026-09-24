import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { categoryMeta, isEmergencyCategory, servicesForCategory } from "@/lib/categories";
import { SERVICES } from "@/lib/services";
import { formatDate, formatCoords } from "@/lib/utils";
import { AlertIcon, CheckIcon } from "@/components/ServiceIcons";

export default function IssueCard({ issue, showReporter = false }) {
  const cat = categoryMeta(issue.category);
  const emergency = issue.emergency ?? isEmergencyCategory(issue.category);
  const notified = issue.notifiedServices || [];

  const citizenInformed = new Set(
    notified.filter((n) => n.by === "CITIZEN").map((n) => n.service)
  );
  const authorityInformed = new Set(
    notified.filter((n) => n.by === "AUTHORITY").map((n) => n.service)
  );
  const services = servicesForCategory(issue.category);
  const awaiting = services.filter(
    (key) => !citizenInformed.has(key) && !authorityInformed.has(key)
  );

  return (
    <Link
      href={`/reports/${issue.id}`}
      className={`card-lift relative flex gap-3 overflow-hidden rounded-2xl border bg-white p-3.5 sm:gap-4 sm:p-4 ${
        emergency ? "border-red-200" : "border-slate-200"
      }`}
    >
      {emergency && (
        <span
          className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-red-500 to-orange-500"
          aria-hidden="true"
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={issue.imageUrl}
        alt={cat.label}
        className="h-24 w-24 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 sm:h-28 sm:w-28"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">
            {cat.emoji} {cat.label}
          </span>
          <StatusBadge status={issue.status} />
          {emergency && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-red-200">
              <AlertIcon className="h-3.5 w-3.5" />
              Emergency
            </span>
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{issue.description}</p>

        {emergency && services.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {services.map((key) => {
              const byCitizen = citizenInformed.has(key);
              const byAuthority = authorityInformed.has(key);
              const informed = byCitizen || byAuthority;
              return (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    informed
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-red-50 text-red-700 ring-1 ring-red-200"
                  }`}
                >
                  {informed ? <CheckIcon className="h-3 w-3" /> : <AlertIcon className="h-3 w-3" />}
                  {SERVICES[key].label}
                  {informed
                    ? byCitizen
                      ? " informed by citizen"
                      : " forwarded"
                    : " not informed"}
                </span>
              );
            })}
          </div>
        )}

        {emergency && awaiting.length > 0 && (
          <p className="mt-2 text-[11px] font-medium text-red-700">
            Awaiting dispatch · {awaiting.map((key) => SERVICES[key].label).join(", ")}
          </p>
        )}

        <p className="mt-2 text-xs text-slate-400">
          {issue.address || formatCoords(issue.latitude, issue.longitude)} · Reported{" "}
          {formatDate(issue.createdAt)}
          {showReporter && issue.reporter?.name ? ` · ${issue.reporter.name}` : ""}
        </p>
      </div>
    </Link>
  );
}
