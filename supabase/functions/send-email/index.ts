// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Token bucket rate limiter ─────────────────────────────────────────────────
//
// Each IP gets a bucket of BUCKET_CAPACITY tokens.
// Every request costs 1 token.
// Tokens refill at REFILL_RATE_MS per token (never exceeds capacity).
// Buckets older than BUCKET_TTL_MS are pruned to keep memory bounded.
//
const BUCKET_CAPACITY = 10; // max burst
const REFILL_RATE_MS = 6_000; // 1 token per 6 s → 10/min sustained
const BUCKET_TTL_MS = 10 * 60_000; // prune buckets inactive for 10 min

interface Bucket {
  tokens: number;
  lastRefill: number; // timestamp ms
  lastSeen: number; // timestamp ms
}

const buckets = new Map<string, Bucket>();

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function pruneBuckets(now: number): void {
  for (const [ip, bucket] of buckets) {
    if (now - bucket.lastSeen > BUCKET_TTL_MS) buckets.delete(ip);
  }
}

/** Returns true if the request is allowed, false if rate-limited. */
function consumeToken(ip: string): boolean {
  const now = Date.now();

  // Prune stale entries occasionally (1-in-50 chance keeps overhead low)
  if (Math.random() < 0.02) pruneBuckets(now);

  let bucket = buckets.get(ip);

  if (!bucket) {
    // First request from this IP — full bucket, minus the token we're consuming
    bucket = { tokens: BUCKET_CAPACITY - 1, lastRefill: now, lastSeen: now };
    buckets.set(ip, bucket);
    return true;
  }

  // Refill tokens earned since last request
  const elapsed = now - bucket.lastRefill;
  const earned = Math.floor(elapsed / REFILL_RATE_MS);
  bucket.tokens = Math.min(BUCKET_CAPACITY, bucket.tokens + earned);
  bucket.lastRefill += earned * REFILL_RATE_MS; // advance refill clock by whole tokens only
  bucket.lastSeen = now;

  if (bucket.tokens < 1) return false; // rate-limited

  bucket.tokens -= 1;
  return true;
}
// ─────────────────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Rate limit check ────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  if (!consumeToken(ip)) {
    console.warn(`[rate-limit] blocked ${ip}`);
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please wait a moment and try again.",
      }),
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(REFILL_RATE_MS / 1000)), // seconds
        },
      },
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── Parse body ──────────────────────────────────────────────────────────────
  let to: string, subject: string, body: string;
  try {
    ({ to, subject, body } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!to || !subject || !body) {
    return new Response(
      JSON.stringify({ error: "to, subject, and body are required." }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  // ── Send via Resend ─────────────────────────────────────────────────────────
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const FROM_EMAIL =
    Deno.env.get("FROM_EMAIL") ||
    "Stream Drive Estate <noreply@streamdrive.co.ke>";

  if (!RESEND_API_KEY) {
    console.error("[send-email] RESEND_API_KEY secret is not set");
    return new Response(
      JSON.stringify({ error: "Email service is not configured." }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  // Convert plain text → styled HTML
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:DM Sans,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:40px 16px;">
            <table width="560" cellpadding="0" cellspacing="0"
                   style="background:#fff;border-radius:12px;overflow:hidden;
                          box-shadow:0 1px 4px rgba(0,0,0,.08);">
              <!-- Header -->
              <tr>
                <td style="background:#16a34a;padding:24px 32px;">
                  <span style="color:#fff;font-size:18px;font-weight:700;
                               letter-spacing:-0.3px;">
                    Stream Drive Estate
                  </span>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:32px;color:#18181b;font-size:15px;line-height:1.6;">
                  ${body.replace(/\n/g, "<br />")}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:16px 32px 24px;border-top:1px solid #f4f4f5;
                           color:#a1a1aa;font-size:12px;">
                  This email was sent by Stream Drive Estate management system.
                  Please do not reply directly to this email.
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[send-email] Resend error:", res.status, detail);
      return new Response(JSON.stringify({ error: "Failed to send email." }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ id: data.id }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-email] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
});
