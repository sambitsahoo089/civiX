import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AlertLog, Issue, StatusChange } from "@/lib/models";
import { saveImage } from "@/lib/storage";
import { CATEGORY_KEYS, isEmergencyCategory, servicesForCategory } from "@/lib/categories";
import { HELPLINE_EMAIL, HELPLINE_PHONE, SERVICE_KEYS, serviceMeta } from "@/lib/services";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to report an issue" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const category = String(form.get("category") || "");
    const description = String(form.get("description") || "").trim();
    const address = String(form.get("address") || "").trim() || null;
    const latitude = Number(form.get("latitude"));
    const longitude = Number(form.get("longitude"));
    const photo = form.get("photo");
    const notifiedRaw = String(form.get("notifiedServices") || "");

    if (!CATEGORY_KEYS.includes(category)) {
      return NextResponse.json({ error: "Please choose a valid category" }, { status: 400 });
    }
    if (description.length < 10) {
      return NextResponse.json(
        { error: "Please describe the issue in at least 10 characters" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: "A valid location is required" }, { status: 400 });
    }
    if (!photo || typeof photo === "string") {
      return NextResponse.json({ error: "A photo of the issue is required" }, { status: 400 });
    }

    // Emergency categories let the citizen tap "call police / ambulance / fire
    // brigade" while reporting — those taps are stored with the report so the
    // authority dashboard knows the services were already informed.
    const emergency = isEmergencyCategory(category);
    const allowedServices = servicesForCategory(category);
    const notified = [...new Set(notifiedRaw.split(",").map((s) => s.trim()))].filter(
      (key) => SERVICE_KEYS.includes(key) && allowedServices.includes(key)
    );
    if (!emergency && notified.length > 0) {
      return NextResponse.json(
        { error: "Helpline notifications only apply to emergency categories" },
        { status: 400 }
      );
    }

    const imageUrl = await saveImage(photo);

    await connectDB();
    const issue = await Issue.create({
      category,
      description,
      latitude,
      longitude,
      address,
      imageUrl,
      reporter: session.user.id,
      status: "REPORTED",
      emergency,
      notifiedServices: notified.map((key) => ({
        service: key,
        by: "CITIZEN",
        method: "CALL",
        at: new Date(),
      })),
    });

    await StatusChange.create({
      issue: issue._id,
      toStatus: "REPORTED",
      note: "Issue reported by citizen",
      changedBy: session.user.id,
    });

    if (notified.length > 0) {
      await AlertLog.create({
        issue: issue._id,
        kind: "CITIZEN_CALL",
        services: notified,
        triggeredBy: notified[0],
        phone: HELPLINE_PHONE,
        email: HELPLINE_EMAIL,
        channels: [
          {
            channel: "SMS",
            status: "SKIPPED",
            detail: `Citizen dialled ${HELPLINE_PHONE} directly from the report form`,
          },
          {
            channel: "EMAIL",
            status: "SKIPPED",
            detail: `Call logged at reporting time — email copy available at ${HELPLINE_EMAIL}`,
          },
        ],
        message: `Citizen informed ${notified
          .map((key) => serviceMeta(key)?.label || key)
          .join(", ")} while reporting an emergency`,
        createdBy: session.user.id,
      });
    }

    return NextResponse.json({ id: issue._id.toString(), emergency, notified });
  } catch (err) {
    console.error("create report:", err);
    const message = err?.message || "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}