import { supabase } from "../lib/supabase";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Map Supabase snake_case row to camelCase app model
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

// Map camelCase app model to Supabase snake_case
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

// ── API ───────────────────────────────────────────────────────────────────────

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
  return mapResident(data);
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
