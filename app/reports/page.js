import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Issue } from "@/lib/models";
import IssueCard from "@/components/IssueCard";

export default async function MyReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/reports");

  await connectDB();
  const issues = await Issue.find({ reporter: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const emergencies = issues.filter((issue) => issue.emergency).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">My reports</h1>
          <p className="mt-1 text-sm text-slate-600">
            {issues.length === 0
              ? "You haven't reported any issues yet."
              : `${issues.length} issue${issues.length === 1 ? "" : "s"} reported`}
            {emergencies > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                {emergencies} emergency{emergencies === 1 ? "" : "ies"}
              </span>
            )}
          </p>
        </div>
        <Link
          href="/report"
          className="tap inline-flex items-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Report an issue
        </Link>
      </div>

      <div className="mt-6 space-y-3 sm:space-y-4">
        {issues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-3xl">📍</p>
            <p className="mt-2 font-medium">No reports yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Spot a problem in your neighbourhood? Let the authorities know.
            </p>
            <Link
              href="/report"
              className="mt-4 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Report your first issue
            </Link>
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard key={issue._id.toString()} issue={{ ...issue, id: issue._id.toString() }} />
          ))
        )}
      </div>
    </div>
  );
}