import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { usePWA } from "./hooks/usePWA";
import AuthLayout from "./components/auth/AuthLayout";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/resident/Dashboard";
import Announcements from "./pages/resident/Announcements";
import AllPayments from "./pages/admin/AllPayments";
import Residents from "./pages/admin/Residents";
import Settings from "./pages/admin/Settings";
import { Spinner } from "./components/ui";

const VALID_PAGES = [
  "dashboard",
  "announcements",
  "admin-payments",
  "map",
  "residents",
  "settings",
];

function getPageFromHash() {
  const hash = window.location.hash.replace("#", "").trim();
  return VALID_PAGES.includes(hash) ? hash : "dashboard";
}

// ── Install banner ────────────────────────────────────────────────────────────
function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className='fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4'>
      <div className='bg-zinc-900 border border-zinc-700 rounded-2xl p-4 flex items-center gap-3 shadow-2xl'>
        <div className='w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shrink-0'>
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
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-semibold text-white'>
            Install Stream Drive
          </p>
          <p className='text-xs text-zinc-400'>
            Add to your home screen for quick access
          </p>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <button
            onClick={onInstall}
            className='px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors'
          >
            Install
          </button>
          <button
            onClick={onDismiss}
            className='p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors'
            aria-label='Dismiss'
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
      </div>
    </div>
  );
}

// ── Offline banner ────────────────────────────────────────────────────────────
function OfflineBanner() {
  return (
    <div className='fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 text-xs font-semibold text-center py-1.5'>
      You are offline — some features may be unavailable
    </div>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className='min-h-screen bg-white flex items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <div className='w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center'>
          <svg
            className='w-6 h-6 text-white'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            viewBox='0 0 24 24'
          >
            <path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' />
            <polyline points='9 22 9 12 15 12 15 22' />
          </svg>
        </div>
        <Spinner size='md' />
        <p className='text-sm text-zinc-400'>Loading Stream Drive...</p>
      </div>
    </div>
  );
}

// ── Page renderer ─────────────────────────────────────────────────────────────
function renderPage(currentPage) {
  switch (currentPage) {
    case "dashboard":
      return <Dashboard />;
    case "announcements":
      return <Announcements />;
    case "admin-payments":
      return <AllPayments />;
    case "residents":
      return <Residents />;
    case "settings":
      return <Settings />;
    default:
      return (
        <div className='flex items-center justify-center h-full text-zinc-400 text-sm'>
          Page not found
        </div>
      );
  }
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading } = useAuth();
  const { installPrompt, isOnline, promptInstall } = usePWA();
  const [currentPage, setCurrentPage] = useState(getPageFromHash);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Sync state when browser back/forward is used
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Navigate — updates both state and URL hash
  const navigate = (page) => {
    window.location.hash = page;
    setCurrentPage(page);
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthLayout />;

  return (
    <>
      {!isOnline && <OfflineBanner />}
      <AppShell currentPage={currentPage} onNavigate={navigate}>
        {renderPage(currentPage)}
      </AppShell>
      {installPrompt && !bannerDismissed && (
        <InstallBanner
          onInstall={promptInstall}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}
    </>
  );
}
