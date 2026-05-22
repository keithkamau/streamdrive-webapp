import { supabase } from "../lib/supabase";

// Map Supabase row to app model
function mapPayment(row) {
  return {
    id: row.id,
    residentId: row.resident_id,
    houseNumber: row.house_number,
    month: row.month,
    year: row.year,
    status: row.status,
    amount: row.amount,
    datePaid: row.date_paid,
    loggedBy: row.logged_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Get all payments for a given year ─────────────────────────────────────────
export async function getPaymentsByYear(year) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("year", year)
    .order("month", { ascending: true });

  if (error) throw error;
  return data.map(mapPayment);
}

// ── Get payments for a specific resident ─────────────────────────────────────
export async function getPaymentsByResident(residentId) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("resident_id", residentId)
    .order("year", { ascending: false });

  if (error) throw error;
  return data.map(mapPayment);
}

// ── Upsert a payment record ───────────────────────────────────────────────────
// Creates or updates based on unique (house_number, month, year)
export async function upsertPayment({
  residentId,
  houseNumber,
  month,
  year,
  status,
  amount,
  datePaid = null,
  loggedBy = null,
}) {
  const { data, error } = await supabase
    .from("payments")
    .upsert(
      {
        resident_id: residentId,
        house_number: houseNumber,
        month,
        year,
        status,
        amount,
        date_paid: datePaid,
        logged_by: loggedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "house_number,month,year" },
    )
    .select()
    .single();

  if (error) throw error;
  return mapPayment(data);
}

// ── Seed pending payments for all residents for a given month/year ────────────
// Call this at the start of each month or when a new resident is added
export async function seedMonthlyPayments(
  residents,
  month,
  year,
  amount = 3000,
) {
  const rows = residents.map((r) => ({
    resident_id: r.id,
    house_number: r.houseNumber,
    month,
    year,
    status: "pending",
    amount,
  }));

  const { error } = await supabase
    .from("payments")
    .upsert(rows, {
      onConflict: "house_number,month,year",
      ignoreDuplicates: true,
    });

  if (error) throw error;
}

// ── Build a payment map keyed by houseNumber → month → status ────────────────
// Used by AllPayments page
export function buildPaymentMap(payments) {
  const map = {};
  payments.forEach((p) => {
    if (!map[p.houseNumber]) map[p.houseNumber] = {};
    map[p.houseNumber][p.month] = p.status;
  });
  return map;
}
