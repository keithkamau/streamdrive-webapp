// services/settingsService.js
import { supabase } from "../lib/supabase";

// ─── Fixed settings row UUID ──────────────────────────────────────────────────
// The settings table has a single row with a known UUID.
// If it doesn't exist yet we upsert it on first write.
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSettings(row) {
  return {
    id: row.id,
    estateName: row.estate_name ?? "",
    location: row.location ?? "",
    levyAmount: row.levy_amount ?? 0,
    levyDueDay: row.levy_due_day ?? 5,
    emailReminders: row.email_reminders ?? true,
    reminderDays: row.reminder_days ?? 3,
    overdueReminders: row.overdue_reminders ?? true,
  };
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) throw error;

  // Return sensible defaults if the row hasn't been created yet
  if (!data) {
    return mapSettings({ id: SETTINGS_ID });
  }

  return mapSettings(data);
}

export async function updateSettings(fields) {
  const updates = {};
  if (fields.estateName !== undefined) updates.estate_name = fields.estateName;
  if (fields.location !== undefined) updates.location = fields.location;
  if (fields.levyAmount !== undefined) updates.levy_amount = fields.levyAmount;
  if (fields.levyDueDay !== undefined) updates.levy_due_day = fields.levyDueDay;
  if (fields.emailReminders !== undefined)
    updates.email_reminders = fields.emailReminders;
  if (fields.reminderDays !== undefined)
    updates.reminder_days = fields.reminderDays;
  if (fields.overdueReminders !== undefined)
    updates.overdue_reminders = fields.overdueReminders;

  const { data, error } = await supabase
    .from("settings")
    .upsert({ id: SETTINGS_ID, ...updates })
    .select()
    .single();

  if (error) throw error;
  return mapSettings(data);
}

// ─── Admin houses ─────────────────────────────────────────────────────────────
// Stored in a separate `admin_houses` table: id, house_number (UNIQUE).
// This replaces the hardcoded ADMIN_HOUSES array in estateConfig.js.
//
// Required migration (run once in Supabase SQL editor):
//
//   create table if not exists admin_houses (
//     id           uuid primary key default gen_random_uuid(),
//     house_number text not null unique
//   );
//   alter table admin_houses enable row level security;
//   create policy "Authenticated full access"
//     on admin_houses for all using (auth.role() = 'authenticated');
//
// Seed your initial admin houses:
//   insert into admin_houses (house_number) values ('A1'), ('B3');

/**
 * Returns all admin house numbers as a plain string array.
 * e.g. ["A1", "B3"]
 */
export async function getAdminHouses() {
  const { data, error } = await supabase
    .from("admin_houses")
    .select("house_number")
    .order("house_number", { ascending: true });

  if (error) throw error;
  return data.map((row) => row.house_number);
}

/**
 * Adds a house number to the admin_houses table.
 * Throws if the house number is already in the table (unique constraint).
 */
export async function addAdminHouse(houseNumber) {
  const { error } = await supabase
    .from("admin_houses")
    .insert([{ house_number: houseNumber.trim().toUpperCase() }]);

  if (error) {
    // Translate the unique-constraint violation into a friendly message
    if (error.code === "23505") {
      throw new Error(`${houseNumber} is already an admin house.`);
    }
    throw error;
  }
}

/**
 * Removes a house number from the admin_houses table.
 */
export async function removeAdminHouse(houseNumber) {
  const { error } = await supabase
    .from("admin_houses")
    .delete()
    .eq("house_number", houseNumber);

  if (error) throw error;
}

/**
 * Returns true if the given house number is in the admin_houses table.
 * Used by AuthContext to determine admin status at login.
 */
export async function isAdminHouse(houseNumber) {
  const { data, error } = await supabase
    .from("admin_houses")
    .select("house_number")
    .eq("house_number", houseNumber)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}
