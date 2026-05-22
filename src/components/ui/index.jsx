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
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-green-600 hover:bg-green-500 active:bg-green-700 text-white focus:ring-green-500",
    secondary:
      "bg-white/10 hover:bg-white/20 text-white border border-white/20 focus:ring-white/30",
    ghost:
      "bg-transparent hover:bg-white/8 text-green-400 hover:text-green-300 focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
    outline:
      "bg-transparent border border-green-600 text-green-400 hover:bg-green-600 hover:text-white focus:ring-green-500",
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
        <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
          {label}
        </label>
      )}
      <input
        className={`w-full bg-zinc-50 border ${
          error ? "border-red-500" : "border-zinc-300"
        } rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
        transition-all duration-200 ${className}`}
        {...props}
      />
      {error && <p className='text-xs text-red-400'>{error}</p>}
      {hint && !error && <p className='text-xs text-zinc-500'>{hint}</p>}
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
    { label: "", color: "bg-zinc-700" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-yellow-500" },
    { label: "Good", color: "bg-green-400" },
    { label: "Strong", color: "bg-green-500" },
  ];

  return (
    <div className='flex flex-col gap-1.5'>
      {label && (
        <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
          {label}
        </label>
      )}
      <div className='relative'>
        <input
          {...props}
          type={show ? "text" : "password"}
          onChange={handleChange}
          className={`w-full bg-zinc-50 border ${
            error ? "border-red-500" : "border-zinc-300"
          } rounded-lg px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          transition-all duration-200`}
        />
        <button
          type='button'
          onClick={() => setShow(!show)}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors'
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
                  i <= strength ? strengthMap[strength].color : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <span className='text-xs text-zinc-400 w-12'>
            {strengthMap[strength].label}
          </span>
        </div>
      )}
      {error && <p className='text-xs text-red-400'>{error}</p>}
      {hint && !error && <p className='text-xs text-zinc-500'>{hint}</p>}
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
        <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
          {label}
        </label>
      )}
      <select
        className={`w-full bg-zinc-50 border ${
          error ? "border-red-500" : "border-zinc-300"
        } rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400
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
          <option key={opt.value} value={opt.value} className='bg-zinc-900'>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className='text-xs text-red-400'>{error}</p>}
      {hint && !error && <p className='text-xs text-zinc-500'>{hint}</p>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-zinc-800 text-zinc-300 border border-zinc-700",
    admin: "bg-green-900/60 text-green-300 border border-green-700",
    paid: "bg-green-900/60 text-green-300 border border-green-700",
    pending: "bg-yellow-900/60 text-yellow-300 border border-yellow-700",
    overdue: "bg-red-900/60 text-red-300 border border-red-700",
    info: "bg-blue-900/60 text-blue-300 border border-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white border border-zinc-200 rounded-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ children, variant = "info", className = "" }) {
  const variants = {
    info: "bg-blue-50 border-blue-200 text-blue-700",
    success: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    danger: "bg-red-50 border-red-200 text-red-700",
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
  };
  return (
    <div
      className={`flex gap-2.5 items-start p-3.5 rounded-lg border text-sm ${variants[variant]} ${className}`}
    >
      {icons[variant]}
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
      <div className='flex-1 h-px bg-zinc-800' />
      {label && (
        <span className='text-xs text-zinc-600 uppercase tracking-widest'>
          {label}
        </span>
      )}
      <div className='flex-1 h-px bg-zinc-800' />
    </div>
  );
}
