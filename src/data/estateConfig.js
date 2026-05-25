// ─────────────────────────────────────────────────────────────────────────────
//  STREAM DRIVE — ESTATE CONFIGURATION
//  House numbers are now managed in the database via the Houses page.
//  Only admin house assignments and the default levy are configured here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * House numbers with ADMIN privileges.
 * Update this array after each estate management election.
 * Any resident registered with one of these house numbers
 * will have full admin access.
 */
export const ADMIN_HOUSES = ["SD-01", "SD-05", "SD-10"];

/** Check if a house number has admin privileges */
export const isAdminHouse = (houseNumber) => ADMIN_HOUSES.includes(houseNumber);

/** Default monthly security levy in KES */
export const DEFAULT_LEVY_AMOUNT = 3000;
