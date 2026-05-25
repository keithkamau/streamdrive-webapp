// Email notification helpers — called by AllPayments, Residents, etc.
// Sends emails via the Supabase Edge Function "send-email" (Resend API).

import { supabase } from "../lib/supabase";
import { monthName } from "../lib/dateUtils";

async function sendEmail(to, subject, body) {
  const { error } = await supabase.functions.invoke("send-email", {
    body: { to, subject, body },
  });
  if (error) throw error;
}

function periodLabel(month, year) {
  return `${monthName(month)} ${year}`;
}

// ── Payment confirmation (status → paid) ─────────────────────────────────────
export async function sendPaymentConfirmation(resident, payment, month, year) {
  const period = periodLabel(month, year);
  const amount = (payment.amount ?? 0).toLocaleString("en-KE");

  await sendEmail(
    resident.email,
    `✅ Payment Confirmed — ${period}`,
    `Dear ${resident.name},\n\nYour levy payment of KES ${amount} for ${period} has been received and recorded.\n\nThank you.\n\nStream Drive Estate Management`,
  );
}

// ── Overdue notice (status → overdue) ────────────────────────────────────────
export async function sendOverdueNotice(resident, payment, month, year) {
  const period = periodLabel(month, year);
  const amount = (payment.amount ?? 0).toLocaleString("en-KE");

  await sendEmail(
    resident.email,
    `⚠️ Overdue Payment Notice — ${period}`,
    `Dear ${resident.name},\n\nOur records show that your levy payment of KES ${amount} for ${period} is overdue.\n\nPlease settle this at your earliest convenience to avoid further action.\n\nStream Drive Estate Management`,
  );
}

// ── Manual payment reminder ───────────────────────────────────────────────────
export async function sendPaymentReminder(resident, payment, month, year) {
  const period = periodLabel(month, year);
  const amount = (payment.amount ?? 0).toLocaleString("en-KE");

  await sendEmail(
    resident.email,
    `🔔 Payment Reminder — ${period}`,
    `Dear ${resident.name},\n\nThis is a friendly reminder that your levy payment of KES ${amount} for ${period} is due.\n\nPlease arrange payment at your earliest convenience.\n\nStream Drive Estate Management`,
  );
}
