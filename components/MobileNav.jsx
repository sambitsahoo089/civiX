"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

function MenuIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export default function MobileNav({ user }) {
  const [open, setOpen] = useState(false);
  const home = user ? (user.role === "AUTHORITY" ? "/admin" : "/reports") : "/login";

  const linkClass =
    "rounded-xl px-3 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100";

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
      >
        <MenuIcon open={open} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-slate-200 bg-white/98 p-3 shadow-xl backdrop-blur">
          <nav className="flex flex-col gap-1" onClick={() => setOpen(false)}>
            <Link href={home} className={linkClass}>
              {user?.role === "AUTHORITY" ? "Authority dashboard" : user ? "My reports" : "Sign in"}
            </Link>
            {user?.role !== "AUTHORITY" && (
              <Link href="/report" className={linkClass}>
                Report an issue
              </Link>
            )}
            <Link href="/help" className={linkClass}>
              Emergency help lines
            </Link>
            {user ? (
              <>
                <span className="px-3 py-2 text-sm text-slate-400">{user.email}</span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-xl px-3 py-3 text-left text-base font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/register"
                className="rounded-xl bg-emerald-600 px-3 py-3 text-center text-base font-semibold text-white"
              >
                Get started
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
