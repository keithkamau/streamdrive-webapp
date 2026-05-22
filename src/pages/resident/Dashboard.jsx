import { useAuth } from "../../context/AuthContext";
import { Card, Badge } from "../../components/ui";

const getMonthName = (date) =>
  date.toLocaleString("default", { month: "long", year: "numeric" });

const getDaysUntilEndOfMonth = () => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return end.getDate() - now.getDate();
};

// Mock payment history — replace with real data later
const generateMockPayments = (houseNumber) => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const rand = Math.random();
    months.push({
      id: i,
      month: getMonthName(d),
      amount: 3000,
      status: i === 0 ? "pending" : rand > 0.2 ? "paid" : "overdue",
      paidOn:
        rand > 0.2 && i !== 0
          ? new Date(
              d.getFullYear(),
              d.getMonth(),
              Math.floor(Math.random() * 25) + 1,
            ).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : null,
    });
  }
  return months;
};

const statusConfig = {
  paid: { label: "Paid", variant: "paid", dot: "bg-green-500" },
  pending: { label: "Pending", variant: "pending", dot: "bg-yellow-500" },
  overdue: { label: "Overdue", variant: "overdue", dot: "bg-red-500" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const payments = generateMockPayments(user?.houseNumber);
  const daysLeft = getDaysUntilEndOfMonth();
  const currentMonth = payments[payments.length - 1];
  const totalPaid = payments.filter((p) => p.status === "paid").length;
  const totalOverdue = payments.filter((p) => p.status === "overdue").length;

  return (
    <div className='flex flex-col gap-6 animate-fade-in'>
      {/* Welcome banner */}
      <div className='rounded-2xl bg-green-600 px-6 py-5 flex items-center justify-between'>
        <div>
          <p className='text-green-100 text-sm font-medium mb-0.5'>
            Welcome back
          </p>
          <h2 className='font-display font-bold text-white text-2xl'>
            {user?.firstName} {user?.lastName}
          </h2>
          <p className='text-green-200 text-sm mt-1'>{user?.houseNumber}</p>
        </div>
        <div className='hidden sm:flex flex-col items-end gap-1'>
          <p className='text-green-200 text-xs font-medium uppercase tracking-widest'>
            Payment due in
          </p>
          <p className='font-display font-bold text-white text-3xl'>
            {daysLeft}
          </p>
          <p className='text-green-200 text-xs'>days</p>
        </div>
      </div>

      {/* Due soon warning */}
      {daysLeft <= 7 && currentMonth.status !== "paid" && (
        <div className='flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3.5'>
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
              Your security levy for {currentMonth.month} is due in {daysLeft}{" "}
              day{daysLeft !== 1 ? "s" : ""}. Please ensure payment is made
              before end of month.
            </p>
          </div>
        </div>
      )}

      {/* Overdue warning */}
      {totalOverdue > 0 && (
        <div className='flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5'>
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
              Overdue payments
            </p>
            <p className='text-xs text-red-700 mt-0.5'>
              You have {totalOverdue} overdue payment
              {totalOverdue !== 1 ? "s" : ""}. Please contact the estate admin
              to resolve.
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          {
            label: "Current Status",
            value: statusConfig[currentMonth.status].label,
            sub: currentMonth.month,
            accent:
              currentMonth.status === "paid"
                ? "text-green-600"
                : currentMonth.status === "overdue"
                  ? "text-red-600"
                  : "text-yellow-600",
          },
          {
            label: "Monthly Levy",
            value: `KES ${currentMonth.amount.toLocaleString()}`,
            sub: "Security fee",
            accent: "text-zinc-900",
          },
          {
            label: "Paid This Year",
            value: `${totalPaid} / ${payments.length}`,
            sub: "Months settled",
            accent: "text-green-600",
          },
          {
            label: "Days Until Due",
            value: daysLeft,
            sub: "End of month",
            accent: daysLeft <= 7 ? "text-yellow-600" : "text-zinc-900",
          },
        ].map((stat) => (
          <Card key={stat.label} className='p-4'>
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2'>
              {stat.label}
            </p>
            <p className={`font-display font-bold text-2xl ${stat.accent}`}>
              {stat.value}
            </p>
            <p className='text-xs text-zinc-400 mt-1'>{stat.sub}</p>
          </Card>
        ))}
      </div>

      {/* Payment history */}
      <Card>
        <div className='flex items-center justify-between px-5 py-4 border-b border-zinc-100'>
          <h3 className='font-display font-bold text-zinc-900 text-base'>
            Payment History
          </h3>
          <span className='text-xs text-zinc-400'>Last 6 months</span>
        </div>
        <div className='divide-y divide-zinc-100'>
          {[...payments].reverse().map((p) => {
            const cfg = statusConfig[p.status];
            return (
              <div
                key={p.id}
                className='flex items-center justify-between px-5 py-3.5'
              >
                <div className='flex items-center gap-3'>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}
                  />
                  <div>
                    <p className='text-sm font-medium text-zinc-900'>
                      {p.month}
                    </p>
                    <p className='text-xs text-zinc-400'>
                      {p.paidOn
                        ? `Paid on ${p.paidOn}`
                        : p.status === "pending"
                          ? "Awaiting payment"
                          : "Payment not received"}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <span className='text-sm font-semibold text-zinc-900'>
                    KES {p.amount.toLocaleString()}
                  </span>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
