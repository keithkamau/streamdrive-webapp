import { useAuth } from "../../context/AuthContext";

const navItems = [
  {
    label: "Dashboard",
    page: "dashboard",
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <rect x='3' y='3' width='7' height='7' />
        <rect x='14' y='3' width='7' height='7' />
        <rect x='14' y='14' width='7' height='7' />
        <rect x='3' y='14' width='7' height='7' />
      </svg>
    ),
  },
  {
    label: "Announcements",
    page: "announcements",
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <path d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' />
      </svg>
    ),
  },
];

const adminItems = [
  {
    label: "All Payments",
    page: "admin-payments",
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <line x1='8' y1='6' x2='21' y2='6' />
        <line x1='8' y1='12' x2='21' y2='12' />
        <line x1='8' y1='18' x2='21' y2='18' />
        <line x1='3' y1='6' x2='3.01' y2='6' />
        <line x1='3' y1='12' x2='3.01' y2='12' />
        <line x1='3' y1='18' x2='3.01' y2='18' />
      </svg>
    ),
  },
  {
    label: "Residents",
    page: "residents",
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <path d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' />
        <circle cx='9' cy='7' r='4' />
        <path d='M23 21v-2a4 4 0 00-3-3.87' />
        <path d='M16 3.13a4 4 0 010 7.75' />
      </svg>
    ),
  },
  {
    label: "Settings",
    page: "settings",
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <circle cx='12' cy='12' r='3' />
        <path d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' />
      </svg>
    ),
  },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  mobileOpen,
  onClose,
}) {
  const { user } = useAuth();

  const NavItem = ({ item }) => {
    const active = currentPage === item.page;
    return (
      <button
        onClick={() => {
          onNavigate(item.page);
          onClose?.();
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          active
            ? "bg-green-600 text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
      >
        <span className={active ? "text-white" : "text-zinc-400"}>
          {item.icon}
        </span>
        {item.label}
      </button>
    );
  };

  const content = (
    <div className='flex flex-col h-full'>
      {/* Logo */}
      <div className='flex items-center gap-3 px-4 py-5 border-b border-zinc-200'>
        <div className='w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0'>
          <svg
            className='w-4 h-4 text-white'
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
          <p className='font-display font-bold text-zinc-900 text-sm leading-none'>
            Stream Drive
          </p>
          <p className='text-[10px] uppercase tracking-[0.15em] text-zinc-400 mt-0.5'>
            Estate Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className='flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto'>
        {navItems.map((item) => (
          <NavItem key={item.page} item={item} />
        ))}

        {user?.isAdmin && (
          <>
            <div className='flex items-center gap-2 px-3 pt-5 pb-2'>
              <span className='text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400'>
                Admin
              </span>
              <div className='flex-1 h-px bg-zinc-200' />
            </div>
            {adminItems.map((item) => (
              <NavItem key={item.page} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* User card */}
      <div className='px-3 py-4 border-t border-zinc-200'>
        <div className='flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200'>
          <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0'>
            <span className='text-xs font-bold text-green-700'>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-semibold text-zinc-900 truncate'>
              {user?.firstName} {user?.lastName}
            </p>
            <p className='text-xs text-zinc-400 truncate'>
              {user?.houseNumber}
            </p>
          </div>
          {user?.isAdmin && (
            <span className='text-[10px] font-bold uppercase tracking-wide text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded'>
              Admin
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className='hidden lg:flex flex-col w-60 shrink-0 border-r border-zinc-200 bg-white h-screen sticky top-0'>
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className='lg:hidden fixed inset-0 z-50 flex'>
          <div className='fixed inset-0 bg-black/40' onClick={onClose} />
          <aside className='relative z-10 flex flex-col w-64 bg-white h-full shadow-xl'>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
