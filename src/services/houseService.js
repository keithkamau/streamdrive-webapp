import { supabase } from "../lib/supabase";

function mapHouse(row) {
  return {
    id: row.id,
    houseNumber: row.house_number,
    createdAt: row.created_at,
  };
}

// ── Get all house numbers ─────────────────────────────────────────────────────
export async function getHouses() {
  const { data, error } = await supabase
    .from("houses")
    .select("*")
    .order("house_number", { ascending: true });

  if (error) throw error;
  return data.map(mapHouse);
}

// ── Add a new house number ────────────────────────────────────────────────────
export async function addHouse(houseNumber) {
  const normalised = houseNumber.trim().toUpperCase();

  if (!normalised) throw new Error("House number cannot be empty.");

  const { data, error } = await supabase
    .from("houses")
    .insert([{ house_number: normalised }])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`${normalised} already exists in the estate.`);
    }
    throw error;
  }

  return mapHouse(data);
}

// ── Delete a house number ─────────────────────────────────────────────────────
export async function deleteHouse(id) {
  const { error } = await supabase.from("houses").delete().eq("id", id);

  if (error) throw error;
}

// ── Check if a house number is already assigned to a resident ─────────────────
export async function isHouseOccupied(houseNumber) {
  const { data, error } = await supabase
    .from("residents")
    .select("id")
    .eq("house_number", houseNumber.trim().toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
