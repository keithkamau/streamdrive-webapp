// services/exportService.js
//
// Two export formats:
//   exportPaymentsCSV(payments, residents, month, year)  → triggers .csv download
//   exportPaymentsPDF(payments, residents, month, year)  → opens a print dialog
//
// No external dependencies — uses the browser's native Blob / window.print APIs.

import { monthName } from "../lib/dateUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escape a cell value for CSV: wrap in quotes if it contains comma/quote/newline */
function csvCell(value) {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Trigger a file download in the browser */
function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Build a resident lookup map keyed by houseNumber */
function buildResidentMap(residents) {
  const map = {};
  residents.forEach((r) => {
    map[r.houseNumber] = r;
  });
  return map;
}

/** Capitalise the first letter of a status string */
function capitalise(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── CSV export ───────────────────────────────────────────────────────────────

/**
 * Builds a CSV string and triggers a browser download.
 *
 * @param {Array} payments    - payment records from paymentService
 * @param {Array} residents   - all residents (for name/email lookup)
 * @param {number} month      - 1-based month number
 * @param {number} year
 */
export function exportPaymentsCSV(payments, residents, month, year) {
  const residentMap = buildResidentMap(residents);
  const label = `${monthName(month)}_${year}`;

  const headers = [
    "House",
    "Resident Name",
    "Email",
    "Phone",
    "Status",
    "Amount (KES)",
    "Date Paid",
    "Logged By",
  ];

  const rows = payments.map((p) => {
    const r = residentMap[p.houseNumber] ?? {};
    return [
      csvCell(p.houseNumber),
      csvCell(r.name ?? ""),
      csvCell(r.email ?? ""),
      csvCell(r.phone ?? ""),
      csvCell(capitalise(p.status)),
      csvCell(p.amount ?? 0),
      csvCell(
        p.datePaid ? new Date(p.datePaid).toLocaleDateString("en-KE") : "",
      ),
      csvCell(p.loggedBy ?? ""),
    ].join(",");
  });

  // Sort rows by house number
  rows.sort((a, b) => a.localeCompare(b));

  const csv = [headers.join(","), ...rows].join("\r\n");
  triggerDownload(csv, `payments_${label}.csv`, "text/csv;charset=utf-8;");
}

// ─── PDF export (browser print) ───────────────────────────────────────────────

/**
 * Opens a styled print window containing the payment table.
 * The user prints to PDF using their browser's built-in Save as PDF option.
 *
 * @param {Array}  payments
 * @param {Array}  residents
 * @param {number} month
 * @param {number} year
 * @param {string} [estateName]  - shown in the report header
 */
export function exportPaymentsPDF(
  payments,
  residents,
  month,
  year,
  estateName = "Estate",
) {
  const residentMap = buildResidentMap(residents);
  const label = `${monthName(month)} ${year}`;

  const statusColor = (status) => {
    if (status === "paid") return "#16a34a";
    if (status === "overdue") return "#dc2626";
    return "#d97706";
  };

  const statusBg = (status) => {
    if (status === "paid") return "#f0fdf4";
    if (status === "overdue") return "#fef2f2";
    return "#fffbeb";
  };

  // Sort payments by house number
  const sorted = [...payments].sort((a, b) =>
    String(a.houseNumber).localeCompare(String(b.houseNumber)),
  );

  const paid = sorted.filter((p) => p.status === "paid").length;
  const overdue = sorted.filter((p) => p.status === "overdue").length;
  const pending = sorted.filter((p) => p.status === "pending").length;
  const totalCollected = sorted
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const tableRows = sorted
    .map((p) => {
      const r = residentMap[p.houseNumber] ?? {};
      const color = statusColor(p.status);
      const bg = statusBg(p.status);
      return `
        <tr>
          <td>${p.houseNumber ?? ""}</td>
          <td>${r.name ?? ""}</td>
          <td>${r.email ?? ""}</td>
          <td>
            <span style="
              display:inline-block;
              padding:2px 10px;
              border-radius:9999px;
              font-size:11px;
              font-weight:600;
              color:${color};
              background:${bg};
              border:1px solid ${color}33;
            ">${capitalise(p.status)}</span>
          </td>
          <td style="text-align:right">KES ${(p.amount ?? 0).toLocaleString("en-KE")}</td>
          <td>${p.datePaid ? new Date(p.datePaid).toLocaleDateString("en-KE") : "—"}</td>
        </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${estateName} — Payments ${label}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      color: #18181b;
      padding: 32px 40px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #16a34a;
    }
    header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #16a34a;
    }
    header p {
      font-size: 12px;
      color: #71717a;
      margin-top: 2px;
    }
    .meta { text-align: right; }
    .meta .period {
      font-size: 16px;
      font-weight: 600;
      color: #18181b;
    }
    .summary {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    .summary-card {
      flex: 1;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #e4e4e7;
      background: #fafafa;
    }
    .summary-card .val {
      font-size: 22px;
      font-weight: 700;
    }
    .summary-card .lbl {
      font-size: 11px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }
    .val-green { color: #16a34a; }
    .val-red   { color: #dc2626; }
    .val-amber { color: #d97706; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr {
      background: #f4f4f5;
    }
    th {
      padding: 8px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      border-bottom: 1px solid #e4e4e7;
    }
    td {
      padding: 9px 12px;
      border-bottom: 1px solid #f4f4f5;
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #fafafa; }
    footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e4e4e7;
      font-size: 11px;
      color: #a1a1aa;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 20mm; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${estateName}</h1>
      <p>Payment Report</p>
    </div>
    <div class="meta">
      <div class="period">${label}</div>
      <p>Generated ${new Date().toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}</p>
    </div>
  </header>

  <div class="summary">
    <div class="summary-card">
      <div class="val">${sorted.length}</div>
      <div class="lbl">Total Residents</div>
    </div>
    <div class="summary-card">
      <div class="val val-green">${paid}</div>
      <div class="lbl">Paid</div>
    </div>
    <div class="summary-card">
      <div class="val val-amber">${pending}</div>
      <div class="lbl">Pending</div>
    </div>
    <div class="summary-card">
      <div class="val val-red">${overdue}</div>
      <div class="lbl">Overdue</div>
    </div>
    <div class="summary-card">
      <div class="val val-green">KES ${totalCollected.toLocaleString("en-KE")}</div>
      <div class="lbl">Collected</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>House</th>
        <th>Resident</th>
        <th>Email</th>
        <th>Status</th>
        <th style="text-align:right">Amount</th>
        <th>Date Paid</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <footer>
    <span>${estateName} — Confidential</span>
    <span>Stream Drive Estate Admin Portal</span>
  </footer>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Please allow pop-ups to export as PDF.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}
