import { useState, useEffect, useCallback } from "react";
import {
  getCurrentMonth,
  getCurrentYear,
  formatMonthYear,
  allMonths,
} from "../../lib/dateUtils";
import { seedMonthlyPayments } from "../../services/paymentService";
import {
  getSettings,
  updateSettings,
  getAdminHouses,
  addAdminHouse,
  removeAdminHouse,
} from "../../services/settingsService";
import {
  Button,
  Input,
  Select,
  Card,
  Alert,
  Spinner,
  Divider,
  Badge,
} from "../../components/ui/index";

// ─── Tab IDs ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "general", label: "General" },
  { id: "levy", label: "Levy" },
  { id: "admins", label: "Admin Houses" },
  { id: "notifications", label: "Notifications" },
];

// ─── Year options for seed dropdown (current year ± 1) ───────────────────────

function yearOptions() {
  const y = getCurrentYear();
  return [y - 1, y, y + 1].map((yr) => ({ value: yr, label: String(yr) }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");

  // ── General / Levy / Notifications form ──────────────────────────────────
  const [form, setForm] = useState({
    estateName: "",
    location: "",
    levyAmount: "",
    levyDueDay: "5",
    emailReminders: true,
    reminderDays: "3",
    overdueReminders: true,
  });
  const [formLoading, setFormLoading] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  // ── Admin houses ──────────────────────────────────────────────────────────
  const [adminHouses, setAdminHouses] = useState([]);
  const [newAdminHouse, setNewAdminHouse] = useState("");
  const [adminHousesLoading, setAdminHousesLoading] = useState(true);
  const [adminHousesMsg, setAdminHousesMsg] = useState(null);

  // ── Seed payments ─────────────────────────────────────────────────────────
  // Default seed target = current month/year (dynamic)
  const [seedMonth, setSeedMonth] = useState(getCurrentMonth);
  const [seedYear, setSeedYear] = useState(getCurrentYear);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState(null);

  // ── Load settings ─────────────────────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    try {
      setFormLoading(true);
      const s = await getSettings();
      setForm({
        estateName: s.estateName ?? "",
        location: s.location ?? "",
        levyAmount: String(s.levyAmount ?? ""),
        levyDueDay: String(s.levyDueDay ?? "5"),
        emailReminders: s.emailReminders ?? true,
        reminderDays: String(s.reminderDays ?? "3"),
        overdueReminders: s.overdueReminders ?? true,
      });
    } catch (err) {
      setFormMessage({ type: "error", text: err.message });
    } finally {
      setFormLoading(false);
    }
  }, []);

  const loadAdminHouses = useCallback(async () => {
    try {
      setAdminHousesLoading(true);
      const list = await getAdminHouses();
      setAdminHouses(list);
    } catch (err) {
      setAdminHousesMsg({ type: "error", text: err.message });
    } finally {
      setAdminHousesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadAdminHouses();
  }, [loadSettings, loadAdminHouses]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setFormSaving(true);
      setFormMessage(null);
      await updateSettings({
        estateName: form.estateName,
        location: form.location,
        levyAmount: parseFloat(form.levyAmount) || 0,
        levyDueDay: parseInt(form.levyDueDay) || 5,
        emailReminders: form.emailReminders,
        reminderDays: parseInt(form.reminderDays) || 3,
        overdueReminders: form.overdueReminders,
      });
      setFormMessage({ type: "success", text: "Settings saved." });
    } catch (err) {
      setFormMessage({ type: "error", text: err.message });
    } finally {
      setFormSaving(false);
    }
  };

  const handleAddAdminHouse = async () => {
    const house = newAdminHouse.trim().toUpperCase();
    if (!house) return;
    try {
      setAdminHousesMsg(null);
      await addAdminHouse(house);
      setNewAdminHouse("");
      await loadAdminHouses();
      setAdminHousesMsg({
        type: "success",
        text: `${house} added as admin house.`,
      });
    } catch (err) {
      setAdminHousesMsg({ type: "error", text: err.message });
    }
  };

  const handleRemoveAdminHouse = async (house) => {
    try {
      setAdminHousesMsg(null);
      await removeAdminHouse(house);
      await loadAdminHouses();
      setAdminHousesMsg({ type: "success", text: `${house} removed.` });
    } catch (err) {
      setAdminHousesMsg({ type: "error", text: err.message });
    }
  };

  const handleSeedPayments = async () => {
    try {
      setSeeding(true);
      setSeedMsg(null);
      await seedMonthlyPayments(seedMonth, seedYear);
      setSeedMsg({
        type: "success",
        text: `Pending payments seeded for ${formatMonthYear(seedMonth, seedYear)}.`,
      });
    } catch (err) {
      setSeedMsg({ type: "error", text: err.message });
    } finally {
      setSeeding(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className='space-y-6 animate-fade-in'>
      <div>
        <h1 className='text-2xl font-display font-semibold text-zinc-900 dark:text-zinc-100'>
          Settings
        </h1>
        <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
          Manage your estate configuration.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className='flex gap-1 border-b border-zinc-200 dark:border-zinc-700'>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-green-600 text-green-600 dark:text-green-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* GENERAL TAB                                                          */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {activeTab === "general" && (
        <Card className='p-6 space-y-5'>
          {formLoading ? (
            <div className='flex justify-center py-8'>
              <Spinner />
            </div>
          ) : (
            <>
              <h2 className='font-display font-semibold text-zinc-800 dark:text-zinc-100'>
                Estate Details
              </h2>

              {formMessage && (
                <Alert variant={formMessage.type}>{formMessage.text}</Alert>
              )}

              <div className='grid gap-4 sm:grid-cols-2'>
                <Input
                  label='Estate Name'
                  value={form.estateName}
                  onChange={(e) =>
                    handleFormChange("estateName", e.target.value)
                  }
                  placeholder='Stream Drive Estate'
                />
                <Input
                  label='Location'
                  value={form.location}
                  onChange={(e) => handleFormChange("location", e.target.value)}
                  placeholder='Nairobi, Kenya'
                />
              </div>

              <div className='flex justify-end pt-2'>
                <Button
                  variant='primary'
                  onClick={handleSaveSettings}
                  disabled={formSaving}
                >
                  {formSaving ? <Spinner size='sm' /> : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* LEVY TAB                                                             */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {activeTab === "levy" && (
        <div className='space-y-6'>
          <Card className='p-6 space-y-5'>
            {formLoading ? (
              <div className='flex justify-center py-8'>
                <Spinner />
              </div>
            ) : (
              <>
                <h2 className='font-display font-semibold text-zinc-800 dark:text-zinc-100'>
                  Levy Configuration
                </h2>

                {formMessage && (
                  <Alert variant={formMessage.type}>{formMessage.text}</Alert>
                )}

                <div className='grid gap-4 sm:grid-cols-2'>
                  <Input
                    label='Monthly Levy Amount (KES)'
                    type='number'
                    value={form.levyAmount}
                    onChange={(e) =>
                      handleFormChange("levyAmount", e.target.value)
                    }
                    placeholder='5000'
                  />
                  <Input
                    label='Due Day of Month'
                    type='number'
                    min={1}
                    max={28}
                    value={form.levyDueDay}
                    onChange={(e) =>
                      handleFormChange("levyDueDay", e.target.value)
                    }
                    placeholder='5'
                  />
                </div>

                <div className='flex justify-end pt-2'>
                  <Button
                    variant='primary'
                    onClick={handleSaveSettings}
                    disabled={formSaving}
                  >
                    {formSaving ? <Spinner size='sm' /> : "Save Changes"}
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Seed payments section */}
          <Card className='p-6 space-y-4'>
            <div>
              <h2 className='font-display font-semibold text-zinc-800 dark:text-zinc-100'>
                Seed Monthly Payments
              </h2>
              <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
                Create pending payment records for all residents for a specific
                month. Existing records are not overwritten.
              </p>
            </div>

            {seedMsg && <Alert variant={seedMsg.type}>{seedMsg.text}</Alert>}

            <div className='flex flex-wrap gap-3 items-end'>
              {/* Month picker — uses dynamic allMonths() */}
              <div className='w-40'>
                <Select
                  label='Month'
                  value={seedMonth}
                  onChange={(e) => setSeedMonth(Number(e.target.value))}
                  options={allMonths()}
                />
              </div>

              {/* Year picker — shows current year ± 1 */}
              <div className='w-32'>
                <Select
                  label='Year'
                  value={seedYear}
                  onChange={(e) => setSeedYear(Number(e.target.value))}
                  options={yearOptions()}
                />
              </div>

              <Button
                variant='primary'
                onClick={handleSeedPayments}
                disabled={seeding}
              >
                {seeding ? <Spinner size='sm' /> : "Seed Payments"}
              </Button>
            </div>

            <p className='text-xs text-zinc-400'>
              Currently targeting:{" "}
              <span className='font-medium text-zinc-600 dark:text-zinc-300'>
                {formatMonthYear(seedMonth, seedYear)}
              </span>
            </p>
          </Card>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ADMIN HOUSES TAB                                                     */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {activeTab === "admins" && (
        <Card className='p-6 space-y-5'>
          <div>
            <h2 className='font-display font-semibold text-zinc-800 dark:text-zinc-100'>
              Admin Houses
            </h2>
            <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
              Residents in these houses have admin privileges. Changes take
              effect on next login.
            </p>
          </div>

          {adminHousesMsg && (
            <Alert variant={adminHousesMsg.type}>{adminHousesMsg.text}</Alert>
          )}

          {/* Current admin houses */}
          {adminHousesLoading ? (
            <div className='flex justify-center py-4'>
              <Spinner />
            </div>
          ) : adminHouses.length === 0 ? (
            <p className='text-sm text-zinc-400'>
              No admin houses configured yet.
            </p>
          ) : (
            <div className='flex flex-wrap gap-2'>
              {adminHouses.map((house) => (
                <span
                  key={house}
                  className='inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-sm font-medium text-green-700 dark:text-green-300'
                >
                  {house}
                  <button
                    onClick={() => handleRemoveAdminHouse(house)}
                    className='w-4 h-4 rounded-full hover:bg-green-200 dark:hover:bg-green-700 flex items-center justify-center text-green-600 dark:text-green-400 transition-colors'
                    aria-label={`Remove ${house}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <Divider />

          {/* Add new admin house */}
          <div className='flex gap-2'>
            <Input
              placeholder='House number, e.g. A1'
              value={newAdminHouse}
              onChange={(e) => setNewAdminHouse(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleAddAdminHouse()}
              className='flex-1'
            />
            <Button
              variant='primary'
              onClick={handleAddAdminHouse}
              disabled={!newAdminHouse.trim()}
            >
              Add
            </Button>
          </div>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* NOTIFICATIONS TAB                                                    */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {activeTab === "notifications" && (
        <Card className='p-6 space-y-5'>
          {formLoading ? (
            <div className='flex justify-center py-8'>
              <Spinner />
            </div>
          ) : (
            <>
              <h2 className='font-display font-semibold text-zinc-800 dark:text-zinc-100'>
                Email Notifications
              </h2>

              {formMessage && (
                <Alert variant={formMessage.type}>{formMessage.text}</Alert>
              )}

              <div className='space-y-4'>
                {/* Email reminders toggle */}
                <label className='flex items-start gap-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={form.emailReminders}
                    onChange={(e) =>
                      handleFormChange("emailReminders", e.target.checked)
                    }
                    className='mt-0.5 h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500'
                  />
                  <div>
                    <p className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
                      Automatic payment reminders
                    </p>
                    <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                      Send reminders before the levy due date.
                    </p>
                  </div>
                </label>

                {form.emailReminders && (
                  <div className='ml-7 w-48'>
                    <Input
                      label='Days before due date'
                      type='number'
                      min={1}
                      max={14}
                      value={form.reminderDays}
                      onChange={(e) =>
                        handleFormChange("reminderDays", e.target.value)
                      }
                    />
                  </div>
                )}

                {/* Overdue reminders toggle */}
                <label className='flex items-start gap-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={form.overdueReminders}
                    onChange={(e) =>
                      handleFormChange("overdueReminders", e.target.checked)
                    }
                    className='mt-0.5 h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500'
                  />
                  <div>
                    <p className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
                      Overdue payment notices
                    </p>
                    <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                      Send an email when a payment is marked overdue.
                    </p>
                  </div>
                </label>
              </div>

              <div className='flex justify-end pt-2'>
                <Button
                  variant='primary'
                  onClick={handleSaveSettings}
                  disabled={formSaving}
                >
                  {formSaving ? <Spinner size='sm' /> : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
