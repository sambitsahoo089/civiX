import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { AlertLog, Issue, StatusChange } from "@/lib/models";
import { categoryMeta, isEmergencyCategory, servicesForCategory } from "@/lib/categories";
import { SERVICES } from "@/lib/services";
import { formatDate, formatCoords } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import MapView from "@/components/MapView";
import StatusTimeline from "@/components/StatusTimeline";
import StatusForm from "@/components/StatusForm";
import EmergencyCallPanel from "@/components/EmergencyCallPanel";
import AlertDispatchPanel from "@/components/AlertDispatchPanel";
import { AlertIcon, CheckIcon, MailIcon, PhoneIcon } from "@/components/ServiceIcons";

export default async function IssueDetailPage({ params }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) redirect(`/login?next=/reports/${id}`);

  await connectDB();

  let issue;
  try {
    issue = await Issue.findById(id).populate("reporter", "name").lean();
  } catch {
    issue = null;
  }
  if (!issue) notFound();

  const statusChanges = await StatusChange.find({ issue: issue._id })
    .populate("changedBy", "name")
    .sort({ createdAt: 1 })
    .lean();

  const isAuthority = session.user.role === "AUTHORITY";
  if (!isAuthority && issue.reporter._id.toString() !== session.user.id) redirect("/reports");

  const cat = categoryMeta(issue.category);
  const emergency = issue.emergency ?? isEmergencyCategory(issue.category);
  const services = servicesForCategory(issue.category);
  const notified = (issue.notifiedServices || []).map((n) => ({
    service: n.service,
    by: n.by,
    method: n.method,
    at: n.at,
  }));

  const alertLogs = emergency
    ? await AlertLog.find({ issue: issue._id }).sort({ createdAt: -1 }).lean()
    : [];

  const citizenInformed = new Set(
    notified.filter((n) => n.by === "CITIZEN").map((n) => n.service)
  );
  const authorityInformed = new Set(
    notified.filter((n) => n.by === "AUTHORITY").map((n) => n.service)
  );
  const awaiting = services.filter(
    (key) => !citizenInformed.has(key) && !authorityInformed.has(key)
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <Link href={isAuthority ? "/admin" : "/reports"} className="text-xs font-medium text-slate-500 hover:text-emerald-700">
        ← {isAuthority ? "Back to dashboard" : "Back to my reports"}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">
          {cat.emoji} {cat.label}
        </span>
        <StatusBadge status={issue.status} />
        {emergency && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-red-200">
            <AlertIcon className="h-3.5 w-3.5" />
            Emergency
          </span>
        )}
        <span className="text-xs text-slate-400">
          #{issue._id.toString().slice(-6).toUpperCase()}
        </span>
      </div>

      <h1 className="mt-2 text-xl font-bold sm:text-2xl">
        {emergency ? "Emergency report" : "Issue report"}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Reported {formatDate(issue.createdAt)} by {issue.reporter?.name || "Unknown"}
      </p>

      {/* Emergency handling sits at the top — it is the most time-critical action */}
      {emergency && (
        <div className="mt-6 space-y-4">
          {isAuthority ? (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs">
                <span className="font-semibold text-slate-700">Helpline status:</span>
                {services.map((key) => {
                  const byCitizen = citizenInformed.has(key);
                  const byAuthority = authorityInformed.has(key);
                  const informed = byCitizen || byAuthority;
                  return (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
                        informed
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-red-50 text-red-700 ring-1 ring-red-200"
                      }`}
                    >
                      {informed ? <CheckIcon className="h-3.5 w-3.5" /> : <AlertIcon className="h-3.5 w-3.5" />}
                      {SERVICES[key].label} ·{" "}
                      {byCitizen
                        ? `informed by citizen ${formatDate(
                            notified.find((n) => n.service === key && n.by === "CITIZEN")?.at
                          )}`
                        : byAuthority
                          ? "forwarded by authority"
                          : "not informed"}
                    </span>
                  );
                })}
                {awaiting.length === 0 && (
                  <span className="text-emerald-700">No dispatch action pending.</span>
                )}
              </div>
              <AlertDispatchPanel
                issueId={issue._id.toString()}
                category={issue.category}
                notified={notified}
              />
            </>
          ) : (
            <>
              <EmergencyCallPanel
                category={issue.category}
                issueId={issue._id.toString()}
                variant="issue"
                notified={notified}
              />
              {awaiting.length === 0 && (
                <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                  You informed every relevant service — the authority can see this and will not
                  dispatch a duplicate alert.
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={issue.imageUrl} alt={cat.label} className="max-h-96 w-full object-cover" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </h2>
            <p className="mt-2 text-sm text-slate-700 sm:text-base">{issue.description}</p>

            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Reported</dt>
                <dd className="font-medium">{formatDate(issue.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Reporter</dt>
                <dd className="font-medium">{issue.reporter?.name || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Coordinates</dt>
                <dd className="font-medium">{formatCoords(issue.latitude, issue.longitude)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Location</dt>
                <dd className="font-medium">{issue.address || "Not provided"}</dd>
              </div>
              {issue.resolvedAt && (
                <div>
                  <dt className="text-xs text-slate-500">Resolved</dt>
                  <dd className="font-medium">{formatDate(issue.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          <MapView latitude={issue.latitude} longitude={issue.longitude} height={260} />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progress
            </h2>
            <div className="mt-4">
              <StatusTimeline
                statusChanges={statusChanges.map((c) => ({
                  id: c._id.toString(),
                  toStatus: c.toStatus,
                  note: c.note,
                  createdAt: c.createdAt,
                  changedBy: c.changedBy ? { name: c.changedBy.name } : null,
                }))}
              />
            </div>
          </div>

          {isAuthority && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Authority actions
              </h2>
              <div className="mt-4">
                <StatusForm issueId={issue._id.toString()} currentStatus={issue.status} />
              </div>
            </div>
          )}

          {emergency && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Helpline dispatch log
              </h2>
              {alertLogs.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Nothing has been sent to the helplines yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {alertLogs.map((log) => (
                    <li key={log._id.toString()} className="rounded-xl bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            log.kind === "CITIZEN_CALL"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {log.kind === "CITIZEN_CALL" ? "Citizen call" : "Authority forward"}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {formatDate(log.createdAt)}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {log.services?.map((key) => SERVICES[key]?.label || key).join(", ")}
                        </span>
                      </div>
                      {log.message && <p className="mt-1.5 text-xs text-slate-700">{log.message}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <PhoneIcon className="h-3.5 w-3.5" />
                          {log.phone}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <MailIcon className="h-3.5 w-3.5" />
                          {log.email}
                        </span>
                        {log.channels?.map((channel) => (
                          <span
                            key={channel.channel}
                            className={`rounded-full px-2 py-0.5 font-semibold ${
                              channel.status === "SENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : channel.status === "FAILED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {channel.channel} · {channel.status}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
