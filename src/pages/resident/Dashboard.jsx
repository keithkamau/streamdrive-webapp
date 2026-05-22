import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Badge, Card } from "../../components/ui";
import { getResidents } from "../../services/residentService";
import {
  getPaymentsByYear,
  buildPaymentMap,
} from "../../services/paymentService";
import { getSettings } from "../../services/settingsService";

const CURRENT_YEAR = 2026;
const CURRENT_MONTH = "May";

const MONTHS = [
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

const statusConfig = {
  paid: { label: "Paid", variant: "paid", dot: "bg-green-500" },
  pending: { label: "Pending", variant: "pending", dot: "bg-yellow-400" },
  overdue: { label: "Overdue", variant: "overdue", dot: "bg-red-500" },
  null: { label: "No data", variant: "default", dot: "bg-zinc-300" },
};

export default function Dashboard() {
  const { user } = useAuth();

  const [residents, setResidents] = useState([]);
  const [paymentMap, setPaymentMap] = useState({});
  const [levyAmount, setLevyAmount] = useState(3000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [residentData, paymentData, settings] = await Promise.all([
          getResidents(),
          getPaymentsByYear(CURRENT_YEAR),
          getSettings(),
        ]);
        setResidents(residentData);
        setPaymentMap(buildPaymentMap(paymentData));
        setLevyAmount(settings.levyAmount);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const daysLeft = (() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return end.getDate() - now.getDate();
  })();

  // ── Estate-wide stats ─────────────────────────────────────────────────────
  const total = residents.length;
  const paidCount = residents.filter((r) => r.paymentStatus === "paid").length;
  const overdueCount = residents.filter(
    (r) => r.paymentStatus === "overdue",
  ).length;
  const pendingCount = residents.filter(
    (r) => r.paymentStatus === "pending",
  ).length;
  const collectionRate = total ? Math.round((paidCount / total) * 100) : 0;
  const totalCollected = paidCount * levyAmount;
  const totalOutstanding = (overdueCount + pendingCount) * levyAmount;

  // ── Current admin's own payment status ────────────────────────────────────
  const myStatus = paymentMap[user?.houseNumber]?.[CURRENT_MONTH] ?? "pending";
  const myHistory = MONTHS.map((month) => ({
    month,
    status: paymentMap[user?.houseNumber]?.[month] ?? null,
  })).filter((m) => m.status !== null);

  const myCfg = statusConfig[myStatus] ?? statusConfig.null;

  if (loading) {
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
          <p className='text-sm text-zinc-400'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in'>
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700'>
          {error}
        </div>
      )}

      {/* Welcome banner */}
      <div className='rounded-2xl bg-green-600 px-6 py-5 flex items-center justify-between gap-4'>
        <div>
          <p className='text-green-100 text-sm font-medium'>Welcome back</p>
          <h2 className='font-display font-bold text-white text-2xl mt-0.5'>
            {user?.firstName} {user?.lastName}
          </h2>
          <div className='flex items-center gap-2 mt-2 flex-wrap'>
            <span className='text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-md'>
              {user?.houseNumber}
            </span>
            {user?.isAdmin && (
              <span className='text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-md'>
                Admin
              </span>
            )}
          </div>
        </div>
        <div className='shrink-0 w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center'>
          <svg
            className='w-8 h-8 text-white'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            viewBox='0 0 24 24'
          >
            <path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' />
            <polyline points='9 22 9 12 15 12 15 22' />
          </svg>
        </div>
      </div>

      {/* Estate overview */}
      <div>
        <h3 className='font-display font-bold text-zinc-900 text-base mb-3'>
          Estate Overview — {CURRENT_MONTH} {CURRENT_YEAR}
        </h3>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card className='p-4 flex flex-col gap-1'>
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
              Collected
            </p>
            <p className='font-display font-bold text-xl text-green-600'>
              KES {totalCollected.toLocaleString()}
            </p>
            <p className='text-xs text-zinc-400'>
              {paidCount} of {total} houses
            </p>
          </Card>
          <Card className='p-4 flex flex-col gap-1'>
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
              Outstanding
            </p>
            <p className='font-display font-bold text-xl text-red-500'>
              KES {totalOutstanding.toLocaleString()}
            </p>
            <p className='text-xs text-zinc-400'>
              {overdueCount + pendingCount} houses
            </p>
          </Card>
          <Card className='p-4 flex flex-col gap-1'>
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
              Overdue
            </p>
            <p className='font-display font-bold text-xl text-red-500'>
              {overdueCount}
            </p>
            <p className='text-xs text-zinc-400'>houses behind</p>
          </Card>
          <Card className='p-4 flex flex-col gap-1'>
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
              Collection Rate
            </p>
            <p className='font-display font-bold text-xl text-zinc-900'>
              {collectionRate}%
            </p>
            <div className='w-full h-1.5 bg-zinc-100 rounded-full mt-1'>
              <div
                className='h-full bg-green-500 rounded-full transition-all duration-500'
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* My payment status */}
      <div>
        <h3 className='font-display font-bold text-zinc-900 text-base mb-3'>
          My Payment Status
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {/* Current month */}
          <Card className='p-5 flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
                {CURRENT_MONTH} {CURRENT_YEAR}
              </p>
              <Badge variant={myCfg.variant}>
                <span className={`w-1.5 h-1.5 rounded-full ${myCfg.dot}`} />
                {myCfg.label}
              </Badge>
            </div>
            <p className='font-display font-bold text-2xl text-zinc-900'>
              KES {levyAmount.toLocaleString()}
            </p>
            <p className='text-xs text-zinc-400'>
              {myStatus === "paid"
                ? "Payment received. Thank you!"
                : `Due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
            </p>
          </Card>

          {/* Months paid this year */}
          <Card className='p-5 flex flex-col gap-3'>
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
              Paid This Year
            </p>
            <p className='font-display font-bold text-2xl text-zinc-900'>
              {myHistory.filter((m) => m.status === "paid").length}
              <span className='text-sm font-normal text-zinc-400 ml-1'>
                / {myHistory.length} months
              </span>
            </p>
            <div className='flex gap-1'>
              {myHistory.map((m, i) => (
                <div
                  key={i}
                  title={m.month}
                  className={`flex-1 h-1.5 rounded-full ${
                    m.status === "paid"
                      ? "bg-green-500"
                      : m.status === "overdue"
                        ? "bg-red-400"
                        : "bg-yellow-400"
                  }`}
                />
              ))}
            </div>
            <p className='text-xs text-zinc-400'>Payment consistency</p>
          </Card>

          {/* Total paid */}
          <Card className='p-5 flex flex-col gap-3'>
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
              Total Paid
            </p>
            <p className='font-display font-bold text-2xl text-zinc-900'>
              KES{" "}
              {(
                myHistory.filter((m) => m.status === "paid").length * levyAmount
              ).toLocaleString()}
            </p>
            <p className='text-xs text-zinc-400'>
              Across {myHistory.filter((m) => m.status === "paid").length}{" "}
              payments in {CURRENT_YEAR}
            </p>
          </Card>
        </div>
      </div>

      {/* Due soon / overdue alerts */}
      {myStatus === "pending" && daysLeft <= 7 && (
        <div className='flex gap-3 items-start bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
          <svg
            className='w-5 h-5 text-yellow-500 shrink-0 mt-0.5'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
            <line x1='12' y1='9' x2='12' y2='13' />
            <line x1='12' y1='17' x2='12.01' y2='17' />
          </svg>
          <div>
            <p className='text-sm font-semibold text-yellow-800'>
              Payment due soon
            </p>
            <p className='text-xs text-yellow-700 mt-0.5'>
              Your {CURRENT_MONTH} security levy of KES{" "}
              {levyAmount.toLocaleString()} is due in {daysLeft} day
              {daysLeft !== 1 ? "s" : ""}. Please ensure payment is made before
              end of month.
            </p>
          </div>
        </div>
      )}

      {myStatus === "overdue" && (
        <div className='flex gap-3 items-start bg-red-50 border border-red-200 rounded-xl p-4'>
          <svg
            className='w-5 h-5 text-red-500 shrink-0 mt-0.5'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='8' x2='12' y2='12' />
            <line x1='12' y1='16' x2='12.01' y2='16' />
          </svg>
          <div>
            <p className='text-sm font-semibold text-red-800'>
              Payment overdue
            </p>
            <p className='text-xs text-red-700 mt-0.5'>
              Your {CURRENT_MONTH} security levy is overdue. Please contact the
              estate admin or make payment immediately.
            </p>
          </div>
        </div>
      )}

      {/* Recent payment history */}
      {myHistory.length > 0 && (
        <Card>
          <div className='px-5 py-4 border-b border-zinc-100 flex items-center justify-between'>
            <h3 className='font-display font-bold text-zinc-900 text-base'>
              Payment History
            </h3>
            <Badge variant='default'>{myHistory.length} records</Badge>
          </div>
          <div className='divide-y divide-zinc-100'>
            {myHistory.map((record, i) => {
              const cfg = statusConfig[record.status] ?? statusConfig.null;
              return (
                <div
                  key={i}
                  className='flex items-center justify-between px-5 py-3.5'
                >
                  <div className='flex items-center gap-3'>
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <div>
                      <p className='text-sm font-medium text-zinc-900'>
                        {record.month}
                      </p>
                      <p className='text-xs text-zinc-400'>{CURRENT_YEAR}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className='text-sm font-semibold text-zinc-700'>
                      KES {levyAmount.toLocaleString()}
                    </span>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
