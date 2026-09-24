import { statusMeta } from "@/lib/status";

export default function StatusBadge({ status, className = "" }) {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color} ${className}`}
    >
      {meta.label}
    </span>
  );
}