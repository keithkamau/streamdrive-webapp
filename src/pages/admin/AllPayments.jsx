// pages/admin/AllPayments.jsx
import { useState, useEffect, useCallback } from "react";
import {
  getCurrentMonth,
  getCurrentYear,
  monthName,
  formatMonthYear,
  prevMonth,
  nextMonth,
} from "../../lib/dateUtils";
import {
  getPaymentsForMonth,
  upsertPayment,
} from "../../services/paymentService";
import { getResidents, updateResident } from "../../services/residentService";
import {
  sendPaymentConfirmation,
  sendOverdueNotice,
  sendPaymentReminder,
} from "../../services/notificationService";
import {
  exportPaymentsCSV,
  exportPaymentsPDF,
} from "../../services/exportService";
import { getSettings } from "../../services/settingsService";
import { useRealtime } from "../../hooks/useRealtime";
import { Button, Badge, Card, Spinner, Alert } from "../../components/ui/index";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CYCLE = { pending: "paid", paid: "overdue", overdue: "pending" };

const STATUS_META = {
  paid: { label: "Paid", color: "green" },
  pending: { label: "Pending", color: "yellow" },
  overdue: { label: "Overdue", color: "red" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AllPayments() {
  const [viewMonth, setViewMonth] = useState(getCurrentMonth);
  const [viewYear, setViewYear] = useState(getCurrentYear);

  const [residents, setResidents] = useState([]);
  const [paymentMap, setPaymentMap] = useState({});
  const [estateName, setEstateName] = useState("Estate");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [confirmModal, setConfirmModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const [exporting, setExporting] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [allResidents, payments, settings] = await Promise.all([
        getResidents(),
        getPaymentsForMonth(viewMonth, viewYear),
        getSettings(),
      ]);

      setResidents(allResidents);
      setEstateName(settings.estateName || "Estate");

      const map = {};
      payments.forEach((p) => {
        map[p.houseNumber] = p;
      });
      setPaymentMap(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [viewMonth, viewYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtime("payments", loadData);
  useRealtime("residents", loadData);

  // ── Month navigation ──────────────────────────────────────────────────────

  const goToPrev = () => {
    const { month, year } = prevMonth(viewMonth, viewYear);
    setViewMonth(month);
    setViewYear(year);
  };

  const goToNext = () => {
    const { month, year } = nextMonth(viewMonth, viewYear);
    setViewMonth(month);
    setViewYear(year);
  };

  const goToToday = () => {
    setViewMonth(getCurrentMonth());
    setViewYear(getCurrentYear());
  };

  const isCurrentMonth =
    viewMonth === getCurrentMonth() && viewYear === getCurrentYear();

  // ── Cell click ────────────────────────────────────────────────────────────

  const handleCellClick = (resident, currentPayment) => {
    const currentStatus = currentPayment?.status ?? "pending";
    const nextStatus = STATUS_CYCLE[currentStatus];
    setConfirmModal({ resident, currentPayment, currentStatus, nextStatus });
  };

  // ── Confirm → save ────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!confirmModal) return;
    const { resident, currentPayment, nextStatus } = confirmModal;

    try {
      setSaving(true);
      const amount = currentPayment?.amount ?? 0;

      const updated = await upsertPayment({
        residentId: resident.id,
        houseNumber: resident.houseNumber,
        month: viewMonth,
        year: viewYear,
        status: nextStatus,
        amount,
        datePaid: nextStatus === "paid" ? new Date().toISOString() : null,
        loggedBy: resident.houseNumber,
      });

      await updateResident(resident.id, {
        paymentStatus: nextStatus,
        monthsOverdue:
          nextStatus === "overdue"
            ? (resident.monthsOverdue ?? 0) + 1
            : resident.monthsOverdue,
      });

      if (nextStatus === "paid") {
        await sendPaymentConfirmation(resident, updated, viewMonth, viewYear);
      } else if (nextStatus === "overdue") {
        await sendOverdueNotice(resident, updated, viewMonth, viewYear);
      }

      setConfirmModal(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Bulk reminder — correct email type per status ─────────────────────────

  const handleBulkReminder = async () => {
    try {
      setBulkSending(true);
      setBulkResult(null);

      const targets = residents.filter((r) => {
        const status = paymentMap[r.houseNumber]?.status ?? "pending";
        return status === "pending" || status === "overdue";
      });

      let sent = 0;
      let failed = 0;

      for (const r of targets) {
        try {
          const p = paymentMap[r.houseNumber];
          const status = p?.status ?? "pending";
          if (status === "overdue") {
            await sendOverdueNotice(r, p ?? { amount: 0 }, viewMonth, viewYear);
          } else {
            await sendPaymentReminder(
              r,
              p ?? { amount: 0 },
              viewMonth,
              viewYear,
            );
          }
          sent++;
        } catch {
          failed++;
        }
      }

      setBulkResult({ sent, failed });
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkSending(false);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    try {
      setExporting(true);
      const payments = residents
        .map((r) => paymentMap[r.houseNumber])
        .filter(Boolean);
      exportPaymentsCSV(payments, residents, viewMonth, viewYear);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    try {
      setExporting(true);
      const payments = residents
        .map((r) => paymentMap[r.houseNumber])
        .filter(Boolean);
      exportPaymentsPDF(payments, residents, viewMonth, viewYear, estateName);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Spinner />
      </div>
    );
  }

  const pendingOrOverdueCount = residents.filter((r) => {
    const status = paymentMap[r.houseNumber]?.status ?? "pending";
    return status === "pending" || status === "overdue";
  }).length;

  const statusCounts = residents.reduce(
    (acc, r) => {
      const s = paymentMap[r.houseNumber]?.status ?? "pending";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    { paid: 0, pending: 0, overdue: 0 },
  );

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* ── Header ── */}
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-display font-semibold text-zinc-900 dark:text-zinc-100'>
            Payment Records
          </h1>
          <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
            Click any status cell to cycle it. Use the navigator to browse past
            months.
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          {pendingOrOverdueCount > 0 && (
            <Button
              variant='outline'
              onClick={handleBulkReminder}
              disabled={bulkSending}
            >
              {bulkSending ? (
                <Spinner size='sm' />
              ) : (
                `Send Reminders (${pendingOrOverdueCount})`
              )}
            </Button>
          )}

          <Button
            variant='secondary'
            onClick={handleExportCSV}
            disabled={exporting || residents.length === 0}
            title='Download as CSV spreadsheet'
          >
            ↓ CSV
          </Button>

          <Button
            variant='secondary'
            onClick={handleExportPDF}
            disabled={exporting || residents.length === 0}
            title='Open print dialog to save as PDF'
          >
            ↓ PDF
          </Button>
        </div>
      </div>

      {error && <Alert variant='error'>{error}</Alert>}

      {bulkResult && (
        <Alert variant={bulkResult.failed > 0 ? "warning" : "success"}>
          Sent {bulkResult.sent} reminder{bulkResult.sent !== 1 ? "s" : ""}.
          {bulkResult.failed > 0 && ` ${bulkResult.failed} failed.`}
        </Alert>
      )}

      {/* ── Month navigator ── */}
      <Card className='p-4'>
        <div className='flex items-center justify-between gap-2'>
          <button
            onClick={goToPrev}
            className='p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-500 dark:text-zinc-400 text-xl leading-none'
            aria-label='Previous month'
          >
            ‹
          </button>

          <div className='text-center'>
            <p className='text-lg font-display font-semibold text-zinc-900 dark:text-zinc-100'>
              {formatMonthYear(viewMonth, viewYear)}
            </p>
            {!isCurrentMonth && (
              <button
                onClick={goToToday}
                className='text-xs text-green-600 hover:underline mt-0.5'
              >
                Back to current month
              </button>
            )}
          </div>

          <button
            onClick={goToNext}
            className='p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-500 dark:text-zinc-400 text-xl leading-none'
            aria-label='Next month'
          >
            ›
          </button>
        </div>
      </Card>

      {/* ── Summary chips ── */}
      <div className='flex flex-wrap gap-2'>
        {Object.entries(statusCounts).map(([status, count]) => (
          <Badge key={status} color={STATUS_META[status]?.color ?? "zinc"}>
            {count} {STATUS_META[status]?.label ?? status}
          </Badge>
        ))}
      </div>

      {/* ── Payment matrix ── */}
      {residents.length === 0 ? (
        <Card className='p-8 text-center text-zinc-500 dark:text-zinc-400'>
          No residents found. Add residents first.
        </Card>
      ) : (
        <Card className='overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'>
                  <th className='px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400 w-20'>
                    House
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400'>
                    Resident
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400'>
                    {monthName(viewMonth)} {viewYear}
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400'>
                    Amount
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400'>
                    Date Paid
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
                {residents.map((resident) => {
                  const payment = paymentMap[resident.houseNumber];
                  const status = payment?.status ?? "pending";
                  const meta = STATUS_META[status];

                  return (
                    <tr
                      key={resident.id}
                      className='hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors'
                    >
                      <td className='px-4 py-3 font-mono font-medium text-zinc-700 dark:text-zinc-300'>
                        {resident.houseNumber}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='text-zinc-800 dark:text-zinc-200'>
                          {resident.name}
                        </div>
                        <div className='text-xs text-zinc-400'>
                          {resident.email}
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <button
                          onClick={() => handleCellClick(resident, payment)}
                          className='focus:outline-none focus:ring-2 focus:ring-green-500 rounded'
                          title='Click to change status'
                        >
                          <Badge color={meta?.color ?? "zinc"}>
                            {meta?.label ?? status}
                          </Badge>
                        </button>
                      </td>
                      <td className='px-4 py-3 text-zinc-700 dark:text-zinc-300'>
                        {payment?.amount != null
                          ? `KES ${payment.amount.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className='px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400'>
                        {payment?.datePaid
                          ? new Date(payment.datePaid).toLocaleDateString(
                              "en-KE",
                            )
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Confirm modal ── */}
      {confirmModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
          <Card className='w-full max-w-md p-6 space-y-4 animate-fade-in'>
            <h2 className='text-lg font-display font-semibold text-zinc-900 dark:text-zinc-100'>
              Update Payment Status
            </h2>

            <div className='space-y-1 text-sm text-zinc-700 dark:text-zinc-300'>
              <div>
                <span className='font-medium'>Resident:</span>{" "}
                {confirmModal.resident.name}
              </div>
              <div>
                <span className='font-medium'>House:</span>{" "}
                {confirmModal.resident.houseNumber}
              </div>
              <div>
                <span className='font-medium'>Email:</span>{" "}
                {confirmModal.resident.email}
              </div>
              <div>
                <span className='font-medium'>Period:</span>{" "}
                {formatMonthYear(viewMonth, viewYear)}
              </div>
              <div className='pt-2 flex items-center gap-2'>
                <Badge color={STATUS_META[confirmModal.currentStatus]?.color}>
                  {STATUS_META[confirmModal.currentStatus]?.label}
                </Badge>
                <span className='text-zinc-400'>→</span>
                <Badge color={STATUS_META[confirmModal.nextStatus]?.color}>
                  {STATUS_META[confirmModal.nextStatus]?.label}
                </Badge>
              </div>
            </div>

            {(confirmModal.nextStatus === "paid" ||
              confirmModal.nextStatus === "overdue") && (
              <p className='text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3'>
                {confirmModal.nextStatus === "paid"
                  ? "✉️ A payment confirmation email will be sent to the resident."
                  : "✉️ An overdue payment notice will be sent to the resident."}
              </p>
            )}

            <div className='flex justify-end gap-2 pt-2'>
              <Button
                variant='secondary'
                onClick={() => setConfirmModal(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant={
                  confirmModal.nextStatus === "overdue" ? "danger" : "primary"
                }
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? <Spinner size='sm' /> : "Confirm"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
