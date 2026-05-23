import { useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * Subscribe to real-time changes on a Supabase table.
 * Calls onchange() whenever any INSERT, UPDATE or DELETE occurs.
 *
 * Usage:
 *   useRealtime('payments', reload);
 *   useRealtime('residents', reload);
 */
export function useRealtime(table, onChange) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          console.log(`[Realtime] ${table} changed:`, payload.eventType);
          onChange(payload);
        },
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${table} subscription:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onChange]);
}
