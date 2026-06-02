// supabase/functions/send-email/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// ---------- Rate limiting (token bucket) ----------
const BUCKET_CAPACITY = 10;
const REFILL_RATE_MS = 6_000;
const BUCKET_TTL_MS = 10 * 60_000;

interface Bucket {
  tokens: number;
  lastRefill: number;
  lastSeen: number;
}

const buckets = new Map<string, Bucket>();

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function allowRequest(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  // Probabilistic TTL pruning (2% per request)
  if (Math.random() < 0.02) {
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastSeen > BUCKET_TTL_MS) buckets.delete(key);
    }
  }

  const bucket = buckets.get(ip) ?? {
    tokens: BUCKET_CAPACITY,
    lastRefill: now,
    lastSeen: now,
  };

  const elapsed = now - bucket.lastRefill;
  const refilled = Math.floor(elapsed / REFILL_RATE_MS);
  bucket.tokens = Math.min(BUCKET_CAPACITY, bucket.tokens + refilled);
  if (refilled > 0) bucket.lastRefill = now;
  bucket.lastSeen = now;

  if (bucket.tokens < 1) {
    buckets.set(ip, bucket);
    const retryAfter = Math.ceil(
      (REFILL_RATE_MS - (elapsed % REFILL_RATE_MS)) / 1000,
    );
    return { allowed: false, retryAfter };
  }

  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  return { allowed: true };
}

// ---------- Main handler ----------
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const ip = getClientIp(req);
  const { allowed, retryAfter } = allowRequest(ip);

  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL"); // e.g. noreply@yourestate.com
    const SENDER_NAME = Deno.env.get("SENDER_NAME"); // e.g. Stream Drive Estate

    if (!BREVO_API_KEY || !SENDER_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // ✅ Brevo transactional email API (replaces Resend)
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: SENDER_NAME ?? "Stream Drive Estate",
          email: SENDER_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.json().catch(() => ({}));
      console.error("[send-email] Brevo error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to send email", detail: err }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const result = await brevoRes.json();
    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (err) {
    console.error("[send-email] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
