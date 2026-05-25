// data/estateConfig.js
//
// ADMIN_HOUSES has been migrated to the `admin_houses` Supabase table.
// Manage admin houses from Settings → Admin Houses in the app.
//
// To seed your initial admin houses, run in Supabase SQL editor:
//   insert into admin_houses (house_number) values ('A1'), ('B3');
//
// The isAdminHouse() helper is now in services/settingsService.js and
// queries the DB at login time — no code changes needed when admins change.

/**
 * Default levy amount used only when the settings row doesn't exist yet
 * (i.e. a brand-new installation before an admin has saved Settings).
 * Once Settings → Levy is saved this value is ignored.
 */
export const DEFAULT_LEVY_AMOUNT = 5000;

// ── Legacy export kept so any file that imports isAdminHouse from here
// does not get a hard import error. It throws to make the misconfiguration
// obvious rather than silently returning false.
// Remove this once all call sites have been updated to use settingsService.
export function isAdminHouse() {
  throw new Error(
    "isAdminHouse() has moved to services/settingsService.js. " +
      "Import it from there instead.",
  );
}
