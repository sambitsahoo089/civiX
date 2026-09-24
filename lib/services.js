// Emergency service registry.
//
// Phase 1 uses a single shared demo helpline/email for all three services.
// Swap the phone/email per service (or back them with an SMS/email provider in
// lib/alerts.js) when the real control-room numbers are available.
export const HELPLINE_PHONE = "8895465904";
export const HELPLINE_EMAIL = "comedydedanadan089@gmail.com";

export const SERVICES = {
  POLICE: {
    key: "POLICE",
    label: "Police",
    role: "Law & traffic control",
    emoji: "🚓",
    phone: HELPLINE_PHONE,
    email: HELPLINE_EMAIL,
    ring: "ring-indigo-500/40",
    chip: "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/30",
    chipLight: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    solid: "bg-indigo-600 hover:bg-indigo-500",
  },
  AMBULANCE: {
    key: "AMBULANCE",
    label: "Ambulance",
    role: "Medical response",
    emoji: "🚑",
    phone: HELPLINE_PHONE,
    email: HELPLINE_EMAIL,
    ring: "ring-emerald-500/40",
    chip: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
    chipLight: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    solid: "bg-emerald-600 hover:bg-emerald-500",
  },
  FIRE: {
    key: "FIRE",
    label: "Fire brigade",
    role: "Fire & rescue",
    emoji: "🚒",
    phone: HELPLINE_PHONE,
    email: HELPLINE_EMAIL,
    ring: "ring-orange-500/40",
    chip: "bg-orange-500/15 text-orange-200 ring-1 ring-orange-400/30",
    chipLight: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    solid: "bg-orange-600 hover:bg-orange-500",
  },
};

export const SERVICE_KEYS = Object.keys(SERVICES);

export function serviceMeta(key) {
  return SERVICES[key] || null;
}

export function telHref(serviceKey) {
  const service = serviceMeta(serviceKey);
  return service ? `tel:${service.phone}` : null;
}

export function alertSubject(issue) {
  const label = issue?.categoryLabel || issue?.category || "Emergency";
  const place = issue?.address || `${issue?.latitude}, ${issue?.longitude}`;
  return `EMERGENCY DISPATCH — ${label} at ${place}`;
}

/** Full "message + information" payload forwarded to the services. */
export function alertBody(issue, { source = "AUTHORITY", services = [] } = {}) {
  const lines = [
    `EMERGENCY ALERT — forwarded by ${source === "CITIZEN" ? "the reporting citizen" : "the municipal authority"}`,
    "",
    `Issue ID     : #${String(issue?.id || issue?._id || "").slice(-6).toUpperCase()}`,
    `Category     : ${issue?.categoryLabel || issue?.category || "—"}`,
    `Status       : ${issue?.statusLabel || issue?.status || "—"}`,
    `Reported     : ${issue?.createdAt ? new Date(issue.createdAt).toISOString() : "—"}`,
    `Citizen      : ${issue?.reporterName || "—"}`,
    `Address      : ${issue?.address || "—"}`,
    `Coordinates  : ${issue?.latitude}, ${issue?.longitude}`,
    `Map          : https://www.openstreetmap.org/?mlat=${issue?.latitude}&mlon=${issue?.longitude}#map=17/${issue?.latitude}/${issue?.longitude}`,
    `Photo        : ${issue?.imageUrl || "—"}`,
    "",
    `Description  : ${issue?.description || "—"}`,
    "",
    `Services     : ${(services.length ? services : SERVICE_KEYS).join(", ")}`,
    `Helpline     : ${HELPLINE_PHONE}`,
    `Email        : ${HELPLINE_EMAIL}`,
  ];
  return lines.join("\n");
}
