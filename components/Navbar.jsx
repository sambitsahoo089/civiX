import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import MobileNav from "@/components/MobileNav";
import Logo from "@/components/Logo";
import { SirenIcon } from "@/components/ServiceIcons";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <nav className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-16">
        <Link href="/" aria-label="CiviX home" className="flex items-center">
          <Logo size={30} showText={false} className="sm:hidden" />
          <Logo size={34} className="hidden sm:inline-flex" />
        </Link>

        {/* desktop / tablet */}
        <div className="hidden items-center gap-1 text-sm font-medium md:flex">
          {user ? (
            <>
              <Link
                href={user.role === "AUTHORITY" ? "/admin" : "/reports"}
                className="rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {user.role === "AUTHORITY" ? "Authority dashboard" : "My reports"}
              </Link>
              {user.role !== "AUTHORITY" && (
                <Link
                  href="/report"
                  className="ml-1 rounded-full bg-emerald-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  Report an issue
                </Link>
              )}
              <Link
                href="/help"
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
              >
                <SirenIcon className="h-4 w-4" />
                Emergency help
              </Link>
              <span className="ml-2 hidden max-w-32 truncate text-slate-500 lg:inline">
                {user.name}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/help"
                className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
              >
                <SirenIcon className="h-4 w-4" />
                Emergency help
              </Link>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* mobile */}
        <MobileNav user={user ? { role: user.role, email: user.email } : null} />
      </nav>
    </header>
  );
}
