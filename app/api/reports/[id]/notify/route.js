import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AlertLog, Issue } from "@/lib/models";
import { categoryMeta, isEmergencyCategory, servicesForCategory } from "@/lib/categories";
import { HELPLINE_EMAIL, HELPLINE_PHONE, SERVICE_KEYS, serviceMeta } from "@/lib/services";

/**
 * Marks emergency services as "already informed" for an issue.
 * - The reporting citizen uses it with method "CALL" (they dialled the helpline
 *   from the report form or the issue page).
 * - Either role may call it for their own issue / as authority.
 */
export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const requested = Array.isArray(body.services) ? body.services : [];
    const method = body.method === "FORWARD" ? "FORWARD" : "CALL";

    await connectDB();
    const issue = await Issue.findById(id);
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    const isAuthority = session.user.role === "AUTHORITY";
    const isOwner = issue.reporter.toString() === session.user.id;
    if (!isAuthority && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!issue.emergency) {
      return NextResponse.json(
        { error: "This report is not an emergency — no helpline notification is needed" },
        { status: 400 }
      );
    }

    const allowed = servicesForCategory(issue.category);
    const services = [...new Set(requested)].filter(
      (key) => SERVICE_KEYS.includes(key) && allowed.includes(key)
    );
    if (services.length === 0) {
      return NextResponse.json({ error: "Choose at least one emergency service" }, { status: 400 });
    }

    // Never duplicate: a service is marked once per notifier.
    const already = new Set(
      issue.notifiedServices
        .filter((n) => n.by === (isAuthority ? "AUTHORITY" : "CITIZEN"))
        .map((n) => n.service)
    );
    const fresh = services.filter((key) => !already.has(key));

    if (fresh.length > 0) {
      issue.notifiedServices.push(
        ...fresh.map((key) => ({
          service: key,
          by: isAuthority ? "AUTHORITY" : "CITIZEN",
          method,
          at: new Date(),
        }))
      );
      await issue.save();

      await AlertLog.create({
        issue: issue._id,
        kind: isAuthority ? "AUTHORITY_FORWARD" : "CITIZEN_CALL",
        services: fresh,
        triggeredBy: method === "CALL" ? fresh[0] : null,
        phone: HELPLINE_PHONE,
        email: HELPLINE_EMAIL,
        channels: [
          {
            channel: "SMS",
            status: "SKIPPED",
            detail: `Dialled directly by ${isAuthority ? "authority" : "citizen"} — ${HELPLINE_PHONE}`,
          },
          {
            channel: "EMAIL",
            status: "SKIPPED",
            detail: `Call logged, email copy available at ${HELPLINE_EMAIL}`,
          },
        ],
        message: `${(method === "CALL" ? "Call placed to" : "Forwarded to")} ${fresh
          .map((key) => serviceMeta(key)?.label || key)
          .join(", ")} for issue #${issue._id.toString().slice(-6).toUpperCase()}`,
        createdBy: session.user.id,
      });
    }

    return NextResponse.json({
      ok: true,
      notified: issue.notifiedServices.map((n) => ({
        service: n.service,
        by: n.by,
        method: n.method,
        at: n.at,
      })),
      added: fresh,
      category: categoryMeta(issue.category).label,
      emergency: isEmergencyCategory(issue.category),
    });
  } catch (err) {
    console.error("notify services:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
