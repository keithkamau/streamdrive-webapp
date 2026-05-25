// dateUtils.js
// Single source of truth for the current month/year.
// All pages derive from here — no more hardcoded 2025/June.

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Returns the current calendar year as a number, e.g. 2025 */
export function getCurrentYear() {
  return new Date().getFullYear();
}

/**
 * Returns the current calendar month as a 1-based number.
 * January = 1 … December = 12
 */
export function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

/** Returns the current month's full name, e.g. "June" */
export function getCurrentMonthName() {
  return MONTH_NAMES[new Date().getMonth()];
}

/**
 * Returns the full name for any 1-based month number.
 * monthName(6) → "June"
 */
export function monthName(month) {
  return MONTH_NAMES[month - 1] ?? "";
}

/**
 * Returns all 12 month names in order, paired with their 1-based index.
 * Useful for dropdowns: [{ value: 1, label: "January" }, …]
 */
export function allMonths() {
  return MONTH_NAMES.map((label, i) => ({ value: i + 1, label }));
}

/**
 * Formats a month+year pair as a readable string.
 * formatMonthYear(6, 2025) → "June 2025"
 */
export function formatMonthYear(month, year) {
  return `${monthName(month)} ${year}`;
}

/**
 * Given a month (1-based) and year, returns the previous month+year.
 * Wraps correctly across year boundaries.
 * prevMonth(1, 2025) → { month: 12, year: 2024 }
 */
export function prevMonth(month, year) {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

/**
 * Given a month (1-based) and year, returns the next month+year.
 * nextMonth(12, 2024) → { month: 1, year: 2025 }
 */
export function nextMonth(month, year) {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}

/**
 * Returns an array of { month, year } objects for the last N months
 * (including the current month), most-recent first.
 * lastNMonths(6) → [{ month: 6, year: 2025 }, …, { month: 1, year: 2025 }]
 */
export function lastNMonths(n = 6) {
  const result = [];
  let m = getCurrentMonth();
  let y = getCurrentYear();
  for (let i = 0; i < n; i++) {
    result.push({ month: m, year: y });
    ({ month: m, year: y } = prevMonth(m, y));
  }
  return result;
}
