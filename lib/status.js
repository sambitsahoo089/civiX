export const STATUSES = {
  REPORTED: { label: "Reported", color: "bg-slate-200 text-slate-800" },
  ACKNOWLEDGED: { label: "Acknowledged", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "In progress", color: "bg-amber-100 text-amber-800" },
  RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
};

export const STATUS_KEYS = Object.keys(STATUSES);

// Which statuses can be reached from a given status.
export const ALLOWED_TRANSITIONS = {
  REPORTED: ["ACKNOWLEDGED", "REJECTED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: [],
  REJECTED: [],
};

export function statusMeta(status) {
  return STATUSES[status] || STATUSES.REPORTED;
}