// src/hooks/useRateLimit.js
import { useState, useRef, useCallback } from "react";

/**
 * useRateLimit — prevents a user from firing an action more than
 * `maxCalls` times within `windowMs` milliseconds.
 *
 * @param {object} options
 * @param {number} options.maxCalls   Max calls allowed in the window (default 3)
 * @param {number} options.windowMs   Rolling window in ms (default 60_000 = 1 min)
 * @param {string} options.message    Message shown when blocked
 *
 * @returns {{ guard, blocked, cooldownMessage, reset }}
 *   guard(fn)         — wraps an async fn; calls it only if not rate-limited
 *   blocked           — true while the caller is rate-limited
 *   cooldownMessage   — human-readable string to surface in the UI
 *   reset             — manually clear the limit (e.g. on page change)
 */
export function useRateLimit({
  maxCalls = 3,
  windowMs = 60_000,
  message = "Too many attempts. Please wait a moment before trying again.",
} = {}) {
  const timestamps = useRef([]); // rolling log of call timestamps
  const [blocked, setBlocked] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState("");

  const guard = useCallback(
    async (fn) => {
      const now = Date.now();

      // Drop timestamps outside the window
      timestamps.current = timestamps.current.filter((t) => now - t < windowMs);

      if (timestamps.current.length >= maxCalls) {
        const oldestInWindow = timestamps.current[0];
        const retryAfterMs = windowMs - (now - oldestInWindow);
        const retryAfterSec = Math.ceil(retryAfterMs / 1000);

        setBlocked(true);
        setCooldownMessage(
          retryAfterSec > 60
            ? message
            : `${message.replace(/\.$/, "")} (${retryAfterSec}s)`,
        );

        // Auto-clear when the window expires
        setTimeout(() => {
          setBlocked(false);
          setCooldownMessage("");
        }, retryAfterMs);

        return;
      }

      timestamps.current.push(now);
      await fn();
    },
    [maxCalls, windowMs, message],
  );

  const reset = useCallback(() => {
    timestamps.current = [];
    setBlocked(false);
    setCooldownMessage("");
  }, []);

  return { guard, blocked, cooldownMessage, reset };
}
