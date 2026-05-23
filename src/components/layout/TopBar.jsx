import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function TopBar({ currentPage, onMenuClick }) {
  const { logout } = useAuth();
  const { dark, toggleTheme } = useTheme();

  const titles = {
    dashboard: "Dashboard",
    announcements: "Announcements",
    "admin-payments": "All Payments",
    map: "Estate Map",
    residents: "Residents",
    settings: "Settings",
  };

  return (
    <header className='h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 lg:px-6 shrink-0'>
      <div className='flex items-center gap-3'>
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className='lg:hidden p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors'
          aria-label='Open menu'
        >
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <line x1='3' y1='6' x2='21' y2='6' />
            <line x1='3' y1='12' x2='21' y2='12' />
            <line x1='3' y1='18' x2='21' y2='18' />
          </svg>
        </button>
        <h1 className='font-display font-bold text-zinc-900 text-base'>
          {titles[currentPage] || "Stream Drive"}
        </h1>
      </div>

      <div className='flex items-center gap-2'>
        {/* Notification bell */}
        <button className='p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors relative'>
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9' />
            <path d='M13.73 21a2 2 0 01-3.46 0' />
          </svg>
          <span className='absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full' />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className='p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors'
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? (
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='5' />
              <line x1='12' y1='1' x2='12' y2='3' />
              <line x1='12' y1='21' x2='12' y2='23' />
              <line x1='4.22' y1='4.22' x2='5.64' y2='5.64' />
              <line x1='18.36' y1='18.36' x2='19.78' y2='19.78' />
              <line x1='1' y1='12' x2='3' y2='12' />
              <line x1='21' y1='12' x2='23' y2='12' />
              <line x1='4.22' y1='19.78' x2='5.64' y2='18.36' />
              <line x1='18.36' y1='5.64' x2='19.78' y2='4.22' />
            </svg>
          ) : (
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path d='M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' />
            </svg>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={logout}
          className='flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4' />
            <polyline points='16 17 21 12 16 7' />
            <line x1='21' y1='12' x2='9' y2='12' />
          </svg>
          Sign out
        </button>
      </div>
    </header>
  );
}
