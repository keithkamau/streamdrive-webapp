import { useState, useEffect } from "react";
import { Card, Button, Input, Alert, Badge } from "../../components/ui";
import { getSettings, updateSettings } from "../../services/settingsService";
import { ADMIN_HOUSES, HOUSE_NUMBERS } from "../../data/estateConfig";
import { seedNewMonth } from "../../services/residentService";

const TABS = ["General", "Levy", "Admins", "Notifications"];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("General");
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  const [estateName, setEstateName] = useState("Stream Drive");
  const [estateLocation, setEstateLocation] = useState("Nairobi, Kenya");
  const [levyAmount, setLevyAmount] = useState(3000);
  const [levyDueDay, setLevyDueDay] = useState("end");
  const [emailReminders, setEmailReminders] = useState(true);
  const [reminderDays, setReminderDays] = useState(7);
  const [overdueReminders, setOverdueReminders] = useState(true);
  const [seedMonth, setSeedMonth] = useState("June");
  const [seedYear, setSeedYear] = useState(2025);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState("");

  useEffect(() => {
    getSettings()
      .then((s) => {
        setEstateName(s.estateName);
        setEstateLocation(s.location);
        setLevyAmount(s.levyAmount);
        setLevyDueDay(s.levyDueDay);
        setEmailReminders(s.emailReminders);
        setReminderDays(s.reminderDays);
        setOverdueReminders(s.overdueReminders);
      })
      .catch(() => setError("Failed to load settings."))
      .finally(() => setPageLoading(false));
  }, []);

  const showSaved = (msg = "Settings saved successfully.") => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 3000);
  };

  const handleSave = async (fields, msg) => {
    setSaving(true);
    setError("");
    try {
      await updateSettings(fields);
      showSaved(msg);
    } catch {
      setError("Failed to save settings. Please try again.");
    }
    setSaving(false);
  };

  const handleSeedMonth = async () => {
    setSeeding(true);
    setSeedSuccess("");
    try {
      await seedNewMonth(seedMonth, seedYear);
      setSeedSuccess(
        `Pending payment records seeded for ${seedMonth} ${seedYear}.`,
      );
      setTimeout(() => setSeedSuccess(""), 4000);
    } catch {
      setError("Failed to seed payments. Please try again.");
    }
    setSeeding(false);
  };

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
          <p className='text-sm text-zinc-400'>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in'>
      <div>
        <h2 className='font-display font-bold text-zinc-900 text-xl'>
          Settings
        </h2>
        <p className='text-sm text-zinc-400 mt-0.5'>
          Manage estate configuration and preferences
        </p>
      </div>

      {saved && <Alert variant='success'>{saved}</Alert>}
      {error && <Alert variant='danger'>{error}</Alert>}

      {/* Tabs */}
      <div className='flex gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-xl w-fit flex-wrap'>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === tab
                ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── General ──────────────────────────────────────────────────────────── */}
      {activeTab === "General" && (
        <Card className='p-6 flex flex-col gap-6'>
          <div>
            <h3 className='font-display font-bold text-zinc-900 text-base mb-1'>
              Estate Information
            </h3>
            <p className='text-xs text-zinc-400'>
              Basic details about Stream Drive estate
            </p>
          </div>
          <div className='flex flex-col gap-4'>
            <Input
              label='Estate Name'
              value={estateName}
              onChange={(e) => setEstateName(e.target.value)}
              placeholder='Stream Drive'
            />
            <Input
              label='Location'
              value={estateLocation}
              onChange={(e) => setEstateLocation(e.target.value)}
              placeholder='Nairobi, Kenya'
            />
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                Total Houses
              </label>
              <div className='flex items-center gap-2 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg'>
                <span className='text-sm text-zinc-900 font-medium'>
                  {HOUSE_NUMBERS.length} houses
                </span>
                <span className='text-xs text-zinc-400'>
                  (configured in estateConfig.js)
                </span>
              </div>
            </div>
          </div>
          <div className='pt-2 border-t border-zinc-100 flex justify-end'>
            <Button
              onClick={() =>
                handleSave({ estateName, location: estateLocation })
              }
              size='md'
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      )}

      {/* ── Levy ─────────────────────────────────────────────────────────────── */}
      {activeTab === "Levy" && (
        <Card className='p-6 flex flex-col gap-6'>
          <div>
            <h3 className='font-display font-bold text-zinc-900 text-base mb-1'>
              Security Levy
            </h3>
            <p className='text-xs text-zinc-400'>
              Configure the monthly security fee for all residents
            </p>
          </div>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                Monthly Levy Amount (KES)
              </label>
              <div className='relative'>
                <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400'>
                  KES
                </span>
                <input
                  type='number'
                  value={levyAmount}
                  onChange={(e) => setLevyAmount(Number(e.target.value))}
                  className='w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-12 pr-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
                />
              </div>
            </div>
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                Payment Due
              </label>
              <div className='flex gap-2'>
                {[
                  { value: "end", label: "End of month" },
                  { value: "15", label: "15th of month" },
                  { value: "1", label: "1st of month" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLevyDueDay(opt.value)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      levyDueDay === opt.value
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className='bg-green-50 border border-green-200 rounded-xl p-4'>
              <p className='text-xs font-semibold uppercase tracking-widest text-green-700 mb-2'>
                Preview
              </p>
              <p className='text-sm text-green-800'>
                Each resident will be charged{" "}
                <span className='font-bold'>
                  KES {levyAmount.toLocaleString()}
                </span>{" "}
                per month, due{" "}
                <span className='font-bold'>
                  {levyDueDay === "end"
                    ? "at the end of each month"
                    : `on the ${levyDueDay}${levyDueDay === "1" ? "st" : "th"} of each month`}
                </span>
                .
              </p>
            </div>
          </div>
          {/* Seed new month */}
          <div className='flex flex-col gap-3 pt-2 border-t border-zinc-100'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1'>
                New Month Setup
              </p>
              <p className='text-xs text-zinc-400'>
                At the start of each month, seed pending payment records for all
                current residents. Safe to run multiple times — existing records
                are not overwritten.
              </p>
            </div>
            <div className='flex items-center gap-3 flex-wrap'>
              <select
                value={seedMonth}
                onChange={(e) => setSeedMonth(e.target.value)}
                className='bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
              >
                {[
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
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={seedYear}
                onChange={(e) => setSeedYear(Number(e.target.value))}
                className='bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <Button
                variant='outline'
                size='md'
                loading={seeding}
                onClick={handleSeedMonth}
              >
                Seed Payments
              </Button>
            </div>
            {seedSuccess && <Alert variant='success'>{seedSuccess}</Alert>}
          </div>
          <div className='pt-2 border-t border-zinc-100 flex justify-end'>
            <Button
              onClick={() =>
                handleSave({ levyAmount, levyDueDay }, "Levy settings saved.")
              }
              size='md'
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      )}

      {/* ── Admins ───────────────────────────────────────────────────────────── */}
      {activeTab === "Admins" && (
        <div className='flex flex-col gap-4'>
          <Card className='p-6 flex flex-col gap-5'>
            <div>
              <h3 className='font-display font-bold text-zinc-900 text-base mb-1'>
                Admin Houses
              </h3>
              <p className='text-xs text-zinc-400'>
                These house numbers have full admin privileges. Update after
                each estate election.
              </p>
            </div>
            <div className='flex flex-col gap-2'>
              {ADMIN_HOUSES.map((house) => (
                <div
                  key={house}
                  className='flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center'>
                      <svg
                        className='w-4 h-4 text-green-600'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                      >
                        <path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' />
                        <polyline points='9 22 9 12 15 12 15 22' />
                      </svg>
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-zinc-900 font-mono'>
                        {house}
                      </p>
                      <p className='text-xs text-zinc-400'>Admin house</p>
                    </div>
                  </div>
                  <Badge variant='admin'>Admin</Badge>
                </div>
              ))}
            </div>
            <div className='bg-zinc-50 border border-zinc-200 rounded-xl p-4'>
              <div className='flex gap-2.5 items-start'>
                <svg
                  className='w-4 h-4 text-zinc-400 shrink-0 mt-0.5'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <circle cx='12' cy='12' r='10' />
                  <line x1='12' y1='8' x2='12' y2='12' />
                  <line x1='12' y1='16' x2='12.01' y2='16' />
                </svg>
                <p className='text-xs text-zinc-500 leading-relaxed'>
                  To update admin privileges after an election, edit the{" "}
                  <span className='font-mono font-semibold text-zinc-700'>
                    ADMIN_HOUSES
                  </span>{" "}
                  array in{" "}
                  <span className='font-mono font-semibold text-zinc-700'>
                    src/data/estateConfig.js
                  </span>
                  . Changes take effect on next login.
                </p>
              </div>
            </div>
          </Card>

          <Card className='p-6 flex flex-col gap-4 border-red-200'>
            <div>
              <h3 className='font-display font-bold text-red-600 text-base mb-1'>
                Danger Zone
              </h3>
              <p className='text-xs text-zinc-400'>
                Irreversible actions — proceed with caution.
              </p>
            </div>
            <div className='flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl'>
              <div>
                <p className='text-sm font-semibold text-zinc-900'>
                  Reset all payment records
                </p>
                <p className='text-xs text-zinc-400 mt-0.5'>
                  Clears all payment history for a new financial year.
                </p>
              </div>
              <Button variant='danger' size='sm'>
                Reset
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Notifications ────────────────────────────────────────────────────── */}
      {activeTab === "Notifications" && (
        <Card className='p-6 flex flex-col gap-6'>
          <div>
            <h3 className='font-display font-bold text-zinc-900 text-base mb-1'>
              Reminder Settings
            </h3>
            <p className='text-xs text-zinc-400'>
              Configure how and when residents are notified about payments
            </p>
          </div>
          <div className='flex flex-col gap-5'>
            {/* Channels */}
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                Notification Channels
              </p>
              <div className='flex items-center justify-between px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center'>
                    <svg
                      className='w-4 h-4 text-blue-600'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
                      <polyline points='22,6 12,13 2,6' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-zinc-900'>
                      Email Reminders
                    </p>
                    <p className='text-xs text-zinc-400'>
                      Sent to resident email addresses via Supabase
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEmailReminders(!emailReminders)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    emailReminders ? "bg-green-600" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      emailReminders ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Reminder timing */}
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                Reminder Timing
              </p>
              <div className='flex flex-col gap-1.5'>
                <label className='text-xs text-zinc-500'>
                  Send reminder this many days before due date
                </label>
                <div className='flex gap-2'>
                  {[3, 5, 7, 10, 14].map((d) => (
                    <button
                      key={d}
                      onClick={() => setReminderDays(d)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                        reminderDays === d
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className='text-xs text-zinc-400'>
                  Reminders sent{" "}
                  <span className='font-semibold text-zinc-600'>
                    {reminderDays} days
                  </span>{" "}
                  before end of month.
                </p>
              </div>
            </div>

            {/* Overdue */}
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                Overdue Reminders
              </p>
              <div className='flex items-center justify-between px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl'>
                <div>
                  <p className='text-sm font-semibold text-zinc-900'>
                    Send overdue reminders
                  </p>
                  <p className='text-xs text-zinc-400'>
                    Automatically remind residents with outstanding payments
                  </p>
                </div>
                <button
                  onClick={() => setOverdueReminders(!overdueReminders)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    overdueReminders ? "bg-green-600" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      overdueReminders ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className='bg-green-50 border border-green-200 rounded-xl p-4'>
              <p className='text-xs font-semibold uppercase tracking-widest text-green-700 mb-2'>
                Current Configuration
              </p>
              <ul className='flex flex-col gap-1.5'>
                {[
                  `Email reminders: ${emailReminders ? "On" : "Off"}`,
                  `Send ${reminderDays} days before due date`,
                  `Overdue reminders: ${overdueReminders ? "On" : "Off"}`,
                ].map((item) => (
                  <li
                    key={item}
                    className='flex items-center gap-2 text-xs text-green-800'
                  >
                    <svg
                      className='w-3.5 h-3.5 text-green-500 shrink-0'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2.5'
                      viewBox='0 0 24 24'
                    >
                      <polyline points='20 6 9 17 4 12' />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className='pt-2 border-t border-zinc-100 flex justify-end'>
            <Button
              onClick={() =>
                handleSave(
                  { emailReminders, reminderDays, overdueReminders },
                  "Notification settings saved.",
                )
              }
              size='md'
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
