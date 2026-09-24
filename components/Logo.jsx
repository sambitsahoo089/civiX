// CiviX brand logo.
//
// The mark is drawn from the brand sheet: a location pin over two crossing
// roads (dashed centre lines, node-capped ends) and a rail track, with a bold
// orange check running across it. Everything is plain SVG, so it stays crisp at
// any size and scales with the `size` prop.
//
// No hooks here on purpose — this is rendered from server components (Navbar,
// footer).
//
// The gradients live in ONE place (<LogoDefs />, mounted once in the root
// layout) instead of inside every mark. If each instance carried its own
// <defs> they would all share the same ids, and because the navbar renders a
// phone-only logo that is `display: none` on wider screens, every url(#...) in
// the document would resolve into that hidden subtree and paint nothing.
// Keeping the defs in a zero-sized, always-rendered svg avoids that entirely.

export const CIVIX_NAVY = "#17395f";
export const CIVIX_ORANGE = "#f26a1b";

/** Renders the shared brand gradients. Mount once, high in the tree. */
export function LogoDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="civix-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#215080" />
          <stop offset="100%" stopColor="#132c4c" />
        </linearGradient>
        <linearGradient id="civix-orange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a2b" />
          <stop offset="100%" stopColor="#ea5a0c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoMark({ size = 34, className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="CiviX"
    >
      {/* crossing roads */}
      <g>
        <rect
          x="3"
          y="27"
          width="58"
          height="10"
          rx="2.5"
          fill="url(#civix-navy)"
          transform="rotate(45 32 32)"
        />
        <rect
          x="3"
          y="27"
          width="58"
          height="10"
          rx="2.5"
          fill="url(#civix-navy)"
          transform="rotate(-45 32 32)"
        />
        <g stroke="#ffffff" strokeWidth="1.8" strokeDasharray="4.5 4.5" opacity="0.92">
          <line x1="13" y1="32" x2="51" y2="32" transform="rotate(45 32 32)" />
          <line x1="13" y1="32" x2="51" y2="32" transform="rotate(-45 32 32)" />
        </g>
      </g>

      {/* node-capped road ends */}
      <g fill="url(#civix-navy)">
        <circle cx="11.5" cy="11.5" r="4.6" />
        <circle cx="52.5" cy="11.5" r="4.6" />
        <circle cx="11.5" cy="52.5" r="4.6" />
        <circle cx="52.5" cy="52.5" r="4.6" />
      </g>
      <g fill="#ffffff">
        <circle cx="11.5" cy="11.5" r="1.9" />
        <circle cx="52.5" cy="11.5" r="1.9" />
        <circle cx="11.5" cy="52.5" r="1.9" />
        <circle cx="52.5" cy="52.5" r="1.9" />
      </g>

      {/* location pin */}
      <path
        d="M32 4.6c-7.3 0-13.2 5.7-13.2 12.7 0 9.4 13.2 21.4 13.2 21.4s13.2-12 13.2-21.4c0-7-5.9-12.7-13.2-12.7Z"
        fill="url(#civix-navy)"
      />
      <circle cx="32" cy="17.3" r="5.1" fill="#ffffff" />

      {/* rail track */}
      <g stroke="url(#civix-navy)" strokeLinecap="round" fill="none">
        <path d="M28.4 41v18" strokeWidth="3.4" />
        <path d="M35.6 41v18" strokeWidth="3.4" />
        <g strokeWidth="2.2">
          <path d="M28.4 45.5h7.2" />
          <path d="M28.4 50.5h7.2" />
          <path d="M28.4 55.5h7.2" />
        </g>
      </g>

      {/* the check */}
      <path
        d="M13.5 33.5 24.5 44.5 51.5 14.5"
        fill="none"
        stroke="url(#civix-orange)"
        strokeWidth="8.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({
  size = 34,
  showText = true,
  showTagline = false,
  className = "",
}) {
  const wordSize = Math.round(size * 0.74);
  const tagSize = Math.max(7, Math.round(size * 0.25));

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className="flex flex-col leading-none">
          <span
            className="font-extrabold tracking-tight"
            style={{ fontSize: wordSize, lineHeight: 1 }}
          >
            <span style={{ color: CIVIX_NAVY }}>Civi</span>
            <span style={{ color: CIVIX_ORANGE }}>X</span>
          </span>
          {showTagline && (
            <span
              className="mt-1 font-semibold uppercase"
              style={{
                fontSize: tagSize,
                letterSpacing: "0.17em",
                color: "#7c8798",
                lineHeight: 1,
              }}
            >
              Public Infrastructure Reporting
            </span>
          )}
        </span>
      )}
    </span>
  );
}
