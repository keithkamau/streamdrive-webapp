// ─────────────────────────────────────────────
//  STREAM DRIVE — ESTATE CONFIGURATION
//  Update these arrays as needed.
// ─────────────────────────────────────────────

/**
 * Full list of house numbers in the estate.
 * Format: 'SD-XX' or 'SD-XXA' / 'SD-XXB' for split houses.
 * Add or remove entries to match the actual estate layout.
 */
export const HOUSE_NUMBERS = [
  // Add your house numbers here:
  "SD-01",
  "SD-02",
  "SD-03",
  "SD-04",
  "SD-05",
  "SD-06",
  "SD-07",
  "SD-08",
  "SD-09",
  "SD-10",
  "SD-11A",
  "SD-11B",
  "SD-12",
  "SD-13",
  "SD-14",
  "SD-15",
  "SD-16",
  "SD-17",
  "SD-18",
  "SD-19",
  "SD-20",
];

/**
 * House numbers with ADMIN privileges.
 * Update this array after each estate management election.
 */
export const ADMIN_HOUSES = [
  // Update after each election:
  "SD-01",
  "SD-05",
  "SD-10",
];

/** Check if a house number has admin privileges */
export const isAdminHouse = (houseNumber) => ADMIN_HOUSES.includes(houseNumber);

/** Monthly security levy amount in KES — admins can override this from the dashboard */
export const DEFAULT_LEVY_AMOUNT = 3000;
