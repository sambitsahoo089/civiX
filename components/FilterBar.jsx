"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { STATUSES } from "@/lib/status";
import { AlertIcon, DownloadIcon } from "@/components/ServiceIcons";

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin?${params.toString()}`);
  }

  const emergencyOnly = searchParams.get("emergency") === "1";
  const hasFilters =
    Boolean(searchParams.get("status") || searchParams.get("category")) || emergencyOnly;

  // Export the current (filtered) view to an Excel-friendly CSV.
  const exportHref = `/api/reports/export?${searchParams.toString()}`;

  const selectClass =
    "tap min-w-[10rem] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none sm:flex-none";

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      <select
        value={searchParams.get("status") || ""}
        onChange={(e) => update("status", e.target.value)}
        aria-label="Filter by status"
        className={selectClass}
      >
        <option value="">All statuses</option>
        {Object.entries(STATUSES).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("category") || ""}
        onChange={(e) => update("category", e.target.value)}
        aria-label="Filter by category"
        className={selectClass}
      >
        <option value="">All categories</option>
        {CATEGORY_KEYS.map((key) => (
          <option key={key} value={key}>
            {CATEGORIES[key].emoji} {CATEGORIES[key].label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => update("emergency", emergencyOnly ? "" : "1")}
        aria-pressed={emergencyOnly}
        className={`tap inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
          emergencyOnly
            ? "bg-red-600 text-white ring-1 ring-red-600"
            : "bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50"
        }`}
      >
        <AlertIcon className="h-4 w-4" />
        Emergencies only
      </button>

      <a
        href={exportHref}
        download
        className="tap inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        title="Download all reports in the current view as an Excel-compatible file"
      >
        <DownloadIcon className="h-4 w-4" />
        Export to Excel
      </a>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="tap rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-700 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
