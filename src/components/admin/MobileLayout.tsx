'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AdminSidebar } from './sidebar'

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-stone-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transition-transform duration-200 md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="flex h-12 items-center gap-3 border-b border-stone-700 bg-stone-900 px-4 md:hidden">
          <button
            data-testid="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            className="text-stone-400 hover:text-stone-50 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-stone-50">Admin Panel</span>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto text-stone-400 hover:text-stone-50"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
