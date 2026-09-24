"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-slate-500 transition-colors hover:text-slate-900"
    >
      Sign out
    </button>
  );
}