import { supabase } from "../lib/supabaseClient";

/**
 * Internal send — calls the Edge Function and throws on any non-2xx,
 * including 429 with a user-friendly message that includes the retry delay.
 */
async function sendEmail({ to, subject, body }) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { to, subject, body },
  });

  if (error) {
    // Supabase wraps Edge Function HTTP errors in error.context
    const status = error.context?.status;
    const payload = error.context
      ? await error.context.json().catch(() => null)
      : null;

    if (status === 429) {
      const retryAfter = error.context?.headers?.get("Retry-After");
      const wait = retryAfter ? ` Please wait ${retryAfter} seconds.` : "";
      throw new Error(`Too many emails sent.${wait}`);
    }

    throw new Error(payload?.error ?? error.message ?? "Failed to send email.");
  }

  return data;
}

// ── Public senders ────────────────────────────────────────────────────────────

export async function sendPaymentConfirmation({
  to,
  name,
  houseNumber,
  amount,
  month,
  year,
}) {
  return sendEmail({
    to,
    subject: `Payment Confirmed — ${month} ${year}`,
    body: [
      `Hi ${name},`,
      "",
      `Your levy payment of KES ${amount.toLocaleString()} for ${month} ${year} has been received and recorded.`,
      "",
      `House: ${houseNumber}`,
      "",
      "Thank you for keeping your account up to date.",
      "",
      "Stream Drive Estate Management",
    ].join("\n"),
  });
}

export async function sendPaymentReminder({ to, name, houseNumber }) {
  return sendEmail({
    to,
    subject: "Levy Payment Reminder",
    body: [
      `Hi ${name},`,
      "",
      "This is a friendly reminder that your monthly estate levy is due.",
      "",
      `House: ${houseNumber}`,
      "",
      "Please arrange payment at your earliest convenience.",
      "",
      "Stream Drive Estate Management",
    ].join("\n"),
  });
}

export async function sendOverdueNotice({ to, name, houseNumber }) {
  return sendEmail({
    to,
    subject: "Overdue Levy Notice",
    body: [
      `Hi ${name},`,
      "",
      "Our records show that your estate levy payment is overdue.",
      "",
      `House: ${houseNumber}`,
      "",
      "Please make payment as soon as possible to avoid further action.",
      "",
      "Stream Drive Estate Management",
    ].join("\n"),
  });
}
