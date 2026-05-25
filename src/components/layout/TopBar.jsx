// components/layout/TopBar.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getRecentNotifications,
  markAllRead,
  markOneRead,
} from "../../services/notificationService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
  });
}

const TYPE_META = {
  paid: { icon: "✅", color: "text-green-600 dark:text-green-400" },
  overdue: { icon: "⚠️", color: "text-red-500  dark:text-red-400" },
  announcement: { icon: "📢", color: "text-blue-500 dark:text-blue-400" },
};

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES = {
  dashboard: "Dashboard",
  announcements: "Announcements",
  "admin-payments": "Payment Records",
  residents: "Residents",
  houses: "Houses",
  settings: "Settings",
  profile: "Profile",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopBar({ currentPage, setCurrentPage }) {
  const { signOut, displayName } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellLoading, setBellLoading] = useState(false);

  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Load notifications ────────────────────────────────────────────────────

  const loadNotifications = useCallback(async () => {
    try {
      setBellLoading(true);
      const data = await getRecentNotifications();
      setNotifications(data);
    } catch {
      // Bell failures are non-critical — fail silently
    } finally {
      setBellLoading(false);
    }
  }, []);

  // Load on mount; refresh every 2 minutes
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // ── Close dropdown on outside click ──────────────────────────────────────

  useEffect(() => {
    if (!bellOpen) return;

    const handler = (e) => {
      if (
        bellRef.current &&
        !bellRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setBellOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  // ── Bell click — open and mark all read ──────────────────────────────────

  const handleBellClick = () => {
    if (!bellOpen) {
      setBellOpen(true);
      // Optimistically mark all as read in state + localStorage
      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);
      markAllRead(updated);
    } else {
      setBellOpen(false);
    }
  };

  // ── Navigate to relevant page from a notification ────────────────────────

  const handleNotificationClick = (n) => {
    markOneRead(n.id);
    setBellOpen(false);

    if (n.type === "paid" || n.type === "overdue") {
      setCurrentPage("admin-payments");
      window.location.hash = "#admin-payments";
    } else if (n.type === "announcement") {
      setCurrentPage("announcements");
      window.location.hash = "#announcements";
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const pageTitle = PAGE_TITLES[currentPage] ?? "Dashboard";

  return (
    <header className='h-14 flex items-center justify-between px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0'>
      {/* Page title */}
      <h2 className='text-base font-display font-semibold text-zinc-800 dark:text-zinc-100 truncate'>
        {pageTitle}
      </h2>

      {/* Right controls */}
      <div className='flex items-center gap-1'>
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className='w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {/* ── Notification bell ── */}
        <div className='relative'>
          <button
            ref={bellRef}
            onClick={handleBellClick}
            className='w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative'
            aria-label='Notifications'
            title='Notifications'
          >
            {/* Bell icon */}
            <svg
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.8}
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
              />
            </svg>

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className='absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-900' />
            )}
          </button>

          {/* ── Dropdown panel ── */}
          {bellOpen && (
            <div
              ref={dropdownRef}
              className='absolute right-0 top-11 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in'
            >
              {/* Header */}
              <div className='flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800'>
                <span className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
                  Recent Activity
                </span>
                <button
                  onClick={loadNotifications}
                  className='text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors'
                  title='Refresh'
                  disabled={bellLoading}
                >
                  {bellLoading ? "…" : "↻"}
                </button>
              </div>

              {/* List */}
              <div className='max-h-80 overflow-y-auto'>
                {bellLoading && notifications.length === 0 ? (
                  <div className='py-8 text-center text-sm text-zinc-400'>
                    Loading…
                  </div>
                ) : notifications.length === 0 ? (
                  <div className='py-8 text-center'>
                    <p className='text-2xl mb-2'>🔔</p>
                    <p className='text-sm text-zinc-400'>No recent activity</p>
                  </div>
                ) : (
                  <ul>
                    {notifications.map((n) => {
                      const meta = TYPE_META[n.type] ?? TYPE_META.announcement;
                      return (
                        <li key={n.id}>
                          <button
                            onClick={() => handleNotificationClick(n)}
                            className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 ${
                              n.read ? "opacity-60" : ""
                            }`}
                          >
                            {/* Icon */}
                            <span className='text-base mt-0.5 shrink-0'>
                              {meta.icon}
                            </span>

                            {/* Content */}
                            <div className='flex-1 min-w-0'>
                              <p
                                className={`text-sm font-medium truncate ${meta.color}`}
                              >
                                {n.title}
                              </p>
                              <p className='text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5'>
                                {n.body}
                              </p>
                            </div>

                            {/* Time */}
                            <span className='text-xs text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5'>
                              {relativeTime(n.timestamp)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className='px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40'>
                  <button
                    onClick={() => {
                      setCurrentPage("admin-payments");
                      window.location.hash = "#admin-payments";
                      setBellOpen(false);
                    }}
                    className='text-xs text-green-600 dark:text-green-400 hover:underline font-medium'
                  >
                    View all payments →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className='ml-1 px-3 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
          title={`Sign out (${displayName})`}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
