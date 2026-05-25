// services/residentService.js
import { supabase } from "../lib/supabase";
import { getCurrentMonth, getCurrentYear } from "../lib/dateUtils";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getResidents() {
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .order("house_number", { ascending: true });

  if (error) throw error;
  return data.map(mapResident);
}

export async function getResidentByEmail(email) {
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data ? mapResident(data) : null;
}

export async function getResidentById(id) {
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapResident(data) : null;
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function addResident(fields) {
  const { data, error } = await supabase
    .from("residents")
    .insert([
      {
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        house_number: fields.houseNumber,
        is_admin: fields.isAdmin ?? false,
        payment_status: "pending",
        months_overdue: 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  const resident = mapResident(data);

  // Auto-seed a pending payment for the current month using dynamic date
  await seedResidentCurrentMonth(resident.id, resident.houseNumber);

  return resident;
}

export async function updateResident(id, fields) {
  const updates = {};
  if (fields.name !== undefined) updates.name = fields.name;
  if (fields.email !== undefined) updates.email = fields.email;
  if (fields.phone !== undefined) updates.phone = fields.phone;
  if (fields.houseNumber !== undefined)
    updates.house_number = fields.houseNumber;
  if (fields.isAdmin !== undefined) updates.is_admin = fields.isAdmin;
  if (fields.paymentStatus !== undefined)
    updates.payment_status = fields.paymentStatus;
  if (fields.monthsOverdue !== undefined)
    updates.months_overdue = fields.monthsOverdue;

  const { data, error } = await supabase
    .from("residents")
    .update(updates)
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

// ─── Payment seeding ─────────────────────────────────────────────────────────

/**
 * Seeds a pending payment for a single resident for the current month.
 * Uses dynamic getCurrentMonth() / getCurrentYear() — no hardcoding.
 */
async function seedResidentCurrentMonth(residentId, houseNumber) {
  const month = getCurrentMonth();
  const year = getCurrentYear();

  // Get default levy amount from settings
  const { data: settings } = await supabase
    .from("settings")
    .select("levy_amount")
    .maybeSingle();

  const amount = settings?.levy_amount ?? 0;

  const { error } = await supabase.from("payments").upsert(
    [
      {
        resident_id: residentId,
        house_number: houseNumber,
        month,
        year,
        status: "pending",
        amount,
        date_paid: null,
        logged_by: null,
      },
    ],
    { onConflict: "house_number,month,year" },
  );

  if (error) throw error;
}
