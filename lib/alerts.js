import nodemailer from "nodemailer";
import { connectDB } from "@/lib/db";
import { AlertLog } from "@/lib/models";
import { HELPLINE_EMAIL, HELPLINE_PHONE, alertBody, alertSubject } from "@/lib/services";

/**
 * Real delivery for emergency alerts.
 *
 * EMAIL — sent through SMTP using env credentials:
 *     SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 465),
 *     SMTP_USER (mailbox that sends, e.g. a Gmail address),
 *     SMTP_PASS (Gmail: an App Password — https://myaccount.google.com/apppasswords),
 *     ALERT_FROM_EMAIL (optional From header, defaults to SMTP_USER),
 *     ALERT_EMAIL_TO   (optional recipient, defaults to HELPLINE_EMAIL).
 *
 *   With no SMTP_USER/SMTP_PASS the alert is still fully recorded so nothing
 *   is silently lost — the dashboard shows the channel as SKIPPED with a hint.
 *
 * SMS — POSTs { to, text } to ALERT_SMS_WEBHOOK_URL when configured.
 */

function smtpTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass },
  });
}

/** Turn common Gmail SMTP failures into actionable advice. */
function explainSmtpError(err) {
  const raw = `${err?.response || ""} ${err?.responseCode || ""} ${err?.message || ""}`.trim();
  if (/535|Username and Password not accepted|Invalid login/i.test(raw)) {
    return "Gmail rejected the login — SMTP_PASS must be a 16-character App Password from https://myaccount.google.com/apppasswords (2-Step Verification ON), not your normal password; paste it without spaces";
  }
  if (/534/i.test(raw)) {
    return "Gmail wants verification — check https://myaccount.google.com/notifications for a blocked sign-in alert and confirm it was you";
  }
  if (/ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|ENOTFOUND/i.test(raw)) {
    return `Network could not reach ${process.env.SMTP_HOST || "smtp.gmail.com"}:${process.env.SMTP_PORT || 465} — retry; if it persists the host may block outbound SMTP, try SMTP_PORT=587`;
  }
  if (/550|mailbox/i.test(raw)) {
    return "Recipient mailbox rejected the message — check ALERT_EMAIL_TO / helpline email spelling";
  }
  return raw || "Unknown SMTP error";
}

export async function sendHelplineEmail({ subject, text }) {
  const to = process.env.ALERT_EMAIL_TO || HELPLINE_EMAIL;
  const transport = smtpTransport();
  if (!transport) {
    return {
      channel: "EMAIL",
      status: "SKIPPED",
      detail: `Recorded for ${to} — set SMTP_USER + SMTP_PASS (Gmail App Password) to deliver email`,
    };
  }
  try {
    const info = await transport.sendMail({
      from: process.env.ALERT_FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return {
      channel: "EMAIL",
      status: "SENT",
      detail: `Email delivered to ${to} (${info.messageId})`,
    };
  } catch (err) {
    console.error("helpline email:", err?.responseCode, err?.response || err?.message);
    return {
      channel: "EMAIL",
      status: "FAILED",
      detail: `Email failed: ${explainSmtpError(err)}`,
    };
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
 * (phone + email) and store an auditable log entry. The email carries the full
 * report — issue ID, category, address, coordinates, map link, photo link and
 * the citizen's description — so the designated responder gets everything.
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
    sendHelplineEmail({ subject, text: message }),
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
