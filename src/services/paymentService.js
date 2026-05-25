// services/paymentService.js
import { supabase } from "../lib/supabase";
import { getCurrentMonth, getCurrentYear } from "../lib/dateUtils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapPayment(row) {
  return {
    id: row.id,
    residentId: row.resident_id,
    houseNumber: row.house_number,
    month: row.month,
    year: row.year,
    status: row.status, // "pending" | "paid" | "overdue"
    amount: row.amount,
    datePaid: row.date_paid,
    loggedBy: row.logged_by,
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

/** Fetch every payment row for a given month + year. */
export async function getPaymentsForMonth(month, year) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("month", month)
    .eq("year", year)
    .order("house_number", { ascending: true });

  if (error) throw error;
  return data.map(mapPayment);
}

/** Fetch all payments for a specific resident. */
export async function getPaymentsForResident(residentId) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("resident_id", residentId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw error;
  return data.map(mapPayment);
}

/**
 * Fetch payments for multiple months and build a map keyed by
 * `${houseNumber}-${month}-${year}` for O(1) lookup in the payment matrix.
 *
 * @param {Array<{month: number, year: number}>} monthList
 * @returns {Object} paymentMap
 */
export async function buildPaymentMap(monthList) {
  if (!monthList.length) return {};

  // Build OR conditions for each month+year combination
  const filters = monthList.map(
    ({ month, year }) => `and(month.eq.${month},year.eq.${year})`,
  );

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .or(filters.join(","));

  if (error) throw error;

  const map = {};
  data.forEach((row) => {
    const key = `${row.house_number}-${row.month}-${row.year}`;
    map[key] = mapPayment(row);
  });

  return map;
}

/** Fetch payments for the current month (dynamic). */
export async function getPaymentsForCurrentMonth() {
  return getPaymentsForMonth(getCurrentMonth(), getCurrentYear());
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Upsert a single payment record.
 * Cycles: pending → paid → overdue → pending (handled by AllPayments page).
 */
export async function upsertPayment({
  residentId,
  houseNumber,
  month,
  year,
  status,
  amount,
  datePaid,
  loggedBy,
}) {
  const { data, error } = await supabase
    .from("payments")
    .upsert(
      [
        {
          resident_id: residentId,
          house_number: houseNumber,
          month,
          year,
          status,
          amount,
          date_paid: datePaid ?? null,
          logged_by: loggedBy ?? null,
        },
      ],
      { onConflict: "house_number,month,year" },
    )
    .select()
    .single();

  if (error) throw error;
  return mapPayment(data);
}

// ─── Seeding ─────────────────────────────────────────────────────────────────

/**
 * Seed pending payments for ALL residents for a given month + year.
 * Skips houses that already have a record for that period (upsert with
 * ignoreDuplicates = false keeps existing records untouched via onConflict).
 *
 * Uses getCurrentMonth() / getCurrentYear() when no args supplied,
 * so callers no longer need to hardcode the date.
 *
 * @param {number} [month]  - defaults to current month
 * @param {number} [year]   - defaults to current year
 * @param {number} [amount] - defaults to levy_amount from settings
 */
export async function seedMonthlyPayments(month, year, amount) {
  const targetMonth = month ?? getCurrentMonth();
  const targetYear = year ?? getCurrentYear();

  // Resolve levy amount if not passed in
  let levyAmount = amount;
  if (levyAmount === undefined) {
    const { data: settings } = await supabase
      .from("settings")
      .select("levy_amount")
      .maybeSingle();
    levyAmount = settings?.levy_amount ?? 0;
  }

  // Fetch all residents
  const { data: residents, error: resError } = await supabase
    .from("residents")
    .select("id, house_number");

  if (resError) throw resError;

  const rows = residents.map((r) => ({
    resident_id: r.id,
    house_number: r.house_number,
    month: targetMonth,
    year: targetYear,
    status: "pending",
    amount: levyAmount,
    date_paid: null,
    logged_by: null,
  }));

  if (!rows.length) return;

  // ignoreDuplicates: true → existing records are NOT overwritten
  const { error } = await supabase
    .from("payments")
    .upsert(rows, {
      onConflict: "house_number,month,year",
      ignoreDuplicates: true,
    });

  if (error) throw error;
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

/**
 * Returns counts of paid / pending / overdue for the current month.
 * Used by Dashboard stats cards.
 */
export async function getCurrentMonthStats() {
  const month = getCurrentMonth();
  const year = getCurrentYear();

  const { data, error } = await supabase
    .from("payments")
    .select("status")
    .eq("month", month)
    .eq("year", year);

  if (error) throw error;

  const stats = { paid: 0, pending: 0, overdue: 0 };
  data.forEach((row) => {
    if (stats[row.status] !== undefined) stats[row.status]++;
  });

  return stats;
}

/**
 * Returns monthly collection totals for the last N months.
 * Used by the Dashboard trend chart.
 *
 * @param {Array<{month: number, year: number}>} monthList
 * @returns {Array<{month, year, total, paid}>}
 */
export async function getCollectionTrend(monthList) {
  if (!monthList.length) return [];

  const filters = monthList.map(
    ({ month, year }) => `and(month.eq.${month},year.eq.${year})`,
  );

  const { data, error } = await supabase
    .from("payments")
    .select("month, year, status, amount")
    .or(filters.join(","));

  if (error) throw error;

  // Aggregate per month+year
  const trendMap = {};
  monthList.forEach(({ month, year }) => {
    trendMap[`${month}-${year}`] = { month, year, total: 0, paid: 0 };
  });

  data.forEach((row) => {
    const key = `${row.month}-${row.year}`;
    if (trendMap[key]) {
      trendMap[key].total += row.amount ?? 0;
      if (row.status === "paid") trendMap[key].paid += row.amount ?? 0;
    }
  });

  return monthList.map(({ month, year }) => trendMap[`${month}-${year}`]);
}
