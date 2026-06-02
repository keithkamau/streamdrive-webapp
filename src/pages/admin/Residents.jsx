import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getResidents,
  addResident,
  updateResident,
  deleteResident,
} from "../../services/residentService";
import {
  sendPaymentReminder,
  sendOverdueNotice,
} from "../../services/notifications";
import { validateResidentForm } from "../../lib/validators";
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  Alert,
  Divider,
} from "../../components/ui/index";
import { useRateLimit } from "../../hooks/useRateLimit";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  houseNumber: "",
  isAdmin: false,
};

export default function Residents() {
  const { user } = useAuth();
  const { guard, blocked, cooldownMessage } = useRateLimit({
    maxCalls: 3,
    windowMs: 60_000,
  });

  // ── Data state ───────────────────────────────────────────────────────────────
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Bulk reminder ────────────────────────────────────────────────────────────
  const [reminding, setReminding] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);

  // ── Load ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchResidents();
  }, []);

  async function fetchResidents() {
    setLoading(true);
    setError(null);
    try {
      const data = await getResidents();
      setResidents(data);
    } catch (err) {
      setError(err.message ?? "Failed to load residents.");
    } finally {
      setLoading(false);
    }
  }

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = residents.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.houseNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || r.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError(null);
    setShowModal(true);
  }

  function openEdit(resident) {
    setEditing(resident);
    setForm({
      name: resident.name,
      email: resident.email,
      phone: resident.phone,
      houseNumber: resident.houseNumber,
      isAdmin: resident.isAdmin ?? false,
    });
    setFormErrors({});
    setSaveError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError(null);
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit() {
    const errors = validateResidentForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (editing) {
        await updateResident(editing.id, form);
      } else {
        await addResident(form);
      }
      await fetchResidents();
      closeModal();
    } catch (err) {
      setSaveError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function handleDelete(resident) {
    if (!window.confirm(`Remove ${resident.name} from the estate?`)) return;
    try {
      await deleteResident(resident.id);
      await fetchResidents();
    } catch (err) {
      setError(err.message ?? "Failed to delete resident.");
    }
  }

  // ── Bulk reminder ─────────────────────────────────────────────────────────────
  async function handleBulkReminder() {
    await guard(async () => {
      const targets = filtered.filter(
        (r) => r.paymentStatus === "pending" || r.paymentStatus === "overdue",
      );
      if (!targets.length) return;

      setReminding(true);
      setReminderResult(null);
      let sent = 0,
        failed = 0;

      for (const r of targets) {
        try {
          if (r.paymentStatus === "overdue") {
            await sendOverdueNotice({
              to: r.email,
              name: r.name,
              houseNumber: r.houseNumber,
            });
          } else {
            await sendPaymentReminder({
              to: r.email,
              name: r.name,
              houseNumber: r.houseNumber,
            });
          }
          sent++;
        } catch {
          failed++;
        }
      }

      setReminderResult({ sent, failed });
      setReminding(false);
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className='p-4 md:p-6 space-y-4'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h1 className='text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50'>
          Residents
        </h1>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleBulkReminder}
            disabled={reminding || blocked}
          >
            {reminding ? "Sending…" : "📨 Bulk Reminder"}
          </Button>
          <Button size='sm' onClick={openAdd}>
            + Add Resident
          </Button>
        </div>
      </div>

      {/* Rate limit warning */}
      {cooldownMessage && (
        <Alert type='warning' onDismiss={() => {}}>
          {cooldownMessage}
        </Alert>
      )}

      {/* Reminder result */}
      {reminderResult && (
        <Alert
          type={reminderResult.failed ? "warning" : "success"}
          onDismiss={() => setReminderResult(null)}
        >
          Sent {reminderResult.sent} reminder
          {reminderResult.sent !== 1 ? "s" : ""}.
          {reminderResult.failed > 0 && ` ${reminderResult.failed} failed.`}
        </Alert>
      )}

      {/* Page-level error */}
      {error && (
        <Alert type='danger' onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <div className='flex flex-wrap gap-3'>
        <Input
          placeholder='Search name, house, email…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-xs'
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='max-w-40'
        >
          <option value='all'>All statuses</option>
          <option value='paid'>Paid</option>
          <option value='pending'>Pending</option>
          <option value='overdue'>Overdue</option>
        </Select>
      </div>

      {/* Table */}
      <Card className='overflow-x-auto'>
        {loading ? (
          <p className='p-6 text-center text-zinc-500'>Loading residents…</p>
        ) : filtered.length === 0 ? (
          <p className='p-6 text-center text-zinc-500'>
            No residents match your filters.
          </p>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-zinc-200 dark:border-zinc-700 text-left text-zinc-500 dark:text-zinc-400'>
                <th className='px-4 py-3 font-medium'>House</th>
                <th className='px-4 py-3 font-medium'>Name</th>
                <th className='px-4 py-3 font-medium hidden sm:table-cell'>
                  Email
                </th>
                <th className='px-4 py-3 font-medium hidden md:table-cell'>
                  Phone
                </th>
                <th className='px-4 py-3 font-medium'>Status</th>
                <th className='px-4 py-3 font-medium text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className='hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors'
                >
                  <td className='px-4 py-3 font-mono font-medium text-zinc-700 dark:text-zinc-300'>
                    {r.houseNumber}
                  </td>
                  <td className='px-4 py-3 text-zinc-900 dark:text-zinc-100'>
                    {r.name}
                    {r.isAdmin && (
                      <span className='ml-2 text-xs text-green-600 dark:text-green-400 font-medium'>
                        admin
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-zinc-600 dark:text-zinc-400 hidden sm:table-cell'>
                    {r.email}
                  </td>
                  <td className='px-4 py-3 text-zinc-600 dark:text-zinc-400 hidden md:table-cell'>
                    {r.phone}
                  </td>
                  <td className='px-4 py-3'>
                    <Badge
                      color={
                        r.paymentStatus === "paid"
                          ? "green"
                          : r.paymentStatus === "overdue"
                            ? "red"
                            : "yellow"
                      }
                    >
                      {r.paymentStatus}
                    </Badge>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='xs'
                        disabled={blocked}
                        onClick={() => {
                          guard(async () => {
                            if (r.paymentStatus === "overdue") {
                              await sendOverdueNotice({
                                to: r.email,
                                name: r.name,
                                houseNumber: r.houseNumber,
                              });
                            } else {
                              await sendPaymentReminder({
                                to: r.email,
                                name: r.name,
                                houseNumber: r.houseNumber,
                              });
                            }
                          });
                        }}
                        title='Send reminder'
                      >
                        📨
                      </Button>
                      <Button
                        variant='ghost'
                        size='xs'
                        onClick={() => openEdit(r)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant='ghost'
                        size='xs'
                        className='text-red-500 hover:text-red-700'
                        onClick={() => handleDelete(r)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <Card className='w-full max-w-md space-y-4'>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              {editing ? "Edit Resident" : "Add Resident"}
            </h2>

            {saveError && <Alert type='danger'>{saveError}</Alert>}

            {/* Name */}
            <div className='space-y-1'>
              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Full Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder='Jane Doe'
              />
              {formErrors.name && (
                <p className='text-xs text-red-500'>{formErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className='space-y-1'>
              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Email
              </label>
              <Input
                type='email'
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder='jane@example.com'
              />
              {formErrors.email && (
                <p className='text-xs text-red-500'>{formErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className='space-y-1'>
              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder='+254 700 000 000'
              />
              {formErrors.phone && (
                <p className='text-xs text-red-500'>{formErrors.phone}</p>
              )}
            </div>

            {/* House Number */}
            <div className='space-y-1'>
              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                House Number
              </label>
              <Input
                value={form.houseNumber}
                onChange={(e) => handleChange("houseNumber", e.target.value)}
                placeholder='SD-12'
                disabled={!!editing}
              />
              {formErrors.houseNumber && (
                <p className='text-xs text-red-500'>{formErrors.houseNumber}</p>
              )}
            </div>

            {/* Is Admin */}
            <label className='flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer'>
              <input
                type='checkbox'
                checked={form.isAdmin}
                onChange={(e) => handleChange("isAdmin", e.target.checked)}
                className='rounded'
              />
              Grant admin access
            </label>

            <Divider />

            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Resident"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
