// pages/admin/Residents.jsx
import { useState, useEffect, useCallback } from "react";
import {
  getCurrentMonth,
  getCurrentYear,
  formatMonthYear,
} from "../../lib/dateUtils";
import {
  getResidents,
  addResident,
  updateResident,
  deleteResident,
} from "../../services/residentService";
import { getPaymentsForMonth } from "../../services/paymentService";
import { getHouses } from "../../services/houseService";
import {
  sendPaymentReminder,
  sendOverdueNotice,
} from "../../services/notificationService";
import { useRealtime } from "../../hooks/useRealtime";
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  Alert,
  Spinner,
  Divider,
} from "../../components/ui/index";

// ─── Status meta ─────────────────────────────────────────────────────────────

const STATUS_META = {
  paid: { label: "Paid", color: "green" },
  pending: { label: "Pending", color: "yellow" },
  overdue: { label: "Overdue", color: "red" },
};

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  houseNumber: "",
  isAdmin: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [paymentMap, setPaymentMap] = useState({});
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = adding new
  const [form, setForm] = useState(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Per-row reminder
  const [remindingId, setRemindingId] = useState(null);

  // Bulk reminder
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // Search
  const [search, setSearch] = useState("");

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const month = getCurrentMonth();
      const year = getCurrentYear();

      const [allResidents, payments, allHouses] = await Promise.all([
        getResidents(),
        getPaymentsForMonth(month, year),
        getHouses(),
      ]);

      setResidents(allResidents);
      setHouses(allHouses);

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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtime("residents", loadData);
  useRealtime("payments", loadData);
  useRealtime("houses", loadData);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = residents.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.houseNumber.toLowerCase().includes(q)
    );
  });

  // ── Drawer helpers ────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (resident) => {
    setEditTarget(resident);
    setForm({
      name: resident.name,
      email: resident.email,
      phone: resident.phone ?? "",
      houseNumber: resident.houseNumber,
      isAdmin: resident.isAdmin ?? false,
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditTarget(null);
    setFormError(null);
  };

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Save (add or update) ──────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) return setFormError("Name is required.");
    if (!form.email.trim()) return setFormError("Email is required.");
    if (!form.houseNumber.trim())
      return setFormError("House number is required.");

    try {
      setFormSaving(true);
      setFormError(null);

      if (editTarget) {
        await updateResident(editTarget.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          houseNumber: form.houseNumber,
          isAdmin: form.isAdmin,
        });
      } else {
        await addResident({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          houseNumber: form.houseNumber,
          isAdmin: form.isAdmin,
        });
      }

      closeDrawer();
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteResident(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Per-row reminder ──────────────────────────────────────────────────────

  const handleSendReminder = async (resident) => {
    try {
      setRemindingId(resident.id);
      const payment = paymentMap[resident.houseNumber];
      const status = payment?.status ?? "pending";

      if (status === "overdue") {
        await sendOverdueNotice(
          resident,
          payment ?? { amount: 0 },
          getCurrentMonth(),
          getCurrentYear(),
        );
      } else {
        await sendPaymentReminder(
          resident,
          payment ?? { amount: 0 },
          getCurrentMonth(),
          getCurrentYear(),
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRemindingId(null);
    }
  };

  // ── Bulk reminder ─────────────────────────────────────────────────────────
  // Sends to all pending + overdue residents visible in the current filtered list.
  // Uses the correct email type per status.

  const handleBulkReminder = async () => {
    try {
      setBulkSending(true);
      setBulkResult(null);

      const month = getCurrentMonth();
      const year = getCurrentYear();

      const targets = filtered.filter((r) => {
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
            await sendOverdueNotice(r, p ?? { amount: 0 }, month, year);
          } else {
            await sendPaymentReminder(r, p ?? { amount: 0 }, month, year);
          }
          sent++;
        } catch {
          failed++;
        }
      }

      setBulkResult({ sent, failed, total: targets.length });
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkSending(false);
    }
  };

  // ── House options for select ──────────────────────────────────────────────

  const houseOptions = houses.map((h) => ({
    value: h.houseNumber ?? h,
    label: h.houseNumber ?? h,
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  const pendingOrOverdueCount = filtered.filter((r) => {
    const status = paymentMap[r.houseNumber]?.status ?? "pending";
    return status === "pending" || status === "overdue";
  }).length;

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* ── Header ── */}
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-display font-semibold text-zinc-900 dark:text-zinc-100'>
            Residents
          </h1>
          <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
            {residents.length} resident{residents.length !== 1 ? "s" : ""} ·{" "}
            {formatMonthYear(getCurrentMonth(), getCurrentYear())}
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
          <Button variant='primary' onClick={openAdd}>
            + Add Resident
          </Button>
        </div>
      </div>

      {error && <Alert variant='error'>{error}</Alert>}

      {bulkResult && (
        <Alert variant={bulkResult.failed > 0 ? "warning" : "success"}>
          Sent {bulkResult.sent} of {bulkResult.total} reminder
          {bulkResult.total !== 1 ? "s" : ""}.
          {bulkResult.failed > 0 && ` ${bulkResult.failed} failed.`}
        </Alert>
      )}

      {/* ── Search ── */}
      <Input
        placeholder='Search by name, email, or house…'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* ── Table ── */}
      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <Card className='p-8 text-center text-zinc-500 dark:text-zinc-400'>
          {search
            ? "No residents match your search."
            : "No residents yet. Add one to get started."}
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
                    Name
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell'>
                    Email
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400'>
                    Status
                  </th>
                  <th className='px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
                {filtered.map((resident) => {
                  const payment = paymentMap[resident.houseNumber];
                  const status =
                    payment?.status ?? resident.paymentStatus ?? "pending";
                  const meta = STATUS_META[status] ?? STATUS_META.pending;
                  const isReminding = remindingId === resident.id;
                  const canRemind =
                    status === "pending" || status === "overdue";

                  return (
                    <tr
                      key={resident.id}
                      className='hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors'
                    >
                      <td className='px-4 py-3 font-mono font-medium text-zinc-700 dark:text-zinc-300'>
                        {resident.houseNumber}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='text-zinc-800 dark:text-zinc-200 font-medium'>
                          {resident.name}
                        </div>
                        {resident.phone && (
                          <div className='text-xs text-zinc-400'>
                            {resident.phone}
                          </div>
                        )}
                      </td>
                      <td className='px-4 py-3 text-zinc-600 dark:text-zinc-400 hidden sm:table-cell'>
                        {resident.email}
                      </td>
                      <td className='px-4 py-3'>
                        <Badge color={meta.color}>{meta.label}</Badge>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center justify-end gap-1.5'>
                          {/* Per-row reminder */}
                          {canRemind && (
                            <button
                              onClick={() => handleSendReminder(resident)}
                              disabled={isReminding}
                              className='px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors disabled:opacity-40'
                              title='Send payment reminder'
                            >
                              {isReminding ? "…" : "✉"}
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => openEdit(resident)}
                            className='px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors'
                            title='Edit resident'
                          >
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(resident)}
                            className='px-2 py-1 text-xs font-medium text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors'
                            title='Delete resident'
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Add / Edit drawer ── */}
      {drawerOpen && (
        <div className='fixed inset-0 z-40 flex'>
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/40 backdrop-blur-sm'
            onClick={closeDrawer}
          />

          {/* Panel */}
          <div className='relative ml-auto w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col animate-fade-in'>
            {/* Drawer header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800'>
              <h3 className='font-display font-semibold text-zinc-900 dark:text-zinc-100'>
                {editTarget ? "Edit Resident" : "Add Resident"}
              </h3>
              <button
                onClick={closeDrawer}
                className='w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
              >
                ✕
              </button>
            </div>

            {/* Drawer body */}
            <div className='flex-1 overflow-y-auto px-6 py-5 space-y-4'>
              {formError && <Alert variant='error'>{formError}</Alert>}

              <Input
                label='Full Name'
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder='Jane Doe'
                autoFocus
              />

              <Input
                label='Email Address'
                type='email'
                value={form.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                placeholder='jane@example.com'
              />

              <Input
                label='Phone Number'
                type='tel'
                value={form.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                placeholder='+254 700 000 000'
              />

              <Select
                label='House Number'
                value={form.houseNumber}
                onChange={(e) =>
                  handleFormChange("houseNumber", e.target.value)
                }
                options={[
                  { value: "", label: "Select a house…" },
                  ...houseOptions,
                ]}
              />

              <Divider />

              <label className='flex items-start gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={form.isAdmin}
                  onChange={(e) =>
                    handleFormChange("isAdmin", e.target.checked)
                  }
                  className='mt-0.5 h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500'
                />
                <div>
                  <p className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
                    Admin account
                  </p>
                  <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                    Requires the house to be listed in Settings → Admin Houses.
                  </p>
                </div>
              </label>
            </div>

            {/* Drawer footer */}
            <div className='px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2'>
              <Button
                variant='secondary'
                onClick={closeDrawer}
                disabled={formSaving}
              >
                Cancel
              </Button>
              <Button
                variant='primary'
                onClick={handleSave}
                disabled={formSaving}
              >
                {formSaving ? (
                  <Spinner size='sm' />
                ) : editTarget ? (
                  "Save Changes"
                ) : (
                  "Add Resident"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
          <Card className='w-full max-w-sm p-6 space-y-4 animate-fade-in'>
            <h2 className='font-display font-semibold text-zinc-900 dark:text-zinc-100'>
              Delete Resident
            </h2>
            <p className='text-sm text-zinc-600 dark:text-zinc-400'>
              Are you sure you want to remove{" "}
              <span className='font-medium text-zinc-800 dark:text-zinc-200'>
                {deleteTarget.name}
              </span>{" "}
              (House {deleteTarget.houseNumber})? This cannot be undone.
            </p>
            <div className='flex justify-end gap-2 pt-1'>
              <Button
                variant='secondary'
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant='danger'
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Spinner size='sm' /> : "Delete"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
