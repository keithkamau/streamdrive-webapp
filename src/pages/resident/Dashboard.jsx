import { useState, useEffect, useCallback } from "react";
import {
  getCurrentMonth,
  getCurrentYear,
  getCurrentMonthName,
  monthName,
  lastNMonths,
} from "../../lib/dateUtils";
import {
  getCurrentMonthStats,
  getCollectionTrend,
  getPaymentsForMonth,
} from "../../services/paymentService";
import { getResidents } from "../../services/residentService";
import { useRealtime } from "../../hooks/useRealtime";
import { Badge, Card, Spinner, Alert } from "../../components/ui/index";

// ─── Tiny bar chart (no external lib needed) ─────────────────────────────────

function TrendBar({ label, paid, total }) {
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex justify-between text-xs text-zinc-500 dark:text-zinc-400'>
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className='h-2 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden'>
        <div
          className='h-full rounded-full bg-green-500 transition-all duration-500'
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = "zinc", sub }) {
  const colorMap = {
    green: "text-green-600 dark:text-green-400",
    yellow: "text-yellow-500 dark:text-yellow-400",
    red: "text-red-500 dark:text-red-400",
    zinc: "text-zinc-700 dark:text-zinc-200",
  };
  return (
    <Card className='p-5'>
      <p className='text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide'>
        {label}
      </p>
      <p className={`mt-1 text-3xl font-display font-bold ${colorMap[color]}`}>
        {value}
      </p>
      {sub && (
        <p className='mt-1 text-xs text-zinc-400 dark:text-zinc-500'>{sub}</p>
      )}
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const currentMonthName = getCurrentMonthName();

  const [stats, setStats] = useState({ paid: 0, pending: 0, overdue: 0 });
  const [trend, setTrend] = useState([]);
  const [overdueResidents, setOverdueResidents] = useState([]);
  const [totalResidents, setTotalResidents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const months = lastNMonths(6); // dynamic — always last 6 months

      const [monthStats, trendData, allResidents, currentPayments] =
        await Promise.all([
          getCurrentMonthStats(),
          getCollectionTrend(months),
          getResidents(),
          getPaymentsForMonth(currentMonth, currentYear),
        ]);

      setStats(monthStats);
      // Reverse so chart goes oldest → newest (left to right)
      setTrend([...trendData].reverse());
      setTotalResidents(allResidents.length);

      // Build overdue list — residents whose current-month payment is overdue
      const paymentMap = {};
      currentPayments.forEach((p) => {
        paymentMap[p.houseNumber] = p;
      });

      const overdue = allResidents
        .filter((r) => {
          const p = paymentMap[r.houseNumber];
          return p?.status === "overdue" || r.paymentStatus === "overdue";
        })
        .map((r) => ({
          ...r,
          amount: paymentMap[r.houseNumber]?.amount ?? 0,
        }));

      setOverdueResidents(overdue);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtime("payments", loadData);
  useRealtime("residents", loadData);

  // ── Derived ────────────────────────────────────────────────────────────────

  const collectionRate =
    totalResidents > 0 ? Math.round((stats.paid / totalResidents) * 100) : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Spinner />
      </div>
    );
  }

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* ── Header ── */}
      <div>
        <h1 className='text-2xl font-display font-semibold text-zinc-900 dark:text-zinc-100'>
          Dashboard
        </h1>
        <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
          {currentMonthName} {currentYear} overview
        </p>
      </div>

      {error && <Alert variant='error'>{error}</Alert>}

      {/* ── Stat cards ── */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        <StatCard label='Total Residents' value={totalResidents} color='zinc' />
        <StatCard
          label='Paid'
          value={stats.paid}
          color='green'
          sub={`${collectionRate}% collection`}
        />
        <StatCard label='Pending' value={stats.pending} color='yellow' />
        <StatCard label='Overdue' value={stats.overdue} color='red' />
      </div>

      {/* ── Trend chart ── */}
      <Card className='p-5'>
        <h2 className='text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-4'>
          Collection Rate — Last 6 Months
        </h2>
        {trend.length === 0 ? (
          <p className='text-sm text-zinc-400'>No data yet.</p>
        ) : (
          <div className='space-y-3'>
            {trend.map(({ month, year, total, paid }) => (
              <TrendBar
                key={`${month}-${year}`}
                label={`${monthName(month)} ${year}`}
                paid={paid}
                total={total}
              />
            ))}
          </div>
        )}
      </Card>

      {/* ── Overdue residents ── */}
      {overdueResidents.length > 0 && (
        <Card className='p-5'>
          <h2 className='text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-4'>
            Overdue This Month
          </h2>
          <div className='divide-y divide-zinc-100 dark:divide-zinc-800'>
            {overdueResidents.map((r) => (
              <div
                key={r.id}
                className='flex items-center justify-between py-2.5'
              >
                <div>
                  <p className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
                    {r.name}
                  </p>
                  <p className='text-xs text-zinc-400'>
                    House {r.houseNumber}
                    {r.monthsOverdue > 0 &&
                      ` · ${r.monthsOverdue} month${r.monthsOverdue !== 1 ? "s" : ""} overdue`}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  {r.amount > 0 && (
                    <span className='text-xs text-zinc-500 dark:text-zinc-400'>
                      KES {r.amount.toLocaleString()}
                    </span>
                  )}
                  <Badge color='red'>Overdue</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── All clear ── */}
      {overdueResidents.length === 0 && !loading && (
        <Card className='p-8 text-center'>
          <p className='text-2xl mb-2'>🎉</p>
          <p className='font-medium text-zinc-700 dark:text-zinc-200'>
            All residents are up to date!
          </p>
          <p className='text-sm text-zinc-400 mt-1'>
            No overdue payments for {currentMonthName} {currentYear}.
          </p>
        </Card>
      )}
    </div>
  );
}
