// services/notificationService.js
//
// Fetches recent activity for the notification bell in TopBar.
// Two sources:
//   1. payments — rows whose status changed to "paid" or "overdue" recently
//   2. announcements — posts created recently
//
// Returns a unified, time-sorted array of notification objects.

import { supabase } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
//
// Notification shape:
// {
//   id:        string          unique key (source:row-id)
//   type:      "paid" | "overdue" | "announcement"
//   title:     string
//   body:      string
//   timestamp: string          ISO date string
//   read:      boolean         managed in localStorage
// }

const STORAGE_KEY = "sde_read_notification_ids";

// ─── Read-state helpers (localStorage) ───────────────────────────────────────

function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function markAllRead(notifications) {
  try {
    const ids = notifications.map((n) => n.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function markOneRead(notificationId) {
  try {
    const ids = getReadIds();
    ids.add(notificationId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

// ─── Main query ───────────────────────────────────────────────────────────────

/**
 * Fetch the most recent activity for the notification bell.
 *
 * @param {number} [limit=20]  max total notifications to return
 * @param {number} [days=14]   how many days back to look
 */
export async function getRecentNotifications(limit = 20, days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const readIds = getReadIds();

  // Run both queries in parallel
  const [paymentsResult, announcementsResult] = await Promise.allSettled([
    supabase
      .from("payments")
      .select("id, house_number, status, amount, date_paid, month, year")
      .in("status", ["paid", "overdue"])
      .gte("date_paid", sinceISO)
      .order("date_paid", { ascending: false })
      .limit(limit),

    supabase
      .from("announcements")
      .select("id, title, body, posted_by, created_at")
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const notifications = [];

  // ── Payment notifications ──────────────────────────────────────────────────
  if (paymentsResult.status === "fulfilled" && !paymentsResult.value.error) {
    const rows = paymentsResult.value.data ?? [];
    rows.forEach((p) => {
      const id = `payment:${p.id}`;
      notifications.push({
        id,
        type: p.status, // "paid" or "overdue"
        title:
          p.status === "paid"
            ? `House ${p.house_number} paid`
            : `House ${p.house_number} overdue`,
        body:
          p.status === "paid"
            ? `KES ${(p.amount ?? 0).toLocaleString()} received`
            : `KES ${(p.amount ?? 0).toLocaleString()} outstanding`,
        timestamp: p.date_paid,
        read: readIds.has(id),
      });
    });
  }

  // ── Announcement notifications ────────────────────────────────────────────
  if (
    announcementsResult.status === "fulfilled" &&
    !announcementsResult.value.error
  ) {
    const rows = announcementsResult.value.data ?? [];
    rows.forEach((a) => {
      const id = `announcement:${a.id}`;
      // Trim body preview to 60 chars
      const preview =
        a.body?.length > 60 ? `${a.body.slice(0, 60)}…` : (a.body ?? "");
      notifications.push({
        id,
        type: "announcement",
        title: a.title ?? "New announcement",
        body: preview,
        timestamp: a.created_at,
        read: readIds.has(id),
      });
    });
  }

  // Sort newest-first across both sources, then cap at limit
  notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return notifications.slice(0, limit);
}
