import { useState } from "react";
import { Badge, Card } from "../../components/ui";

// ─────────────────────────────────────────────────────────────────────────────
//  ESTATE MAP CONFIGURATION
//  Each house has an x/y position on the SVG canvas (viewBox 0 0 900 620).
//  Adjust x/y values to match the actual layout of Stream Drive.
//  roads: array of { x1,y1,x2,y2 } line segments drawn behind the houses.
// ─────────────────────────────────────────────────────────────────────────────

const MAP_CONFIG = {
  width: 900,
  height: 620,
  roads: [
    // Main horizontal road
    { x1: 0, y1: 310, x2: 900, y2: 310 },
    // Main vertical road
    { x1: 450, y1: 0, x2: 450, y2: 620 },
    // Top horizontal connector
    { x1: 0, y1: 155, x2: 900, y2: 155 },
    // Bottom horizontal connector
    { x1: 0, y1: 465, x2: 900, y2: 465 },
    // Left vertical connector
    { x1: 225, y1: 0, x2: 225, y2: 620 },
    // Right vertical connector
    { x1: 675, y1: 0, x2: 675, y2: 620 },
  ],
  // Gate marker
  gate: { x: 450, y: 610, label: "MAIN GATE" },
};

// House nodes — adjust x/y to match real estate layout
const HOUSES = [
  // Top-left quadrant
  { houseNumber: "SD-01", x: 100, y: 80 },
  { houseNumber: "SD-02", x: 100, y: 230 },
  { houseNumber: "SD-03", x: 320, y: 80 },
  { houseNumber: "SD-04", x: 320, y: 230 },
  // Top-right quadrant
  { houseNumber: "SD-05", x: 580, y: 80 },
  { houseNumber: "SD-06", x: 580, y: 230 },
  { houseNumber: "SD-07", x: 790, y: 80 },
  { houseNumber: "SD-08", x: 790, y: 230 },
  // Bottom-left quadrant
  { houseNumber: "SD-09", x: 100, y: 380 },
  { houseNumber: "SD-10", x: 100, y: 530 },
  { houseNumber: "SD-11A", x: 320, y: 380 },
  { houseNumber: "SD-11B", x: 320, y: 530 },
  // Bottom-right quadrant
  { houseNumber: "SD-12", x: 580, y: 380 },
  { houseNumber: "SD-13", x: 580, y: 530 },
  { houseNumber: "SD-14", x: 790, y: 380 },
  { houseNumber: "SD-15", x: 790, y: 530 },
];

// Mock payment statuses — replace with real data context later
const mockStatuses = {
  "SD-01": "paid",
  "SD-02": "paid",
  "SD-03": "overdue",
  "SD-04": "paid",
  "SD-05": "paid",
  "SD-06": "pending",
  "SD-07": "overdue",
  "SD-08": "paid",
  "SD-09": "paid",
  "SD-10": "overdue",
  "SD-11A": "paid",
  "SD-11B": "pending",
  "SD-12": "paid",
  "SD-13": "overdue",
  "SD-14": "paid",
  "SD-15": "pending",
};

// Mock resident names per house
const mockResidentNames = {
  "SD-01": "John Kamau",
  "SD-02": "Mary Wanjiku",
  "SD-03": "Peter Mwangi",
  "SD-04": "Unregistered",
  "SD-05": "Grace Otieno",
  "SD-06": "Unregistered",
  "SD-07": "James Kariuki",
  "SD-08": "Unregistered",
  "SD-09": "Alice Njeri",
  "SD-10": "David Ochieng",
  "SD-11A": "Unregistered",
  "SD-11B": "Unregistered",
  "SD-12": "Susan Muthoni",
  "SD-13": "Unregistered",
  "SD-14": "Unregistered",
  "SD-15": "Unregistered",
};

const statusConfig = {
  paid: {
    label: "Paid",
    fill: "#16a34a",
    stroke: "#15803d",
    text: "#fff",
    ring: "#bbf7d0",
    variant: "paid",
  },
  pending: {
    label: "Pending",
    fill: "#eab308",
    stroke: "#ca8a04",
    text: "#fff",
    ring: "#fef9c3",
    variant: "pending",
  },
  overdue: {
    label: "Overdue",
    fill: "#ef4444",
    stroke: "#dc2626",
    text: "#fff",
    ring: "#fee2e2",
    variant: "overdue",
  },
  null: {
    label: "No data",
    fill: "#e4e4e7",
    stroke: "#d1d5db",
    text: "#71717a",
    ring: "#f4f4f5",
    variant: "default",
  },
};

function HouseNode({ house, status, selected, onClick }) {
  const cfg = statusConfig[status] ?? statusConfig[null];
  const isSelected = selected?.houseNumber === house.houseNumber;

  return (
    <g onClick={() => onClick(house)} style={{ cursor: "pointer" }}>
      {/* Selection ring */}
      {isSelected && (
        <circle
          cx={house.x}
          cy={house.y}
          r={28}
          fill={cfg.ring}
          stroke={cfg.stroke}
          strokeWidth={2}
          opacity={0.7}
        />
      )}
      {/* House circle */}
      <circle
        cx={house.x}
        cy={house.y}
        r={22}
        fill={cfg.fill}
        stroke={cfg.stroke}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />
      {/* House icon */}
      <path
        d={`M${house.x - 7},${house.y + 3} L${house.x},${house.y - 6} L${house.x + 7},${house.y + 3} Z`}
        fill={cfg.text}
        opacity={0.9}
      />
      <rect
        x={house.x - 4}
        y={house.y + 3}
        width={8}
        height={7}
        rx={1}
        fill={cfg.text}
        opacity={0.9}
      />
      {/* Label below */}
      <text
        x={house.x}
        y={house.y + 36}
        textAnchor='middle'
        fontSize={9}
        fontFamily="'DM Sans', sans-serif"
        fontWeight='600'
        fill='#3f3f46'
        letterSpacing='0.05em'
      >
        {house.houseNumber}
      </text>
    </g>
  );
}

export default function EstateMap() {
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const total = HOUSES.length;
  const paid = HOUSES.filter(
    (h) => mockStatuses[h.houseNumber] === "paid",
  ).length;
  const overdue = HOUSES.filter(
    (h) => mockStatuses[h.houseNumber] === "overdue",
  ).length;
  const pending = HOUSES.filter(
    (h) => mockStatuses[h.houseNumber] === "pending",
  ).length;

  const handleHouseClick = (house) => {
    setSelected((prev) =>
      prev?.houseNumber === house.houseNumber ? null : house,
    );
  };

  const selectedStatus = selected ? mockStatuses[selected.houseNumber] : null;
  const selectedCfg = statusConfig[selectedStatus] ?? statusConfig[null];

  const visibleHouses =
    filterStatus === "all"
      ? HOUSES
      : HOUSES.filter(
          (h) => (mockStatuses[h.houseNumber] ?? null) === filterStatus,
        );

  return (
    <div className='max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in'>
      {/* Header */}
      <div>
        <h2 className='font-display font-bold text-zinc-900 text-xl'>
          Estate Map
        </h2>
        <p className='text-sm text-zinc-400 mt-0.5'>
          Visual overview of payment status across Stream Drive
        </p>
      </div>

      {/* Summary stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Total Houses
          </p>
          <p className='font-display font-bold text-2xl text-zinc-900'>
            {total}
          </p>
        </Card>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Paid
          </p>
          <p className='font-display font-bold text-2xl text-green-600'>
            {paid}
          </p>
        </Card>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Overdue
          </p>
          <p className='font-display font-bold text-2xl text-red-500'>
            {overdue}
          </p>
        </Card>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Pending
          </p>
          <p className='font-display font-bold text-2xl text-yellow-500'>
            {pending}
          </p>
        </Card>
      </div>

      <div className='flex flex-col lg:flex-row gap-4'>
        {/* Map panel */}
        <Card className='flex-1 overflow-hidden'>
          {/* Map toolbar */}
          <div className='flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 flex-wrap gap-3'>
            <div className='flex items-center gap-4'>
              {/* Legend */}
              {["paid", "pending", "overdue"].map((s) => (
                <div key={s} className='flex items-center gap-1.5'>
                  <div
                    className='w-3 h-3 rounded-full'
                    style={{ background: statusConfig[s].fill }}
                  />
                  <span className='text-xs text-zinc-500 capitalize'>{s}</span>
                </div>
              ))}
            </div>
            {/* Filter */}
            <div className='flex gap-1 bg-zinc-100 border border-zinc-200 p-0.5 rounded-lg'>
              {["all", "paid", "pending", "overdue"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setFilterStatus(s);
                    setSelected(null);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
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

          {/* SVG map */}
          <div className='w-full overflow-x-auto bg-zinc-50'>
            <svg
              viewBox={`0 0 ${MAP_CONFIG.width} ${MAP_CONFIG.height}`}
              className='w-full'
              style={{ minWidth: 480, maxHeight: 520 }}
            >
              {/* Background */}
              <rect
                width={MAP_CONFIG.width}
                height={MAP_CONFIG.height}
                fill='#f8fafc'
              />

              {/* Estate boundary */}
              <rect
                x={20}
                y={20}
                width={MAP_CONFIG.width - 40}
                height={MAP_CONFIG.height - 40}
                rx={12}
                fill='none'
                stroke='#d1d5db'
                strokeWidth={2}
                strokeDasharray='8 4'
              />

              {/* Estate label */}
              <text
                x={MAP_CONFIG.width / 2}
                y={44}
                textAnchor='middle'
                fontSize={11}
                fontFamily="'Syne', sans-serif"
                fontWeight='700'
                fill='#9ca3af'
                letterSpacing='0.15em'
              >
                STREAM DRIVE RESIDENTIAL ESTATE
              </text>

              {/* Roads */}
              {MAP_CONFIG.roads.map((road, i) => (
                <line
                  key={i}
                  x1={road.x1}
                  y1={road.y1}
                  x2={road.x2}
                  y2={road.y2}
                  stroke='#e2e8f0'
                  strokeWidth={18}
                  strokeLinecap='round'
                />
              ))}
              {/* Road centre lines */}
              {MAP_CONFIG.roads.map((road, i) => (
                <line
                  key={`cl-${i}`}
                  x1={road.x1}
                  y1={road.y1}
                  x2={road.x2}
                  y2={road.y2}
                  stroke='#cbd5e1'
                  strokeWidth={1}
                  strokeDasharray='10 8'
                />
              ))}

              {/* Gate */}
              <rect
                x={MAP_CONFIG.gate.x - 28}
                y={MAP_CONFIG.gate.y - 12}
                width={56}
                height={20}
                rx={4}
                fill='#16a34a'
              />
              <text
                x={MAP_CONFIG.gate.x}
                y={MAP_CONFIG.gate.y + 3}
                textAnchor='middle'
                fontSize={8}
                fontFamily="'DM Sans', sans-serif"
                fontWeight='700'
                fill='white'
                letterSpacing='0.1em'
              >
                {MAP_CONFIG.gate.label}
              </text>

              {/* Houses */}
              {HOUSES.map((house) => {
                const isVisible = visibleHouses.find(
                  (h) => h.houseNumber === house.houseNumber,
                );
                return (
                  <g key={house.houseNumber} opacity={isVisible ? 1 : 0.2}>
                    <HouseNode
                      house={house}
                      status={mockStatuses[house.houseNumber] ?? null}
                      selected={selected}
                      onClick={handleHouseClick}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        {/* Detail panel */}
        <div className='lg:w-64 flex flex-col gap-4'>
          {/* Selected house details */}
          <Card className='p-5 flex flex-col gap-4'>
            {selected ? (
              <>
                <div className='flex items-start justify-between'>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1'>
                      Selected House
                    </p>
                    <p className='font-display font-bold text-zinc-900 text-lg'>
                      {selected.houseNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className='p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors'
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

                <div className='flex flex-col gap-2.5'>
                  <div className='flex justify-between items-center py-2 border-b border-zinc-100'>
                    <span className='text-xs text-zinc-400'>Resident</span>
                    <span className='text-sm font-medium text-zinc-900'>
                      {mockResidentNames[selected.houseNumber]}
                    </span>
                  </div>
                  <div className='flex justify-between items-center py-2 border-b border-zinc-100'>
                    <span className='text-xs text-zinc-400'>Status</span>
                    <Badge variant={selectedCfg.variant}>
                      {selectedCfg.label}
                    </Badge>
                  </div>
                  <div className='flex justify-between items-center py-2'>
                    <span className='text-xs text-zinc-400'>Levy</span>
                    <span className='text-sm font-bold text-zinc-900'>
                      KES 3,000
                    </span>
                  </div>
                </div>

                {selectedStatus === "overdue" && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700'>
                    This house is overdue on payment. Consider sending a
                    reminder.
                  </div>
                )}
                {selectedStatus === "pending" && (
                  <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700'>
                    Payment is pending for this month.
                  </div>
                )}
                {selectedStatus === "paid" && (
                  <div className='bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700'>
                    Payment received for this month.
                  </div>
                )}
              </>
            ) : (
              <div className='flex flex-col items-center justify-center gap-3 py-6 text-center'>
                <div className='w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center'>
                  <svg
                    className='w-5 h-5 text-zinc-400'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <polygon points='1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6' />
                  </svg>
                </div>
                <div>
                  <p className='text-sm font-semibold text-zinc-500'>
                    No house selected
                  </p>
                  <p className='text-xs text-zinc-400 mt-0.5'>
                    Click any house on the map
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Quick stats */}
          <Card className='p-5'>
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3'>
              This Month
            </p>
            <div className='flex flex-col gap-2'>
              {["paid", "pending", "overdue"].map((s) => {
                const count = HOUSES.filter(
                  (h) => (mockStatuses[h.houseNumber] ?? null) === s,
                ).length;
                const pct = Math.round((count / total) * 100);
                const cfg = statusConfig[s];
                return (
                  <div key={s} className='flex flex-col gap-1'>
                    <div className='flex justify-between'>
                      <span className='text-xs text-zinc-500 capitalize'>
                        {s}
                      </span>
                      <span className='text-xs font-semibold text-zinc-700'>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className='w-full h-1.5 bg-zinc-100 rounded-full'>
                      <div
                        className='h-full rounded-full transition-all duration-500'
                        style={{
                          width: `${pct}%`,
                          background: cfg.fill,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
