import { useState, useEffect, useCallback } from "react";
import { Badge, Card, Button, Input, Alert } from "../../components/ui";
import {
  getResidents,
  addResident,
  updateResident,
  deleteResident,
} from "../../services/residentService";
import { getHouses } from "../../services/houseService";
import { notifyPaymentReminder } from "../../services/notifications";
import { useRealtime } from "../../hooks/useRealtime";

const CURRENT_MONTH = "June 2025";
const LEVY_AMOUNT = 3000;

const statusConfig = {
  paid: { label: "Paid", variant: "paid" },
  pending: { label: "Pending", variant: "pending" },
  overdue: { label: "Overdue", variant: "overdue" },
};

const emptyForm = { name: "", email: "", phone: "", houseNumber: "" };

function timeAgo(dateStr) {
  const diff = Math.floor(
    (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff} days ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return `${Math.floor(diff / 365)} years ago`;
}

// ── Resident form ─────────────────────────────────────────────────────────────
function ResidentForm({
  initial,
  onSave,
  onCancel,
  loading,
  availableHouses = [],
}) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          email: initial.email,
          phone: initial.phone,
          houseNumber: initial.houseNumber,
        }
      : emptyForm,
  );
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.includes("@")) e.email = "Enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (!form.houseNumber.trim())
      e.houseNumber = "Please select a house number.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      {/* Info note */}
      <div className='flex gap-2.5 items-start bg-green-50 border border-green-200 rounded-lg p-3.5'>
        <svg
          className='w-4 h-4 text-green-500 shrink-0 mt-0.5'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <circle cx='12' cy='12' r='10' />
          <line x1='12' y1='8' x2='12' y2='12' />
          <line x1='12' y1='16' x2='12.01' y2='16' />
        </svg>
        <p className='text-xs text-green-700'>
          {initial
            ? "Update the resident's details. Email is used for payment notifications."
            : "Fill in the resident's details. These will be saved to the estate database and used for payment notifications."}
        </p>
      </div>

      {/* Name */}
      <Input
        label='Full Name'
        placeholder='e.g. Jane Doe'
        value={form.name}
        onChange={set("name")}
        error={errors.name}
      />

      {/* Email & Phone */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <Input
          label='Email Address'
          type='email'
          placeholder='jane@example.com'
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          hint='Used for payment confirmations'
        />
        <Input
          label='Phone Number'
          type='tel'
          placeholder='+254 7XX XXX XXX'
          value={form.phone}
          onChange={set("phone")}
          error={errors.phone}
        />
      </div>

      {/* House number dropdown */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
          House Number
        </label>
        <select
          value={form.houseNumber}
          onChange={(e) => {
            setForm((f) => ({ ...f, houseNumber: e.target.value }));
            setErrors((er) => ({ ...er, houseNumber: "" }));
          }}
          className='w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all cursor-pointer'
        >
          <option value='' disabled>
            Select a house number
          </option>
          {availableHouses.map((h) => (
            <option key={h.id} value={h.houseNumber}>
              {h.houseNumber}
            </option>
          ))}
        </select>
        {errors.houseNumber && (
          <p className='text-xs text-red-400'>{errors.houseNumber}</p>
        )}
        <p className='text-xs text-zinc-400'>
          House numbers are managed under Admin → Houses
        </p>
      </div>

      {/* Record preview */}
      {form.name && form.houseNumber && (
        <div className='bg-zinc-50 border border-zinc-200 rounded-xl p-3.5'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2'>
            Record Preview
          </p>
          <div className='grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs'>
            <span className='text-zinc-400'>Name</span>
            <span className='text-zinc-900 font-medium'>
              {form.name || "—"}
            </span>
            <span className='text-zinc-400'>House</span>
            <span className='text-zinc-900 font-mono font-medium'>
              {form.houseNumber || "—"}
            </span>
            <span className='text-zinc-400'>Email</span>
            <span className='text-zinc-900 truncate'>{form.email || "—"}</span>
            <span className='text-zinc-400'>Phone</span>
            <span className='text-zinc-900'>{form.phone || "—"}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='flex justify-end gap-2 pt-2 border-t border-zinc-100'>
        <Button
          type='button'
          variant='secondary'
          size='md'
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type='submit' size='md' loading={loading}>
          {initial ? "Save Changes" : "Add Resident"}
        </Button>
      </div>
    </form>
  );
}

// ── Resident drawer ───────────────────────────────────────────────────────────
function ResidentDrawer({
  resident,
  onClose,
  onEdit,
  onDelete,
  onSendReminder,
}) {
  const [reminderSent, setReminderSent] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderError, setReminderError] = useState("");

  if (!resident) return null;

  const cfg = statusConfig[resident.paymentStatus] || {
    label: "Unknown",
    variant: "default",
  };

  const handleReminder = async () => {
    setReminderLoading(true);
    setReminderError("");
    try {
      await onSendReminder(resident);
      setReminderSent(true);
    } catch {
      setReminderError("Failed to send reminder. Please try again.");
    }
    setReminderLoading(false);
  };

  return (
    <div className='fixed inset-0 z-50 flex justify-end'>
      <div className='fixed inset-0 bg-black/30' onClick={onClose} />
      <div className='relative z-10 w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-5 border-b border-zinc-100'>
          <h3 className='font-display font-bold text-zinc-900 text-base'>
            Resident Details
          </h3>
          <button
            onClick={onClose}
            className='p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors'
          >
            <svg
              className='w-4 h-4'
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

        {/* Profile */}
        <div className='px-6 py-6 flex flex-col items-center gap-3 border-b border-zinc-100'>
          <div className='w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center'>
            <span className='font-display font-bold text-green-700 text-xl'>
              {resident.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
          <div className='text-center'>
            <p className='font-display font-bold text-zinc-900 text-lg'>
              {resident.name}
            </p>
            <p className='text-sm text-zinc-400 font-mono mt-0.5'>
              {resident.houseNumber}
            </p>
          </div>
          <div className='flex items-center gap-2 flex-wrap justify-center'>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            {resident.isAdmin && <Badge variant='admin'>Admin</Badge>}
          </div>
        </div>

        {/* Contact */}
        <div className='px-6 py-5 flex flex-col gap-3 border-b border-zinc-100'>
          <h4 className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Contact Information
          </h4>
          <div className='flex flex-col gap-3'>
            {[
              { label: "Email", value: resident.email },
              { label: "Phone", value: resident.phone },
              { label: "Joined", value: timeAgo(resident.joinedAt) },
            ].map((item) => (
              <div key={item.label} className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0'>
                  <svg
                    className='w-4 h-4 text-zinc-400'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    {item.label === "Email" && (
                      <>
                        <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
                        <polyline points='22,6 12,13 2,6' />
                      </>
                    )}
                    {item.label === "Phone" && (
                      <path d='M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.13 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z' />
                    )}
                    {item.label === "Joined" && (
                      <>
                        <rect
                          x='3'
                          y='4'
                          width='18'
                          height='18'
                          rx='2'
                          ry='2'
                        />
                        <line x1='16' y1='2' x2='16' y2='6' />
                        <line x1='8' y1='2' x2='8' y2='6' />
                        <line x1='3' y1='10' x2='21' y2='10' />
                      </>
                    )}
                  </svg>
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-zinc-400'>{item.label}</p>
                  <p className='text-sm text-zinc-900 truncate'>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment status */}
        <div className='px-6 py-5 flex flex-col gap-3 border-b border-zinc-100'>
          <h4 className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Payment Status
          </h4>
          <div className='bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-zinc-600'>Current month</span>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-zinc-600'>Months overdue</span>
              <span
                className={`text-sm font-bold ${
                  resident.monthsOverdue > 0 ? "text-red-500" : "text-green-600"
                }`}
              >
                {resident.monthsOverdue}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-zinc-600'>Amount owed</span>
              <span
                className={`text-sm font-bold ${
                  resident.monthsOverdue > 0 ? "text-red-500" : "text-zinc-400"
                }`}
              >
                {resident.monthsOverdue > 0
                  ? `KES ${(resident.monthsOverdue * LEVY_AMOUNT).toLocaleString()}`
                  : "—"}
              </span>
            </div>
          </div>
          {resident.monthsOverdue > 0 && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700'>
              This resident is {resident.monthsOverdue} month
              {resident.monthsOverdue > 1 ? "s" : ""} behind on payments.
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className='px-6 py-5 flex flex-col gap-3 border-b border-zinc-100'>
          <h4 className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Notifications
          </h4>
          {reminderSent && (
            <Alert variant='success'>Reminder email queued successfully.</Alert>
          )}
          {reminderError && <Alert variant='danger'>{reminderError}</Alert>}
          <Button
            variant='outline'
            size='md'
            className='w-full justify-center'
            loading={reminderLoading}
            disabled={reminderSent}
            onClick={handleReminder}
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
              <polyline points='22,6 12,13 2,6' />
            </svg>
            {reminderSent ? "Reminder Sent" : "Send Payment Reminder"}
          </Button>
        </div>

        {/* Actions */}
        <div className='px-6 py-5 flex flex-col gap-2 mt-auto'>
          <Button
            variant='secondary'
            size='md'
            className='w-full justify-center'
            onClick={() => onEdit(resident)}
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
            Edit Resident
          </Button>
          <Button
            variant='ghost'
            size='md'
            className='w-full justify-center text-red-500 hover:bg-red-50 hover:text-red-600'
            onClick={() => onDelete(resident.id)}
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <polyline points='3 6 5 6 21 6' />
              <path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
              <path d='M10 11v6M14 11v6' />
              <path d='M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2' />
            </svg>
            Remove Resident
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
      <div className='fixed inset-0 bg-black/30' onClick={onClose} />
      <div className='relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-fade-in'>
        <div className='flex items-center justify-between mb-5'>
          <h3 className='font-display font-bold text-zinc-900 text-base'>
            {title}
          </h3>
          <button
            onClick={onClose}
            className='p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors'
          >
            <svg
              className='w-4 h-4'
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
        {children}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [availableHouses, setAvailableHouses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedResident, setSelectedResident] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // ── Load data ─────────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    try {
      const [residentData, houseData] = await Promise.all([
        getResidents(),
        getHouses(),
      ]);
      setResidents(residentData);
      setAvailableHouses(houseData);
    } catch (err) {
      setPageError("Failed to load residents. Please refresh.");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    reload().finally(() => setPageLoading(false));
  }, [reload]);

  // Real-time updates
  useRealtime(
    "residents",
    useCallback(() => reload(), [reload]),
  );
  useRealtime(
    "houses",
    useCallback(() => reload(), [reload]),
  );

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleAdd = async (form) => {
    setFormLoading(true);
    try {
      await addResident(form);
      await reload();
      setShowAddModal(false);
      showToast(`${form.name} added to the estate.`);
    } catch (err) {
      showToast(
        err.message?.includes("unique")
          ? "That email or house number is already registered."
          : "Failed to add resident. Please try again.",
      );
    }
    setFormLoading(false);
  };

  const handleEdit = async (form) => {
    setFormLoading(true);
    try {
      await updateResident(editingResident.id, form);
      await reload();
      setEditingResident(null);
      setSelectedResident(null);
      showToast("Resident record updated.");
    } catch {
      showToast("Failed to update resident. Please try again.");
    }
    setFormLoading(false);
  };

  const handleDelete = async (id) => {
    const resident = residents.find((r) => r.id === id);
    try {
      await deleteResident(id);
      await reload();
      setDeleteConfirm(null);
      setSelectedResident(null);
      showToast(`${resident?.name} removed from the estate.`);
    } catch {
      showToast("Failed to remove resident. Please try again.");
    }
  };

  const handleSendReminder = async (resident) => {
    await notifyPaymentReminder(resident, {
      month: CURRENT_MONTH,
      amount: LEVY_AMOUNT,
      daysLeft: 7,
    });
    showToast(`Reminder sent to ${resident.name}.`);
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = residents.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.houseNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" || r.paymentStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const total = residents.length;
  const paid = residents.filter((r) => r.paymentStatus === "paid").length;
  const overdue = residents.filter((r) => r.paymentStatus === "overdue").length;
  const admins = residents.filter((r) => r.isAdmin).length;

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
          <p className='text-sm text-zinc-400'>Loading residents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='font-display font-bold text-zinc-900 text-xl'>
            Residents
          </h2>
          <p className='text-sm text-zinc-400 mt-0.5'>
            Manage all registered residents in Stream Drive
          </p>
        </div>
        <Button size='md' onClick={() => setShowAddModal(true)}>
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <line x1='12' y1='5' x2='12' y2='19' />
            <line x1='5' y1='12' x2='19' y2='12' />
          </svg>
          Add Resident
        </Button>
      </div>

      {pageError && <Alert variant='danger'>{pageError}</Alert>}

      {/* Toast */}
      {toast && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl animate-fade-in'>
          {toast}
        </div>
      )}

      {/* Summary */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          {
            label: "Total",
            value: total,
            sub: "residents",
            color: "text-zinc-900",
          },
          {
            label: "Up to date",
            value: paid,
            sub: "payments current",
            color: "text-green-600",
          },
          {
            label: "Overdue",
            value: overdue,
            sub: "behind on payments",
            color: "text-red-500",
          },
          {
            label: "Admins",
            value: admins,
            sub: "estate managers",
            color: "text-zinc-900",
          },
        ].map((s) => (
          <Card key={s.label} className='p-4 flex flex-col gap-1'>
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
              {s.label}
            </p>
            <p className={`font-display font-bold text-2xl ${s.color}`}>
              {s.value}
            </p>
            <p className='text-xs text-zinc-400'>{s.sub}</p>
          </Card>
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
            placeholder='Search by name, house or email...'
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

      {/* Residents grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filtered.length === 0 ? (
          <div className='col-span-full flex flex-col items-center justify-center py-16 gap-3 text-center'>
            <div className='w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-zinc-400'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' />
                <circle cx='9' cy='7' r='4' />
              </svg>
            </div>
            <div>
              <p className='text-sm font-semibold text-zinc-500'>
                No residents found
              </p>
              <p className='text-xs text-zinc-400 mt-0.5'>
                {search
                  ? "Try a different search term"
                  : "Add your first resident to get started"}
              </p>
            </div>
            {!search && (
              <Button size='sm' onClick={() => setShowAddModal(true)}>
                Add Resident
              </Button>
            )}
          </div>
        ) : (
          filtered.map((resident) => {
            const cfg = statusConfig[resident.paymentStatus] || {
              label: "Unknown",
              variant: "default",
            };
            return (
              <Card
                key={resident.id}
                className='p-5 flex flex-col gap-4 cursor-pointer hover:border-green-300 hover:shadow-sm transition-all duration-150'
                onClick={() => setSelectedResident(resident)}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0'>
                      <span className='font-display font-bold text-green-700 text-sm'>
                        {resident.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-zinc-900'>
                        {resident.name}
                      </p>
                      <p className='text-xs text-zinc-400 font-mono'>
                        {resident.houseNumber}
                      </p>
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>

                <div className='flex flex-col gap-1.5'>
                  <div className='flex items-center gap-2 text-xs text-zinc-500'>
                    <svg
                      className='w-3.5 h-3.5 text-zinc-300 shrink-0'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
                      <polyline points='22,6 12,13 2,6' />
                    </svg>
                    <span className='truncate'>{resident.email}</span>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-zinc-500'>
                    <svg
                      className='w-3.5 h-3.5 text-zinc-300 shrink-0'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <path d='M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.13 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z' />
                    </svg>
                    <span>{resident.phone}</span>
                  </div>
                </div>

                <div className='flex items-center justify-between pt-2 border-t border-zinc-100'>
                  <span className='text-xs text-zinc-400'>
                    Added {timeAgo(resident.joinedAt)}
                  </span>
                  <div className='flex items-center gap-1.5'>
                    {resident.isAdmin && <Badge variant='admin'>Admin</Badge>}
                    {resident.monthsOverdue > 0 && (
                      <span className='text-xs font-semibold text-red-500'>
                        {resident.monthsOverdue}mo overdue
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add modal */}
      {showAddModal && (
        <Modal title='Add New Resident' onClose={() => setShowAddModal(false)}>
          <ResidentForm
            onSave={handleAdd}
            onCancel={() => setShowAddModal(false)}
            loading={formLoading}
            availableHouses={availableHouses}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editingResident && (
        <Modal title='Edit Resident' onClose={() => setEditingResident(null)}>
          <ResidentForm
            initial={editingResident}
            onSave={handleEdit}
            onCancel={() => setEditingResident(null)}
            loading={formLoading}
            availableHouses={availableHouses}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title='Remove Resident' onClose={() => setDeleteConfirm(null)}>
          <div className='flex flex-col gap-4'>
            <p className='text-sm text-zinc-600'>
              Are you sure you want to remove{" "}
              <span className='font-semibold text-zinc-900'>
                {residents.find((r) => r.id === deleteConfirm)?.name}
              </span>{" "}
              from the estate? This action cannot be undone.
            </p>
            <div className='flex justify-end gap-2'>
              <Button
                variant='secondary'
                size='md'
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant='danger'
                size='md'
                onClick={() => handleDelete(deleteConfirm)}
              >
                Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Drawer */}
      {selectedResident && (
        <ResidentDrawer
          resident={selectedResident}
          onClose={() => setSelectedResident(null)}
          onEdit={(r) => {
            setEditingResident(r);
            setSelectedResident(null);
          }}
          onDelete={(id) => {
            setDeleteConfirm(id);
            setSelectedResident(null);
          }}
          onSendReminder={handleSendReminder}
        />
      )}
    </div>
  );
}
