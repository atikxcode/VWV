'use client'

import { Josefin_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AgeVerification from '../../components/AgeVerification'
import Providers from '../../components/Provider'
import { usePathname } from 'next/navigation'

const josefinSans = Josefin_Sans({
  variable: '--font-primary',
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  const pathname = usePathname()

  // Define all dashboard routes that should exclude UI components
  const dashboardRoutes = ['/admin', '/moderator']
  const isDashboardRoute = dashboardRoutes.some((route) =>
    pathname.startsWith(route)
  )

  return (
    <html lang="en">
      <body className={`${josefinSans.variable} antialiased bg-purple-50`}>
        <Providers>
          {!isDashboardRoute && <AgeVerification />}
          {!isDashboardRoute && <Navbar />}
          {children}
          {!isDashboardRoute && <Footer />}
        </Providers>
      </body>
    </html>
  )
}
