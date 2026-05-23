import { supabase } from "../lib/supabase";
import { seedMonthlyPayments } from "./paymentService";

const CURRENT_YEAR = 2025;
const CURRENT_MONTH = "June";

function mapResident(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    houseNumber: row.house_number,
    isAdmin: row.is_admin,
    joinedAt: row.joined_at,
    paymentStatus: row.payment_status,
    monthsOverdue: row.months_overdue,
  };
}

function mapToRow(fields) {
  const row = {};
  if (fields.name !== undefined) row.name = fields.name;
  if (fields.email !== undefined) row.email = fields.email;
  if (fields.phone !== undefined) row.phone = fields.phone;
  if (fields.houseNumber !== undefined) row.house_number = fields.houseNumber;
  if (fields.isAdmin !== undefined) row.is_admin = fields.isAdmin;
  if (fields.paymentStatus !== undefined)
    row.payment_status = fields.paymentStatus;
  if (fields.monthsOverdue !== undefined)
    row.months_overdue = fields.monthsOverdue;
  return row;
}

export async function getResidents() {
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .order("house_number", { ascending: true });

  if (error) throw error;
  return data.map(mapResident);
}

export async function getResident(id) {
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return mapResident(data);
}

export async function addResident(fields) {
  const { data, error } = await supabase
    .from("residents")
    .insert([mapToRow(fields)])
    .select()
    .single();

  if (error) throw error;

  const newResident = mapResident(data);

  // Auto-seed a pending payment for the current month
  try {
    await seedMonthlyPayments([newResident], CURRENT_MONTH, CURRENT_YEAR);
  } catch (err) {
    // Non-fatal — log but don't block the resident creation
    console.warn(
      "[ResidentService] Failed to seed payment for new resident:",
      err,
    );
  }

  return newResident;
}

export async function updateResident(id, fields) {
  const { data, error } = await supabase
    .from("residents")
    .update(mapToRow(fields))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapResident(data);
}

export async function deleteResident(id) {
  const { error } = await supabase.from("residents").delete().eq("id", id);

  if (error) throw error;
}

export async function updatePaymentStatus(
  id,
  paymentStatus,
  monthsOverdue = 0,
) {
  return updateResident(id, { paymentStatus, monthsOverdue });
}

// ── Seed all residents for a new month ────────────────────────────────────────
// Call this at the start of each month from Settings or a cron job
export async function seedNewMonth(month, year) {
  const residents = await getResidents();
  await seedMonthlyPayments(residents, month, year);
}
