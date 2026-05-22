import { useState, useEffect } from "react";
import { Badge, Card, Button } from "../../components/ui";
import {
  getResidents,
  updatePaymentStatus,
} from "../../services/residentService";
import {
  getPaymentsByYear,
  upsertPayment,
  buildPaymentMap,
} from "../../services/paymentService";
import {
  notifyPaymentConfirmation,
  notifyOverdue,
} from "../../services/notifications";
import { useAuth } from "../../context/AuthContext";

const LEVY_AMOUNT = 3000;
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = "June";

const FULL_MONTHS = [
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
const DISPLAYED_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const statusConfig = {
  paid: {
    label: "Paid",
    variant: "paid",
    dot: "bg-green-500",
    cell: "bg-green-50 text-green-700 border-green-200",
  },
  pending: {
    label: "Pending",
    variant: "pending",
    dot: "bg-yellow-400",
    cell: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  overdue: {
    label: "Overdue",
    variant: "overdue",
    dot: "bg-red-500",
    cell: "bg-red-50 text-red-700 border-red-200",
  },
  null: {
    label: "—",
    variant: "default",
    dot: "bg-zinc-200",
    cell: "bg-zinc-50 text-zinc-400 border-zinc-200",
  },
};

// ── Notification toast ────────────────────────────────────────────────────────
function NotifToast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-zinc-800 text-white",
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in ${styles[type]}`}
    >
      {type === "success" && (
        <svg
          className='w-4 h-4 shrink-0'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          viewBox='0 0 24 24'
        >
          <polyline points='20 6 9 17 4 12' />
        </svg>
      )}
      {type === "error" && (
        <svg
          className='w-4 h-4 shrink-0'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          viewBox='0 0 24 24'
        >
          <circle cx='12' cy='12' r='10' />
          <line x1='15' y1='9' x2='9' y2='15' />
          <line x1='9' y1='9' x2='15' y2='15' />
        </svg>
      )}
      {message}
      <button
        onClick={onClose}
        className='ml-1 opacity-70 hover:opacity-100 transition-opacity'
      >
        <svg
          className='w-3.5 h-3.5'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <line x1='18' y1='6' x2='6' y2='18' />
          <line x1='6' y1='6' x2='18' y2='18' />
        </svg>
      </button>
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  resident,
  month,
  newStatus,
  onConfirm,
  onCancel,
  loading,
}) {
  const isPayment = newStatus === "paid";
  const isOverdue = newStatus === "overdue";
  const today = new Date().toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
      <div className='fixed inset-0 bg-black/30' onClick={onCancel} />
      <div className='relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in'>
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isPayment
              ? "bg-green-100"
              : isOverdue
                ? "bg-red-100"
                : "bg-yellow-100"
          }`}
        >
          {isPayment ? (
            <svg
              className='w-6 h-6 text-green-600'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <polyline points='20 6 9 17 4 12' />
            </svg>
          ) : (
            <svg
              className={`w-6 h-6 ${isOverdue ? "text-red-600" : "text-yellow-600"}`}
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
          )}
        </div>

        <h3 className='font-display font-bold text-zinc-900 text-lg text-center mb-1'>
          {isPayment
            ? "Confirm Payment"
            : isOverdue
              ? "Mark as Overdue"
              : "Mark as Pending"}
        </h3>
        <p className='text-sm text-zinc-500 text-center mb-5'>
          {isPayment
            ? "This will record the payment and send a confirmation email to the resident."
            : isOverdue
              ? "This will mark the payment as overdue and notify the resident by email."
              : "This will update the payment status to pending."}
        </p>

        <div className='bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2.5 mb-5'>
          {[
            { label: "Resident", value: resident.name },
            { label: "House", value: resident.houseNumber },
            { label: "Month", value: `${month} ${CURRENT_YEAR}` },
            { label: "Amount", value: `KES ${LEVY_AMOUNT.toLocaleString()}` },
            { label: "New status", value: statusConfig[newStatus]?.label },
            ...(isPayment ? [{ label: "Date logged", value: today }] : []),
          ].map((row) => (
            <div key={row.label} className='flex justify-between items-center'>
              <span className='text-xs text-zinc-400'>{row.label}</span>
              <span className='text-sm font-semibold text-zinc-900'>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {(isPayment || isOverdue) && (
          <div className='flex gap-2.5 items-start bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5'>
            <svg
              className='w-4 h-4 text-blue-500 shrink-0 mt-0.5'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
              <polyline points='22,6 12,13 2,6' />
            </svg>
            <p className='text-xs text-blue-700'>
              {isPayment
                ? `A payment confirmation email will be sent to ${resident.email}`
                : `An overdue notice will be sent to ${resident.email}`}
            </p>
          </div>
        )}

        <div className='flex gap-2'>
          <Button
            variant='secondary'
            size='md'
            className='flex-1 justify-center'
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={isPayment ? "primary" : isOverdue ? "danger" : "secondary"}
            size='md'
            className='flex-1 justify-center'
            loading={loading}
            onClick={onConfirm}
          >
            {isPayment
              ? "Confirm & Notify"
              : isOverdue
                ? "Mark Overdue"
                : "Mark Pending"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AllPayments() {
  const { user } = useAuth();
  const [residents, setResidents] = useState([]);
  const [paymentMap, setPaymentMap] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingEdit, setPendingEdit] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // ── Load data ─────────────────────────────────────────────────────────────
  const reload = async () => {
    try {
      const [residentData, paymentData] = await Promise.all([
        getResidents(),
        getPaymentsByYear(CURRENT_YEAR),
      ]);
      setResidents(residentData);
      setPaymentMap(buildPaymentMap(paymentData));
    } catch (err) {
      console.error("Failed to load payment data:", err);
      showToast("Failed to load data. Please refresh.", "error");
    }
  };

  useEffect(() => {
    reload().finally(() => setPageLoading(false));
  }, []);

  // ── Cell click — cycle status ─────────────────────────────────────────────
  const handleCellClick = (resident, month, currentStatus) => {
    const cycle = {
      pending: "paid",
      paid: "overdue",
      overdue: "pending",
      null: "pending",
    };
    const newStatus = cycle[currentStatus] || "pending";
    setPendingEdit({ resident, month, newStatus });
  };

  // ── Confirm status change ─────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!pendingEdit) return;
    const { resident, month, newStatus } = pendingEdit;
    setConfirmLoading(true);

    try {
      const today = new Date().toISOString();

      // 1. Upsert payment record in Supabase
      await upsertPayment({
        residentId: resident.id,
        houseNumber: resident.houseNumber,
        month,
        year: CURRENT_YEAR,
        status: newStatus,
        amount: LEVY_AMOUNT,
        datePaid: newStatus === "paid" ? today : null,
        loggedBy: user?.id ?? null,
      });

      // 2. Update resident's current payment status if current month
      if (month === CURRENT_MONTH) {
        const updatedPayments = await getPaymentsByYear(CURRENT_YEAR);
        const updatedMap = buildPaymentMap(updatedPayments);
        const overdueCount = Object.values(
          updatedMap[resident.houseNumber] || {},
        ).filter((s) => s === "overdue").length;
        await updatePaymentStatus(
          resident.id,
          newStatus,
          newStatus === "overdue" ? overdueCount : 0,
        );
      }

      // 3. Reload data
      await reload();

      // 4. Send notification
      const datePaidFormatted = new Date().toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (newStatus === "paid") {
        const result = await notifyPaymentConfirmation(resident, {
          month: `${month} ${CURRENT_YEAR}`,
          amount: LEVY_AMOUNT,
          datePaid: datePaidFormatted,
        });
        showToast(
          result.stubbed
            ? `Payment logged for ${resident.name}. Email will send once backend is live.`
            : `Payment confirmed and email sent to ${resident.name}.`,
          result.stubbed ? "info" : "success",
        );
      } else if (newStatus === "overdue") {
        const result = await notifyOverdue(resident, {
          month: `${month} ${CURRENT_YEAR}`,
          amount: LEVY_AMOUNT,
        });
        showToast(
          result.stubbed
            ? `${resident.name} marked overdue. Notice will send once backend is live.`
            : `${resident.name} marked overdue and notice sent.`,
          result.stubbed ? "info" : "success",
        );
      } else {
        showToast(`${resident.name} — ${month} marked as pending.`, "info");
      }
    } catch (err) {
      console.error(err);
      showToast(
        "Status updated but an error occurred. Please refresh.",
        "error",
      );
    }

    setConfirmLoading(false);
    setPendingEdit(null);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const monthData = residents.map((r) => ({
    ...r,
    status: paymentMap[r.houseNumber]?.[selectedMonth] ?? null,
  }));

  const paid = monthData.filter((r) => r.status === "paid").length;
  const overdue = monthData.filter((r) => r.status === "overdue").length;
  const pending = monthData.filter((r) => r.status === "pending").length;
  const total = monthData.length;

  const filtered = monthData.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.houseNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (pageLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='flex flex-col items-center gap-3'>
          <svg
            className='animate-spin w-6 h-6 text-green-500'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8v8H4z'
            />
          </svg>
          <p className='text-sm text-zinc-400'>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in'>
      <div>
        <h2 className='font-display font-bold text-zinc-900 text-xl'>
          All Payments
        </h2>
        <p className='text-sm text-zinc-400 mt-0.5'>
          Track and update security levy payments across the estate
        </p>
      </div>

      {/* Summary */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Collected
          </p>
          <p className='font-display font-bold text-xl text-green-600'>
            KES {(paid * LEVY_AMOUNT).toLocaleString()}
          </p>
          <p className='text-xs text-zinc-400'>
            {paid} of {total} houses
          </p>
        </Card>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Outstanding
          </p>
          <p className='font-display font-bold text-xl text-red-500'>
            KES {((overdue + pending) * LEVY_AMOUNT).toLocaleString()}
          </p>
          <p className='text-xs text-zinc-400'>{overdue + pending} houses</p>
        </Card>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Overdue
          </p>
          <p className='font-display font-bold text-xl text-red-500'>
            {overdue}
          </p>
          <p className='text-xs text-zinc-400'>houses behind</p>
        </Card>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Collection Rate
          </p>
          <p className='font-display font-bold text-xl text-zinc-900'>
            {total ? Math.round((paid / total) * 100) : 0}%
          </p>
          <div className='w-full h-1.5 bg-zinc-100 rounded-full mt-1'>
            <div
              className='h-full bg-green-500 rounded-full transition-all duration-500'
              style={{ width: `${total ? (paid / total) * 100 : 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Month selector */}
      <div className='flex gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-xl w-fit flex-wrap'>
        {FULL_MONTHS.map((month, i) => (
          <button
            key={month}
            onClick={() => setSelectedMonth(month)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              selectedMonth === month
                ? "bg-green-600 text-white"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {DISPLAYED_MONTHS[i]}
          </button>
        ))}
      </div>

      {/* Search & filter */}
      <div className='flex items-center gap-3 flex-wrap'>
        <div className='relative flex-1 min-w-50'>
          <svg
            className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <circle cx='11' cy='11' r='8' />
            <line x1='21' y1='21' x2='16.65' y2='16.65' />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by name or house number...'
            className='w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
          />
        </div>
        <div className='flex gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-xl'>
          {["all", "paid", "pending", "overdue"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150 ${
                filterStatus === s
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className='overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-zinc-100 bg-zinc-50'>
                <th className='text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400'>
                  Resident
                </th>
                <th className='text-left px-3 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400'>
                  House
                </th>
                {DISPLAYED_MONTHS.map((m) => (
                  <th
                    key={m}
                    className='text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400'
                  >
                    {m}
                  </th>
                ))}
                <th className='text-center px-3 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400'>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-100'>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={15}
                    className='text-center py-12 text-sm text-zinc-400'
                  >
                    No residents match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((resident) => (
                  <tr
                    key={resident.houseNumber}
                    className='hover:bg-zinc-50 transition-colors'
                  >
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-2'>
                        <div className='w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0'>
                          <span className='text-[10px] font-bold text-green-700'>
                            {resident.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </span>
                        </div>
                        <span className='text-sm font-medium text-zinc-900 truncate max-w-30'>
                          {resident.name}
                        </span>
                      </div>
                    </td>
                    <td className='px-3 py-3'>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-sm text-zinc-600 font-mono'>
                          {resident.houseNumber}
                        </span>
                        {resident.isAdmin && (
                          <Badge variant='admin'>Admin</Badge>
                        )}
                      </div>
                    </td>
                    {FULL_MONTHS.map((month) => {
                      const status =
                        paymentMap[resident.houseNumber]?.[month] ?? null;
                      const cfg = statusConfig[status];
                      return (
                        <td key={month} className='px-2 py-3 text-center'>
                          <button
                            onClick={() =>
                              handleCellClick(resident, month, status)
                            }
                            title={`Click to update ${month}`}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all hover:opacity-75 active:scale-95 ${cfg.cell}`}
                          >
                            {cfg.label}
                          </button>
                        </td>
                      );
                    })}
                    <td className='px-3 py-3 text-center'>
                      <button
                        onClick={() =>
                          handleCellClick(
                            resident,
                            CURRENT_MONTH,
                            paymentMap[resident.houseNumber]?.[CURRENT_MONTH] ??
                              null,
                          )
                        }
                        className='p-1.5 rounded-lg text-zinc-400 hover:text-green-600 hover:bg-green-50 transition-colors'
                        title={`Update ${CURRENT_MONTH}`}
                      >
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          viewBox='0 0 24 24'
                        >
                          <path d='M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' />
                          <path d='M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className='px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between flex-wrap gap-2'>
          <p className='text-xs text-zinc-400'>
            Showing {filtered.length} of {total} residents
          </p>
          <p className='text-xs text-zinc-400'>
            Click any cell to cycle status · confirmation email sent
            automatically on payment
          </p>
        </div>
      </Card>

      {pendingEdit && (
        <ConfirmModal
          resident={pendingEdit.resident}
          month={pendingEdit.month}
          newStatus={pendingEdit.newStatus}
          onConfirm={handleConfirm}
          onCancel={() => setPendingEdit(null)}
          loading={confirmLoading}
        />
      )}

      {toast && (
        <NotifToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
