'use client'

import { useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContext } from '../Provider/AuthProvider'
import { motion } from 'framer-motion'

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  const router = useRouter()
  const pathname = usePathname()

  // Show loading animation while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-100">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="relative w-24 h-24"
        >
          {/* Vape cloud circles */}
          <motion.div
            className="absolute w-8 h-8 bg-purple-500 rounded-full opacity-60"
            animate={{ scale: [0.8, 1.2, 0.8], y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
          />
          <motion.div
            className="absolute w-6 h-6 bg-purple-400 rounded-full opacity-50"
            animate={{ scale: [0.7, 1.3, 0.7], y: [0, -25, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, delay: 0.3 }}
          />
          <motion.div
            className="absolute w-4 h-4 bg-purple-300 rounded-full opacity-40"
            animate={{ scale: [0.6, 1.4, 0.6], y: [0, -30, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, delay: 0.6 }}
          />
        </motion.div>
      </div>
    )
  }

  // Redirect if user is not logged in
  if (!user) {
    router.push(`/RegistrationPage?redirect=${pathname}`)
    return null
  }

  return children
}
