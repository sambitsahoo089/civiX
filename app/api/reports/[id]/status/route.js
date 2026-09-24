import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Issue, StatusChange } from "@/lib/models";
import { ALLOWED_TRANSITIONS } from "@/lib/status";

export async function POST(request, { params }) {
  const session = await auth();
  if (session?.user?.role !== "AUTHORITY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status || "");
    const note = String(body.note || "").trim() || null;

    await connectDB();
    const issue = await Issue.findById(id);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const allowed = ALLOWED_TRANSITIONS[issue.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot move an issue from "${issue.status}" to "${status}"` },
        { status: 400 }
      );
    }

    const fromStatus = issue.status;

    issue.status = status;
    issue.resolvedAt = status === "RESOLVED" ? new Date() : null;
    await issue.save();

    await StatusChange.create({
      issue: issue._id,
      fromStatus,
      toStatus: status,
      note,
      changedBy: session.user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("update status:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}