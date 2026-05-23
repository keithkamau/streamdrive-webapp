import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Badge, Card } from "../../components/ui";
import { getResidents } from "../../services/residentService";
import {
  getPaymentsByYear,
  buildPaymentMap,
} from "../../services/paymentService";
import { getSettings } from "../../services/settingsService";
import { useRealtime } from "../../hooks/useRealtime";

const CURRENT_YEAR = 2025;
const CURRENT_MONTH = "June";

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

function StatCard({ label, value, sub, color = "text-zinc-900", children }) {
  return (
    <Card className='p-4 flex flex-col gap-1'>
      <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
        {label}
      </p>
      <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
      {sub && <p className='text-xs text-zinc-400'>{sub}</p>}
      {children}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const [residents, setResidents] = useState([]);
  const [paymentMap, setPaymentMap] = useState({});
  const [levyAmount, setLevyAmount] = useState(3000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time updates
  useRealtime(
    "payments",
    useCallback(() => load(), [load]),
  );
  useRealtime(
    "residents",
    useCallback(() => load(), [load]),
  );

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

  // ── Monthly trend — last 6 months ─────────────────────────────────────────
  const currentMonthIndex = MONTHS.indexOf(CURRENT_MONTH);
  const last6Months = MONTHS.slice(
    Math.max(0, currentMonthIndex - 5),
    currentMonthIndex + 1,
  );

  const monthlyTrend = last6Months.map((month) => {
    const monthPaid = residents.filter(
      (r) => paymentMap[r.houseNumber]?.[month] === "paid",
    ).length;
    return {
      month: month.slice(0, 3),
      paid: monthPaid,
      pct: total ? Math.round((monthPaid / total) * 100) : 0,
    };
  });

  // ── Overdue residents list ────────────────────────────────────────────────
  const overdueResidents = residents
    .filter((r) => r.paymentStatus === "overdue")
    .slice(0, 5);

  // ── My own payment status ─────────────────────────────────────────────────
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
            <span className='text-xs text-green-200'>
              {new Date().toLocaleDateString("en-KE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
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

      {/* Due soon banner */}
      {daysLeft <= 7 && (
        <div className='flex gap-3 items-center bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3.5'>
          <svg
            className='w-5 h-5 text-yellow-500 shrink-0'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
            <line x1='12' y1='9' x2='12' y2='13' />
            <line x1='12' y1='17' x2='12.01' y2='17' />
          </svg>
          <p className='text-sm text-yellow-800'>
            <span className='font-semibold'>
              {CURRENT_MONTH} levy due in {daysLeft} day
              {daysLeft !== 1 ? "s" : ""}.
            </span>{" "}
            {pendingCount + overdueCount} house
            {pendingCount + overdueCount !== 1 ? "s" : ""} yet to pay.
          </p>
        </div>
      )}

      {/* Estate overview */}
      <div>
        <h3 className='font-display font-bold text-zinc-900 text-base mb-3'>
          Estate Overview — {CURRENT_MONTH} {CURRENT_YEAR}
        </h3>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            label='Collected'
            value={`KES ${totalCollected.toLocaleString()}`}
            sub={`${paidCount} of ${total} houses`}
            color='text-green-600'
          />
          <StatCard
            label='Outstanding'
            value={`KES ${totalOutstanding.toLocaleString()}`}
            sub={`${overdueCount + pendingCount} houses`}
            color='text-red-500'
          />
          <StatCard
            label='Overdue'
            value={overdueCount}
            sub='houses behind'
            color={overdueCount > 0 ? "text-red-500" : "text-zinc-900"}
          />
          <StatCard label='Collection Rate' value={`${collectionRate}%`}>
            <div className='w-full h-1.5 bg-zinc-100 rounded-full mt-1'>
              <div
                className='h-full bg-green-500 rounded-full transition-all duration-500'
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </StatCard>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Monthly trend */}
        <Card className='p-5'>
          <h3 className='font-display font-bold text-zinc-900 text-sm mb-4'>
            Collection Trend — Last 6 Months
          </h3>
          <div className='flex items-end gap-2 h-24'>
            {monthlyTrend.map((m) => (
              <div
                key={m.month}
                className='flex-1 flex flex-col items-center gap-1.5'
              >
                <span className='text-[10px] font-semibold text-zinc-500'>
                  {m.pct}%
                </span>
                <div
                  className='w-full bg-zinc-100 rounded-t-md relative'
                  style={{ height: "60px" }}
                >
                  <div
                    className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${
                      m.month === CURRENT_MONTH.slice(0, 3)
                        ? "bg-green-600"
                        : "bg-green-300"
                    }`}
                    style={{ height: `${Math.max(4, m.pct)}%` }}
                  />
                </div>
                <span className='text-[10px] text-zinc-400'>{m.month}</span>
              </div>
            ))}
          </div>
          <div className='flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100'>
            <div className='flex items-center gap-1.5'>
              <div className='w-2.5 h-2.5 rounded-sm bg-green-600' />
              <span className='text-xs text-zinc-400'>Current month</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <div className='w-2.5 h-2.5 rounded-sm bg-green-300' />
              <span className='text-xs text-zinc-400'>Previous months</span>
            </div>
          </div>
        </Card>

        {/* Overdue residents */}
        <Card className='p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-display font-bold text-zinc-900 text-sm'>
              Overdue Residents
            </h3>
            {overdueResidents.length > 0 && (
              <Badge variant='overdue'>{overdueCount} overdue</Badge>
            )}
          </div>
          {overdueResidents.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-6 gap-2 text-center'>
              <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <polyline points='20 6 9 17 4 12' />
                </svg>
              </div>
              <p className='text-sm font-semibold text-zinc-500'>All clear!</p>
              <p className='text-xs text-zinc-400'>
                No overdue payments this month
              </p>
            </div>
          ) : (
            <div className='flex flex-col divide-y divide-zinc-100'>
              {overdueResidents.map((r) => (
                <div
                  key={r.id}
                  className='flex items-center justify-between py-2.5'
                >
                  <div className='flex items-center gap-2.5'>
                    <div className='w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0'>
                      <span className='text-[10px] font-bold text-red-600'>
                        {r.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className='text-sm font-medium text-zinc-900'>
                        {r.name}
                      </p>
                      <p className='text-xs text-zinc-400 font-mono'>
                        {r.houseNumber}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-semibold text-red-500'>
                      {r.monthsOverdue}mo overdue
                    </p>
                    <p className='text-xs text-zinc-400'>
                      KES {(r.monthsOverdue * levyAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {overdueCount > 5 && (
                <p className='text-xs text-zinc-400 pt-2.5 text-center'>
                  +{overdueCount - 5} more — view All Payments for full list
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* My payment status */}
      <div>
        <h3 className='font-display font-bold text-zinc-900 text-base mb-3'>
          My Payment Status
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
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
    </div>
  );
}
