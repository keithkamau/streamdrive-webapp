import { supabase } from "../lib/supabase";

// ── Send email via Supabase Edge Function ─────────────────────────────────────
async function sendEmail(to, subject, body) {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, body },
    });

    if (error) {
      console.error("[Notifications] Edge function error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Notifications] Failed to send email:", err);
    return { success: false, error: err.message };
  }
}

// ── Message templates ─────────────────────────────────────────────────────────
function paymentConfirmationTemplate({
  residentName,
  houseNumber,
  month,
  amount,
  datePaid,
}) {
  return {
    subject: `Payment Confirmed — ${month} Security Levy`,
    body: `Dear ${residentName},

Your security levy payment has been received and recorded.

Details:
  House Number : ${houseNumber}
  Month        : ${month}
  Amount Paid  : KES ${Number(amount).toLocaleString()}
  Date Logged  : ${datePaid}

Thank you for your prompt payment. This helps keep Stream Drive
safe and well maintained for all residents.

Warm regards,
Stream Drive Estate Management
Nairobi, Kenya`,
  };
}

function paymentReminderTemplate({
  residentName,
  houseNumber,
  month,
  amount,
  daysLeft,
}) {
  return {
    subject: `Reminder — ${month} Security Levy Due in ${daysLeft} Days`,
    body: `Dear ${residentName},

This is a friendly reminder that your monthly security levy
payment is due soon.

Details:
  House Number : ${houseNumber}
  Month        : ${month}
  Amount Due   : KES ${Number(amount).toLocaleString()}
  Due In       : ${daysLeft} day${daysLeft !== 1 ? "s" : ""}

Please ensure payment is made before the end of the month.
If you have already made payment, kindly disregard this message.

Warm regards,
Stream Drive Estate Management
Nairobi, Kenya`,
  };
}

function overdueNoticeTemplate({ residentName, houseNumber, month, amount }) {
  return {
    subject: `Overdue Notice — ${month} Security Levy`,
    body: `Dear ${residentName},

Our records indicate that your security levy payment
for ${month} is currently overdue.

Details:
  House Number   : ${houseNumber}
  Month          : ${month}
  Amount Overdue : KES ${Number(amount).toLocaleString()}

Please make payment as soon as possible or contact the
estate management team to discuss your situation.

Warm regards,
Stream Drive Estate Management
Nairobi, Kenya`,
  };
}

// ── Exported dispatchers ──────────────────────────────────────────────────────

export async function notifyPaymentConfirmation(resident, paymentDetails) {
  const { month, amount, datePaid } = paymentDetails;
  const { subject, body } = paymentConfirmationTemplate({
    residentName: resident.name,
    houseNumber: resident.houseNumber,
    month,
    amount,
    datePaid,
  });
  return sendEmail(resident.email, subject, body);
}

export async function notifyPaymentReminder(resident, reminderDetails) {
  const { month, amount, daysLeft } = reminderDetails;
  const { subject, body } = paymentReminderTemplate({
    residentName: resident.name,
    houseNumber: resident.houseNumber,
    month,
    amount,
    daysLeft,
  });
  return sendEmail(resident.email, subject, body);
}

export async function notifyOverdue(resident, overdueDetails) {
  const { month, amount } = overdueDetails;
  const { subject, body } = overdueNoticeTemplate({
    residentName: resident.name,
    houseNumber: resident.houseNumber,
    month,
    amount,
  });
  return sendEmail(resident.email, subject, body);
}
