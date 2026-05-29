import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL =
  Deno.env.get("FROM_EMAIL") || "Stream Drive Estate <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Send via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        text: body,
        html: bodyToHtml(body),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send email" }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Convert plain text to simple HTML ─────────────────────────────────────────
function bodyToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");

  const html = lines
    .map((line) => {
      if (line.trim() === "") return "<br/>";
      return `<p style="margin:0 0 8px 0;font-family:sans-serif;font-size:14px;color:#18181b;line-height:1.6;">${line}</p>`;
    })
    .join("\n");

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="UTF-8"/></head>
      <body style="background:#f4f4f5;padding:32px 16px;margin:0;">
        <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;padding:32px;border:1px solid #e4e4e7;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #f4f4f5;">
            <div style="width:36px;height:36px;background:#16a34a;border-radius:8px;display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:18px;">🏠</span>
            </div>
            <div>
              <p style="margin:0;font-family:sans-serif;font-weight:700;font-size:15px;color:#18181b;">Stream Drive Estate</p>
              <p style="margin:0;font-family:sans-serif;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;">Nairobi, Kenya</p>
            </div>
          </div>
          ${html}
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f4f4f5;">
            <p style="margin:0;font-family:sans-serif;font-size:11px;color:#a1a1aa;text-align:center;">
              This is an automated message from Stream Drive Estate Management.<br/>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
