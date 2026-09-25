import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Issue, User } from "@/lib/models";
import { categoryMeta, servicesForCategory } from "@/lib/categories";
import { statusMeta } from "@/lib/status";
import { SERVICE_KEYS, serviceMeta } from "@/lib/services";
import { dispatchEmergencyAlert } from "@/lib/alerts";

/** Shape an issue document into the payload the alert builder expects. */
function toAlertIssue(issue, reporterName) {
  return {
    id: issue._id.toString(),
    category: issue.category,
    categoryLabel: categoryMeta(issue.category).label,
    status: issue.status,
    statusLabel: statusMeta(issue.status).label,
    description: issue.description,
    address: issue.address,
    latitude: issue.latitude,
    longitude: issue.longitude,
    imageUrl: issue.imageUrl,
    createdAt: issue.createdAt,
    reporterName,
  };
}

/**
 * Authority action: forward the whole report (photo link, coordinates, address,
 * description, reporter) to every relevant emergency service — helpline phone
 * and email — and mark those services as informed so their buttons stop showing.
 *
 * With { resend: true } it re-sends the email alert for an issue whose services
 * are all informed already (useful after configuring SMTP, or if a gateway was
 * down) without duplicating the "informed" marks.
 */
export async function POST(request, { params }) {
  const session = await auth();
  if (session?.user?.role !== "AUTHORITY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const via = SERVICE_KEYS.includes(body.via) ? body.via : null;
    const resend = body.resend === true;

    await connectDB();
    const issue = await Issue.findById(id).lean();
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    if (!issue.emergency) {
      return NextResponse.json(
        { error: "Only emergency reports are forwarded to the helplines" },
        { status: 400 }
      );
    }

    const relevant = servicesForCategory(issue.category);
    const citizenInformed = issue.notifiedServices
      .filter((n) => n.by === "CITIZEN")
      .map((n) => n.service);
    const authorityInformed = issue.notifiedServices
      .filter((n) => n.by === "AUTHORITY")
      .map((n) => n.service);

    // Everything not already forwarded by the authority goes out in this batch.
    const targets = relevant.filter((key) => !authorityInformed.includes(key));

    if (targets.length === 0 && !resend) {
      return NextResponse.json({
        ok: true,
        alreadyForwarded: true,
        message: "This alert has already been forwarded to all emergency services.",
        notified: issue.notifiedServices,
      });
    }

    const reporter = await User.findById(issue.reporter).select("name").lean();
    const alertIssue = toAlertIssue(issue, reporter?.name);

    if (targets.length === 0 && resend) {
      // Pure re-send: deliver the email again, change nothing else.
      const result = await dispatchEmergencyAlert({
        issue: alertIssue,
        services: relevant,
        source: "AUTHORITY",
        triggeredBy: via,
        actorId: session.user.id,
      });
      return NextResponse.json({
        ok: true,
        resent: true,
        recipients: result.recipients,
        channels: result.channels,
        services: relevant.map((key) => serviceMeta(key)?.label || key),
        alreadyInformedByCitizen: citizenInformed.filter((key) => relevant.includes(key)),
        notified: issue.notifiedServices,
      });
    }

    const result = await dispatchEmergencyAlert({
      issue: alertIssue,
      services: targets,
      source: "AUTHORITY",
      triggeredBy: via,
      actorId: session.user.id,
    });

    await Issue.updateOne(
      { _id: issue._id },
      {
        $push: {
          notifiedServices: {
            $each: targets.map((key) => ({
              service: key,
              by: "AUTHORITY",
              method: "FORWARD",
              at: new Date(),
            })),
          },
        },
      }
    );

    // Return what was actually stored — the UI hides a forward button per service,
    // so every entry needs its timestamp.
    const updated = await Issue.findById(issue._id).select("notifiedServices").lean();

    return NextResponse.json({
      ok: true,
      recipients: result.recipients,
      channels: result.channels,
      services: targets.map((key) => serviceMeta(key)?.label || key),
      alreadyInformedByCitizen: citizenInformed.filter((key) => relevant.includes(key)),
      notified: (updated?.notifiedServices || []).map((entry) => ({
        service: entry.service,
        by: entry.by,
        method: entry.method,
        at: entry.at,
      })),
    });
  } catch (err) {
    console.error("forward alert:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
