import { supabase } from "../lib/supabase";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

function mapSettings(row) {
  return {
    estateName: row.estate_name,
    location: row.location,
    levyAmount: row.levy_amount,
    levyDueDay: row.levy_due_day,
    emailReminders: row.email_reminders,
    reminderDays: row.reminder_days,
    overdueReminders: row.overdue_reminders,
  };
}

export async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .single();

  if (error) throw error;
  return mapSettings(data);
}

export async function updateSettings(fields) {
  const row = {};
  if (fields.estateName !== undefined) row.estate_name = fields.estateName;
  if (fields.location !== undefined) row.location = fields.location;
  if (fields.levyAmount !== undefined) row.levy_amount = fields.levyAmount;
  if (fields.levyDueDay !== undefined) row.levy_due_day = fields.levyDueDay;
  if (fields.emailReminders !== undefined)
    row.email_reminders = fields.emailReminders;
  if (fields.reminderDays !== undefined)
    row.reminder_days = fields.reminderDays;
  if (fields.overdueReminders !== undefined)
    row.overdue_reminders = fields.overdueReminders;

  const { data, error } = await supabase
    .from("settings")
    .update(row)
    .eq("id", SETTINGS_ID)
    .select()
    .single();

  if (error) throw error;
  return mapSettings(data);
}
