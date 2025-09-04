'use client'

import { useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContext } from '../Provider/AuthProvider'
import { motion } from 'framer-motion'
import Loading from './Loading'

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  const router = useRouter()
  const pathname = usePathname()

  // 🔥 NEW: State to control redirect
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false)

  // 🔥 FIX 1: Handle login redirect in useEffect
  useEffect(() => {
    if (!loading && !user) {
      setShouldRedirectToLogin(true)
    }
  }, [user, loading])

  // 🔥 FIX 2: Redirect to login in useEffect
  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.push(`/RegistrationPage?redirect=${pathname}`)
    }
  }, [shouldRedirectToLogin, router, pathname])

  // Show loading animation while checking auth
  if (loading) {
    return <Loading />
  }

  // 🔥 FIX 3: Early return without router.push call
  if (!user) {
    return null // Let useEffect handle redirect
  }

  return children
}
