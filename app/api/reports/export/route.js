import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Issue } from "@/lib/models";
import { categoryMeta } from "@/lib/categories";
import { statusMeta } from "@/lib/status";

/**
 * Authority-only export: every report as a CSV file that opens directly in
 * Excel (double-click or Data → From Text). Columns cover the reporter name,
 * issue id, problem details and the exact location (address + lat/lng).
 *
 * The filters on the dashboard are honoured too — /api/reports/export?status=…&
 * category=…&emergency=1 exports just the filtered slice.
 */

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // Guard against CSV/formula injection and escape quotes per RFC 4180.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request) {
  const session = await auth();
  if (session?.user?.role !== "AUTHORITY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const emergency = searchParams.get("emergency");

  const where = {};
  if (status && status !== "ALL") where.status = status;
  if (category && category !== "ALL") where.category = category;
  if (emergency === "1") where.emergency = true;

  await connectDB();
  const issues = await Issue.find(where)
    .sort({ createdAt: -1 })
    .populate("reporter", "name")
    .lean();

  const headers = [
    "S.No",
    "Issue ID",
    "Citizen Name",
    "Category",
    "Problem / Description",
    "Status",
    "Address / Location Details",
    "Latitude",
    "Longitude",
    "Map Link",
    "Photo Link",
    "Emergency",
    "Reported On",
  ];

  const rows = issues.map((issue, index) => {
    const { lat, lng } = { lat: issue.latitude, lng: issue.longitude };
    return [
      index + 1,
      `#${issue._id.toString().slice(-6).toUpperCase()}`,
      issue.reporter?.name || "Unknown",
      categoryMeta(issue.category)?.label || issue.category,
      issue.description,
      statusMeta(issue.status)?.label || issue.status,
      issue.address || "",
      lat,
      lng,
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`,
      issue.imageUrl?.startsWith("http")
        ? issue.imageUrl
        : `https://civix-es8r.onrender.com${issue.imageUrl}`,
      issue.emergency ? "YES" : "no",
      new Date(issue.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    // UTF-8 BOM so Excel renders ₹ / accents correctly on double-click.
    .join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  const scope = [status, category, emergency === "1" && "emergency"].filter(Boolean).join("-");
  const filename = `civix-reports-${scope || "all"}-${stamp}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
