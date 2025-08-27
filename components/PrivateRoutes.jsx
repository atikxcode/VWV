'use client'

import { useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContext } from '../Provider/AuthProvider'
import { motion } from 'framer-motion'
import Loading from './Loading'

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  const router = useRouter()
  const pathname = usePathname()

  // Show loading animation while checking auth
  if (loading) {
    return <Loading />
  }

  // Redirect if user is not logged in
  if (!user) {
    router.push(`/RegistrationPage?redirect=${pathname}`)
    return null
  }

  return children
}
