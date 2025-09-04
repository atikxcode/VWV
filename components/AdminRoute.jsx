'use client'

import { useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContext } from '../Provider/AuthProvider'
import { motion } from 'framer-motion'
import Swal from 'sweetalert2'
import Loading from './Loading'

export default function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  const router = useRouter()
  const pathname = usePathname()

  const [isAdmin, setIsAdmin] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(null)
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false)
  const [shouldShowAccessDenied, setShouldShowAccessDenied] = useState(false)

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

  // Fetch user role
  useEffect(() => {
    if (!user) {
      setFetching(false)
      return
    }

    const fetchCurrentUser = async () => {
      setFetching(true)
      try {
        const res = await fetch(
          `/api/user?email=${encodeURIComponent(user.email)}`
        )
        if (!res.ok) throw new Error('Failed to fetch user data')
        const data = await res.json()
        setIsAdmin(data.user?.role === 'admin')

        // 🔥 FIX 3: Set state instead of direct alert
        if (data.user?.role !== 'admin') {
          setShouldShowAccessDenied(true)
        }
      } catch (err) {
        setError(err)
      } finally {
        setFetching(false)
      }
    }

    fetchCurrentUser()
  }, [user])

  // 🔥 FIX 4: Handle access denied in separate useEffect
  useEffect(() => {
    if (shouldShowAccessDenied) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You do not have permission to access admin routes.',
        confirmButtonColor: '#6b21a8',
      }).then(() => {
        router.push('/')
      })
    }
  }, [shouldShowAccessDenied, router])

  // Show loader
  if (loading || fetching) {
    return <Loading />
  }

  // Show error
  if (error) {
    return (
      <p className="text-red-600 text-center mt-8">Error: {error.message}</p>
    )
  }

  // 🔥 FIX 5: Early return without router.push call
  if (!user) {
    return null // Let useEffect handle redirect
  }

  // Don't render if not admin (let useEffect handle alert)
  if (!isAdmin) {
    return null
  }

  return children
}
