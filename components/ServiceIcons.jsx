const BASE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function PoliceIcon({ className = "h-6 w-6" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z" />
      <path d="M12 9.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 11.3l2-.3.9-1.8z" />
    </svg>
  );
}

export function AmbulanceIcon({ className = "h-6 w-6" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <path d="M2 15V8a1 1 0 011-1h9v8" />
      <path d="M12 9h4.2a2 2 0 011.7 1l2.1 3.2V15" />
      <path d="M2 15h2m16 0h2" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
      <path d="M7.5 9.8v3M6 11.3h3" />
    </svg>
  );
}

export function FireIcon({ className = "h-6 w-6" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <path d="M12 3c2.6 2.6 5 5 5 8a5 5 0 01-10 0c0-1.5.7-2.8 1.6-3.9.4 1 1 1.6 1.9 2 .5-2.1.8-4 1.5-6.1z" />
      <path d="M12 20a3 3 0 01-3-3c0-1.4 1-2.3 3-4.2 2 1.9 3 2.8 3 4.2a3 3 0 01-3 3z" />
    </svg>
  );
}

export function SirenIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <path d="M7 17v-4a5 5 0 0110 0v4" />
      <path d="M4.5 20h15" />
      <path d="M12 3v2M5.2 6.2l1.4 1.4M18.8 6.2l-1.4 1.4" />
    </svg>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 005.1 5.1l1.4-2 4 1.5v3a2 2 0 01-2.2 2A16.5 16.5 0 014.5 5.7 2 2 0 016.5 3.5z" />
    </svg>
  );
}

export function DownloadIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <path d="M12 3v11" />
      <path d="M7.5 10.5L12 15l4.5-4.5" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

export function MailIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function AlertIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <path d="M12 4l9 16H3l9-16z" />
      <path d="M12 10v5M12 18h.01" />
    </svg>
  );
}

export function SendIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...BASE} className={className} aria-hidden="true">
      <path d="M4 12l16-7-6 16-3-6-7-3z" />
    </svg>
  );
}

const BY_SERVICE = {
  POLICE: PoliceIcon,
  AMBULANCE: AmbulanceIcon,
  FIRE: FireIcon,
};

export function ServiceIcon({ service, className = "h-6 w-6" }) {
  const Icon = BY_SERVICE[service] || PoliceIcon;
  return <Icon className={className} />;
}
