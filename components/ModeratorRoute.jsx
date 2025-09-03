'use client'

import { useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContext } from '../Provider/AuthProvider'
import { motion } from 'framer-motion'
import Swal from 'sweetalert2'
import Loading from './Loading'

export default function ModeratorRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  const router = useRouter()
  const pathname = usePathname()

  const [isModerator, setIsModerator] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(null)
  const [showAlert, setShowAlert] = useState(false)

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

        // 🔧 Only allow 'moderator' role (not admin)
        setIsModerator(data.user?.role === 'moderator')

        if (data.user?.role !== 'moderator') setShowAlert(true)
      } catch (err) {
        setError(err)
      } finally {
        setFetching(false)
      }
    }

    fetchCurrentUser()
  }, [user])

  // Show SweetAlert2 if user is logged in but not moderator
  useEffect(() => {
    if (showAlert) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You do not have permission to access moderator routes.',
        confirmButtonColor: '#6b21a8', // purple
      }).then(() => {
        router.push('/') // redirect to home or dashboard
      })
    }
  }, [showAlert, router])

  // Vape-themed loader
  if (loading || fetching) {
    return <Loading />
  }

  // Error handling
  if (error) {
    return (
      <p className="text-red-600 text-center mt-8">Error: {error.message}</p>
    )
  }

  // Redirect if not logged in
  if (!user) {
    router.push(`/RegistrationPage?redirect=${pathname}`)
    return null
  }

  // If user is logged in but moderator check is handled by SweetAlert
  if (!isModerator) return null

  return children
}

// Moderator Routing checks if user has moderator role specifically
