export const CATEGORIES = {
  POTHOLES: {
    label: "Potholes",
    emoji: "🕳️",
    blurb: "Road surface damage",
    color: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
    gradient: "from-amber-400 to-orange-500",
  },
  STREETLIGHT: {
    label: "Broken streetlight",
    emoji: "💡",
    blurb: "Lighting failures",
    color: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500",
    gradient: "from-yellow-300 to-amber-500",
  },
  WATER_LEAK: {
    label: "Water leak",
    emoji: "💧",
    blurb: "Pipes and supply",
    color: "bg-sky-100 text-sky-800",
    dot: "bg-sky-500",
    gradient: "from-sky-400 to-blue-500",
  },
  FOOTPATH: {
    label: "Damaged footpath",
    emoji: "🚶",
    blurb: "Walkways and kerbs",
    color: "bg-orange-100 text-orange-800",
    dot: "bg-orange-500",
    gradient: "from-orange-300 to-amber-600",
  },
  OPEN_DRAIN: {
    label: "Open drain",
    emoji: "⚠️",
    blurb: "Drainage hazards",
    color: "bg-lime-100 text-lime-800",
    dot: "bg-lime-600",
    gradient: "from-lime-400 to-emerald-600",
  },

  // --- emergency categories: these unlock the police / ambulance / fire brigade flow ---
  ACCIDENT: {
    label: "Road / highway accident",
    emoji: "🚧",
    blurb: "Collision or vehicle breakdown",
    color: "bg-red-100 text-red-800",
    dot: "bg-red-600",
    gradient: "from-red-500 to-rose-600",
    emergency: true,
    services: ["POLICE", "AMBULANCE", "FIRE"],
  },
  FIRE: {
    label: "Fire / smoke",
    emoji: "🔥",
    blurb: "Fire, smoke or explosion",
    color: "bg-red-100 text-red-800",
    dot: "bg-orange-600",
    gradient: "from-orange-500 to-red-600",
    emergency: true,
    services: ["FIRE", "AMBULANCE", "POLICE"],
  },
  MEDICAL: {
    label: "Medical emergency",
    emoji: "🚑",
    blurb: "Injury or collapse",
    color: "bg-rose-100 text-rose-800",
    dot: "bg-rose-600",
    gradient: "from-rose-500 to-pink-600",
    emergency: true,
    services: ["AMBULANCE", "POLICE"],
  },

  OTHER: {
    label: "Other",
    emoji: "📋",
    blurb: "Anything else civic",
    color: "bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
    gradient: "from-slate-400 to-slate-600",
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export const EMERGENCY_CATEGORY_KEYS = CATEGORY_KEYS.filter(
  (key) => CATEGORIES[key].emergency
);

export function categoryMeta(category) {
  return CATEGORIES[category] || CATEGORIES.OTHER;
}

export function isEmergencyCategory(category) {
  return Boolean(CATEGORIES[category]?.emergency);
}

/** Which emergency services are relevant for a category (POLICE/AMBULANCE/FIRE). */
export function servicesForCategory(category) {
  return CATEGORIES[category]?.services || [];
}
