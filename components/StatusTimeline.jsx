import { statusMeta } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default function StatusTimeline({ statusChanges }) {
  if (!statusChanges?.length) return null;

  return (
    <ol className="relative ml-3 space-y-6 border-l border-slate-200 pl-6">
      {statusChanges.map((change) => {
        const meta = statusMeta(change.toStatus);
        return (
          <li key={change.id} className="relative">
            <span
              className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${meta.color.split(" ")[0]}`}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{meta.label}</span>
              <span className="text-xs text-slate-400">{formatDate(change.createdAt)}</span>
            </div>
            {change.note && <p className="mt-0.5 text-sm text-slate-600">{change.note}</p>}
            {change.changedBy && (
              <p className="mt-0.5 text-xs text-slate-400">by {change.changedBy.name}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}