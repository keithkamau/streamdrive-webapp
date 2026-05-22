import LoginPage from "./LoginPage";

export default function AuthLayout() {
  return (
    <div className='min-h-screen bg-white flex flex-col'>
      {/* Dot grid background */}
      <div
        className='fixed inset-0 pointer-events-none opacity-[0.03]'
        style={{
          backgroundImage: `radial-gradient(circle, #16a34a 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Green ambient glow */}
      <div
        className='fixed top-0 left-0 w-150 h-150 pointer-events-none'
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(22,163,74,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Navbar */}
      <header className='relative z-10 flex items-center justify-between px-8 py-5 border-b border-zinc-200'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center'>
            <svg
              className='w-5 h-5 text-white'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              viewBox='0 0 24 24'
            >
              <path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' />
              <polyline points='9 22 9 12 15 12 15 22' />
            </svg>
          </div>
          <div>
            <p className='font-display font-bold text-zinc-900 text-base leading-none'>
              Stream Drive
            </p>
            <p className='text-[10px] uppercase tracking-[0.18em] text-zinc-400 mt-0.5'>
              Estate Admin Portal
            </p>
          </div>
        </div>
        <span className='text-xs font-semibold uppercase tracking-widest text-zinc-400 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg'>
          Admin Access Only
        </span>
      </header>

      {/* Main */}
      <main className='relative z-10 flex-1 flex items-center justify-center px-4 py-12'>
        <LoginPage />
      </main>

      {/* Footer */}
      <footer className='relative z-10 text-center py-5 text-xs text-zinc-400'>
        © {new Date().getFullYear()} Stream Drive Residential Estate · Nairobi
      </footer>
    </div>
  );
}
