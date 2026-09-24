import { connectDB } from "@/lib/db";
import { AlertLog } from "@/lib/models";
import { HELPLINE_EMAIL, HELPLINE_PHONE, alertBody, alertSubject } from "@/lib/services";

/**
 * Delivery is intentionally pluggable. With no provider configured the alert is
 * still fully recorded (recipients, message, channels) so the authority sees
 * exactly what was dispatched — configure one env var to make it live:
 *
 *   RESEND_API_KEY=...            → sends the email through Resend
 *   ALERT_SMS_WEBHOOK_URL=...     → POSTs { to, text } to your SMS gateway
 */
async function deliverEmail({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      channel: "EMAIL",
      status: "SKIPPED",
      detail: `Recorded for ${to} — set RESEND_API_KEY to deliver email`,
    };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ALERT_FROM_EMAIL || "alerts@civix.local",
        to: [to],
        subject,
        text,
      }),
    });
    return {
      channel: "EMAIL",
      status: res.ok ? "SENT" : "FAILED",
      detail: res.ok ? `Email sent to ${to}` : `Email provider returned ${res.status}`,
    };
  } catch (err) {
    return { channel: "EMAIL", status: "FAILED", detail: err?.message || "Email failed" };
  }
}

async function deliverSms({ to, text }) {
  const url = process.env.ALERT_SMS_WEBHOOK_URL;
  if (!url) {
    return {
      channel: "SMS",
      status: "SKIPPED",
      detail: `Recorded for ${to} — set ALERT_SMS_WEBHOOK_URL to deliver SMS`,
    };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, text }),
    });
    return {
      channel: "SMS",
      status: res.ok ? "SENT" : "FAILED",
      detail: res.ok ? `SMS sent to ${to}` : `SMS gateway returned ${res.status}`,
    };
  } catch (err) {
    return { channel: "SMS", status: "FAILED", detail: err?.message || "SMS failed" };
  }
}

/**
 * Forward an emergency issue to the police / ambulance / fire brigade helpline
 * (phone + email) and store an auditable log entry.
 */
export async function dispatchEmergencyAlert({
  issue,
  services,
  source = "AUTHORITY",
  triggeredBy = null,
  actorId = null,
}) {
  await connectDB();

  const message = alertBody(issue, { source, services });
  const subject = alertSubject(issue);

  const [sms, email] = await Promise.all([
    deliverSms({ to: HELPLINE_PHONE, text: message }),
    deliverEmail({ to: HELPLINE_EMAIL, subject, text: message }),
  ]);

  const log = await AlertLog.create({
    issue: issue.id || issue._id,
    kind: source === "CITIZEN" ? "CITIZEN_CALL" : "AUTHORITY_FORWARD",
    services,
    triggeredBy,
    phone: HELPLINE_PHONE,
    email: HELPLINE_EMAIL,
    channels: [sms, email],
    message,
    createdBy: actorId,
  });

  return {
    logId: log._id.toString(),
    message,
    channels: [sms, email],
    recipients: { phone: HELPLINE_PHONE, email: HELPLINE_EMAIL },
  };
}
