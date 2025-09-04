'use client'
import { useState } from 'react'
import ModeratorSidebar from '../../../components/ModeratorSidebar'
import ModeratorHeader from '../../../components/ModeratorHeader'
import PrivateRoute from '../../../components/PrivateRoutes'
import ModeratorRoute from '../../../components/ModeratorRoute'

export default function ModeratorLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <ModeratorRoute>
      <PrivateRoute>
        <div className="flex h-screen">
          {/* Sidebar */}
          {sidebarOpen && <ModeratorSidebar />}

          {/* Main content */}
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ${
              sidebarOpen ? 'ml-24' : 'ml-0' // <-- add left margin equal to sidebar width
            }`}
          >
            <ModeratorHeader toggleSidebar={toggleSidebar} />
            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          </div>
        </div>
      </PrivateRoute>
    </ModeratorRoute>
  )
}
