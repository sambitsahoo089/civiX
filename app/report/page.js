import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportForm from "@/components/ReportForm";

export default async function ReportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/report");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Report an issue</h1>
      <p className="mt-1 text-sm text-slate-600">
        Provide as much detail as you can — a photo and precise location help crews find and fix
        it faster.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <ReportForm />
      </div>
    </div>
  );
}