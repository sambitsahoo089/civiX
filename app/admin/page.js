import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Issue } from "@/lib/models";
import { CATEGORIES, servicesForCategory } from "@/lib/categories";
import { STATUSES } from "@/lib/status";
import { SERVICES } from "@/lib/services";
import { formatDate } from "@/lib/utils";
import FilterBar from "@/components/FilterBar";
import IssueCard from "@/components/IssueCard";
import { AlertIcon, CheckIcon } from "@/components/ServiceIcons";

export const metadata = { title: "Authority dashboard — CiviX" };

function dispatchState(issue) {
  const services = servicesForCategory(issue.category);
  const notified = issue.notifiedServices || [];
  const citizen = new Set(notified.filter((n) => n.by === "CITIZEN").map((n) => n.service));
  const authority = new Set(notified.filter((n) => n.by === "AUTHORITY").map((n) => n.service));
  const awaiting = services.filter((key) => !citizen.has(key) && !authority.has(key));
  return { services, citizen, authority, awaiting };
}

export default async function AdminDashboard({ searchParams }) {
  const session = await auth();
  if (session?.user?.role !== "AUTHORITY") redirect("/login?next=/admin");

  const { status, category, emergency } = await searchParams;
  const where = {};
  if (status && STATUSES[status]) where.status = status;
  if (category && CATEGORIES[category]) where.category = category;
  if (emergency === "1") where.emergency = true;

  await connectDB();
  const [issues, counts, emergencyOpen, emergencyTotal] = await Promise.all([
    Issue.find(where).sort({ emergency: -1, createdAt: -1 }).populate("reporter", "name").lean(),
    Issue.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Issue.find({ emergency: true, status: { $nin: ["RESOLVED", "REJECTED"] } })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean(),
    Issue.countDocuments({ emergency: true }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  const total = Object.values(countMap).reduce((a, b) => a + b, 0);
  const openCount =
    (countMap.REPORTED || 0) + (countMap.ACKNOWLEDGED || 0) + (countMap.IN_PROGRESS || 0);

  const awaitingDispatch = emergencyOpen
    .map((issue) => ({ issue, ...dispatchState(issue) }))
    .filter((entry) => entry.awaiting.length > 0);

  const tiles = [
    { label: "Open issues", value: openCount, tone: "text-slate-900" },
    {
      label: "Emergency reports",
      value: emergencyTotal,
      tone: "text-red-600",
      hint: `${awaitingDispatch.length} awaiting dispatch`,
    },
    { label: "Resolved", value: countMap.RESOLVED || 0, tone: "text-emerald-600" },
    { label: "Total reports", value: total, tone: "text-slate-900" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-xl font-bold sm:text-2xl">Authority dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Review incoming reports, dispatch emergencies to the helplines, and update progress.
      </p>

      {/* KPI tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={`card-lift rounded-2xl border bg-white p-4 ${
              tile.label === "Emergency reports" && tile.value > 0
                ? "border-red-200"
                : "border-slate-200"
            }`}
          >
            <p className="text-xs text-slate-500">{tile.label}</p>
            <p className={`mt-1 text-2xl font-bold ${tile.tone}`}>{tile.value}</p>
            {tile.hint && <p className="mt-0.5 text-[11px] font-medium text-red-600">{tile.hint}</p>}
          </div>
        ))}
      </div>

      {/* Awaiting dispatch */}
      {awaitingDispatch.length > 0 ? (
        <section className="emergency-stripe mt-6 overflow-hidden rounded-2xl border border-red-300 bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/25 text-red-100 ring-1 ring-red-400/40">
                <span className="absolute inset-0 animate-siren rounded-xl bg-red-400/30" />
                <AlertIcon className="relative h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold">
                  {awaitingDispatch.length} emergency
                  {awaitingDispatch.length === 1 ? "" : "s"} awaiting helpline dispatch
                </h2>
                <p className="text-xs text-rose-100/80">
                  Forward the full report to the police, ambulance and fire brigade.
                </p>
              </div>
            </div>
            <Link
              href="/admin?emergency=1"
              className="tap rounded-full bg-white px-4 py-2 text-xs font-semibold text-red-700 transition-transform hover:scale-[1.03]"
            >
              Show all emergencies
            </Link>
          </div>

          <ul className="divide-y divide-white/10">
            {awaitingDispatch.slice(0, 4).map(({ issue, awaiting, citizen }) => (
              <li
                key={issue._id.toString()}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {CATEGORIES[issue.category]?.emoji} {CATEGORIES[issue.category]?.label}
                    <span className="text-[11px] font-normal text-rose-100/70">
                      {issue.address || `${issue.latitude}, ${issue.longitude}`}
                    </span>
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                    {citizen.size > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-100 ring-1 ring-emerald-400/30">
                        <CheckIcon className="h-3.5 w-3.5" />
                        Citizen already informed{" "}
                        {[...citizen].map((key) => SERVICES[key].label).join(", ")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 font-semibold text-red-100 ring-1 ring-red-400/30">
                        <AlertIcon className="h-3.5 w-3.5" />
                        No service informed yet
                      </span>
                    )}
                    <span className="text-rose-100/70">
                      Pending: {awaiting.map((key) => SERVICES[key].label).join(", ")} ·{" "}
                      {formatDate(issue.createdAt)}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/reports/${issue._id.toString()}`}
                  className="tap rounded-xl bg-red-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-400"
                >
                  Open & dispatch
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        emergencyTotal > 0 && (
          <p className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            <CheckIcon className="h-4 w-4" />
            Every open emergency report has been dispatched to the helplines.
          </p>
        )
      )}

      <div className="mt-8">
        <FilterBar />
      </div>

      <div className="mt-4 space-y-3 sm:space-y-4">
        {issues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-3xl">🗂️</p>
            <p className="mt-2 font-medium">No issues match these filters</p>
            <p className="mt-1 text-sm text-slate-500">Try clearing the filters to see all reports.</p>
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue._id.toString()}
              showReporter
              issue={{
                ...issue,
                id: issue._id.toString(),
                reporter: { name: issue.reporter?.name || "Unknown" },
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
