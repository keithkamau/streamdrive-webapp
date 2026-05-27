// components/layout/AppShell.jsx
import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ currentPage, onNavigate, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className='flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-200'>
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className='flex flex-col flex-1 min-w-0 overflow-hidden'>
        <TopBar
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className='flex-1 overflow-y-auto p-4 lg:p-6'>{children}</main>
      </div>
    </div>
  );
}
