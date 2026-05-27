import { useState } from "react";

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-green-600 hover:bg-green-500 active:bg-green-700 text-white focus:ring-green-500",
    secondary:
      "bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-700 focus:ring-zinc-400",
    ghost:
      "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 focus:ring-zinc-400",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
    outline:
      "bg-transparent border border-green-600 text-green-600 hover:bg-green-600 hover:text-white dark:border-green-500 dark:text-green-400 dark:hover:bg-green-600 dark:hover:text-white focus:ring-green-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
    xl: "px-8 py-4 text-base gap-2 w-full",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className='animate-spin w-4 h-4' fill='none' viewBox='0 0 24 24'>
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
      )}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, hint, className = "", ...props }) {
  return (
    <div className='flex flex-col gap-1.5'>
      {label && (
        <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400'>
          {label}
        </label>
      )}
      <input
        className={`w-full bg-white dark:bg-zinc-800 border ${
          error ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
        } rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
        transition-all duration-200 ${className}`}
        {...props}
      />
      {error && <p className='text-xs text-red-400'>{error}</p>}
      {hint && !error && (
        <p className='text-xs text-zinc-500 dark:text-zinc-400'>{hint}</p>
      )}
    </div>
  );
}

// ── PasswordInput ─────────────────────────────────────────────────────────────
export function PasswordInput({
  label,
  error,
  hint,
  showStrength = false,
  ...props
}) {
  const [show, setShow] = useState(false);
  const [strength, setStrength] = useState(0);

  const handleChange = (e) => {
    if (showStrength) {
      const v = e.target.value;
      let s = 0;
      if (v.length >= 8) s++;
      if (/[A-Z]/.test(v)) s++;
      if (/[0-9]/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v)) s++;
      setStrength(s);
    }
    props.onChange?.(e);
  };

  const strengthMap = [
    { label: "", color: "bg-zinc-300 dark:bg-zinc-600" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-yellow-500" },
    { label: "Good", color: "bg-green-400" },
    { label: "Strong", color: "bg-green-500" },
  ];

  return (
    <div className='flex flex-col gap-1.5'>
      {label && (
        <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400'>
          {label}
        </label>
      )}
      <div className='relative'>
        <input
          {...props}
          type={show ? "text" : "password"}
          onChange={handleChange}
          className={`w-full bg-white dark:bg-zinc-800 border ${
            error ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
          } rounded-lg px-3.5 py-2.5 pr-10 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          transition-all duration-200`}
        />
        <button
          type='button'
          onClick={() => setShow(!show)}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors'
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24' />
              <line x1='1' y1='1' x2='23' y2='23' />
            </svg>
          ) : (
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
              <circle cx='12' cy='12' r='3' />
            </svg>
          )}
        </button>
      </div>
      {showStrength && props.value?.length > 0 && (
        <div className='flex items-center gap-2 mt-1'>
          <div className='flex gap-1 flex-1'>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= strength
                    ? strengthMap[strength].color
                    : "bg-zinc-200 dark:bg-zinc-600"
                }`}
              />
            ))}
          </div>
          <span className='text-xs text-zinc-400 dark:text-zinc-500 w-12'>
            {strengthMap[strength].label}
          </span>
        </div>
      )}
      {error && <p className='text-xs text-red-400'>{error}</p>}
      {hint && !error && (
        <p className='text-xs text-zinc-500 dark:text-zinc-400'>{hint}</p>
      )}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({
  label,
  error,
  hint,
  options = [],
  placeholder,
  className = "",
  ...props
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      {label && (
        <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400'>
          {label}
        </label>
      )}
      <select
        className={`w-full bg-white dark:bg-zinc-800 border ${
          error ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
        } rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
        transition-all duration-200 cursor-pointer ${className}`}
        {...props}
      >
        {placeholder && (
          <option value='' disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className='text-xs text-red-400'>{error}</p>}
      {hint && !error && (
        <p className='text-xs text-zinc-500 dark:text-zinc-400'>{hint}</p>
      )}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
// Supports both `variant` (named) and `color` (semantic: green/yellow/red/blue/zinc)
export function Badge({ children, variant, color, className = "" }) {
  // color prop → used by payment status cells
  const colorMap = {
    green:
      "bg-green-100  text-green-700  border border-green-200  dark:bg-green-900/30 dark:text-green-300  dark:border-green-700",
    yellow:
      "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    red: "bg-red-100    text-red-700    border border-red-200    dark:bg-red-900/30    dark:text-red-300    dark:border-red-700",
    blue: "bg-blue-100   text-blue-700   border border-blue-200   dark:bg-blue-900/30   dark:text-blue-300   dark:border-blue-700",
    zinc: "bg-zinc-100   text-zinc-600   border border-zinc-200   dark:bg-zinc-700      dark:text-zinc-300   dark:border-zinc-600",
  };

  // variant prop → used by named semantic badges
  const variantMap = {
    default: colorMap.zinc,
    admin: colorMap.green,
    paid: colorMap.green,
    pending: colorMap.yellow,
    overdue: colorMap.red,
    info: colorMap.blue,
  };

  const cls = color ? colorMap[color] : variantMap[variant ?? "default"];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${cls} ${className}`}
    >
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ children, variant = "info", className = "" }) {
  const variants = {
    info: "bg-blue-50   dark:bg-blue-900/20  border border-blue-200   dark:border-blue-800   text-blue-700   dark:text-blue-300",
    success:
      "bg-green-50  dark:bg-green-900/20 border border-green-200  dark:border-green-800  text-green-700  dark:text-green-300",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
    danger:
      "bg-red-50    dark:bg-red-900/20   border border-red-200    dark:border-red-800    text-red-700    dark:text-red-300",
    error:
      "bg-red-50    dark:bg-red-900/20   border border-red-200    dark:border-red-800    text-red-700    dark:text-red-300",
  };

  const icons = {
    info: (
      <svg
        className='w-4 h-4 shrink-0 mt-0.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <circle cx='12' cy='12' r='10' />
        <line x1='12' y1='8' x2='12' y2='12' />
        <line x1='12' y1='16' x2='12.01' y2='16' />
      </svg>
    ),
    success: (
      <svg
        className='w-4 h-4 shrink-0 mt-0.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <path d='M22 11.08V12a10 10 0 11-5.93-9.14' />
        <polyline points='22 4 12 14.01 9 11.01' />
      </svg>
    ),
    warning: (
      <svg
        className='w-4 h-4 shrink-0 mt-0.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
        <line x1='12' y1='9' x2='12' y2='13' />
        <line x1='12' y1='17' x2='12.01' y2='17' />
      </svg>
    ),
    danger: (
      <svg
        className='w-4 h-4 shrink-0 mt-0.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <circle cx='12' cy='12' r='10' />
        <line x1='15' y1='9' x2='9' y2='15' />
        <line x1='9' y1='9' x2='15' y2='15' />
      </svg>
    ),
    error: (
      <svg
        className='w-4 h-4 shrink-0 mt-0.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <circle cx='12' cy='12' r='10' />
        <line x1='15' y1='9' x2='9' y2='15' />
        <line x1='9' y1='9' x2='15' y2='15' />
      </svg>
    ),
  };

  return (
    <div
      className={`flex gap-2.5 items-start p-3.5 rounded-lg text-sm ${variants[variant] ?? variants.info} ${className}`}
    >
      {icons[variant] ?? icons.info}
      <div>{children}</div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = "md" }) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <svg
      className={`animate-spin text-green-500 ${sizes[size]}`}
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
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div className='flex items-center gap-3 my-2'>
      <div className='flex-1 h-px bg-zinc-200 dark:bg-zinc-700' />
      {label && (
        <span className='text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest'>
          {label}
        </span>
      )}
      <div className='flex-1 h-px bg-zinc-200 dark:bg-zinc-700' />
    </div>
  );
}
