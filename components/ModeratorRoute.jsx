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
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false)
  const [shouldShowAccessDenied, setShouldShowAccessDenied] = useState(false)

  // 🔧 HELPER FUNCTION: Get authentication token
  const getAuthToken = async () => {
    let token = localStorage.getItem('auth-token')
    
    // If no stored token, try getting fresh one from Firebase user
    if (!token && user) {
      try {
        token = await user.getIdToken()
        localStorage.setItem('auth-token', token)
      } catch (error) {
        console.error('Error getting token:', error)
        throw new Error('Failed to get authentication token')
      }
    }

    if (!token) {
      throw new Error('No authentication token available')
    }

    return token
  }

  // Handle login redirect in useEffect
  useEffect(() => {
    if (!loading && !user) {
      setShouldRedirectToLogin(true)
    }
  }, [user, loading])

  // Redirect to login in useEffect
  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.push(`/RegistrationPage?redirect=${pathname}`)
    }
  }, [shouldRedirectToLogin, router, pathname])

  // 🔧 FIXED: Fetch user role with authentication token - MODERATOR ONLY
  useEffect(() => {
    if (!user) {
      setFetching(false)
      return
    }

    const fetchCurrentUser = async () => {
      setFetching(true)
      try {
        console.log('🔍 Fetching user role for moderator-only check...')
        
        // Get authentication token
        const token = await getAuthToken()
        
        const res = await fetch(
          `/api/user?email=${encodeURIComponent(user.email)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`, // 🔧 FIX: Add auth token
              'Content-Type': 'application/json',
            },
          }
        )

        console.log('🔍 API Response status:', res.status)

        if (res.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('auth-token')
          localStorage.removeItem('user-info')
          setShouldRedirectToLogin(true)
          return
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch user data: ${res.status} ${res.statusText}`)
        }

        const data = await res.json()
        console.log('🔍 User data:', data)

        // 🔧 STRICT CHECK: ONLY "moderator" role is allowed (NOT admin)
        const userRole = data.user?.role
        const isModeratorOnly = userRole === 'moderator'
        
        setIsModerator(isModeratorOnly)

        // Set access denied if user is not specifically a moderator
        if (!isModeratorOnly) {
          console.log('❌ Access denied. User role:', userRole, '(Only moderator role allowed)')
          setShouldShowAccessDenied(true)
        } else {
          console.log('✅ Moderator access granted. User role:', userRole)
        }

      } catch (err) {
        console.error('❌ Error fetching user:', err)
        
        if (err.message.includes('authentication') || err.message.includes('token')) {
          // Authentication error, redirect to login
          setShouldRedirectToLogin(true)
        } else {
          setError(err)
        }
      } finally {
        setFetching(false)
      }
    }

    fetchCurrentUser()
  }, [user])

  // Handle access denied in separate useEffect
  useEffect(() => {
    if (shouldShowAccessDenied) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'This area is restricted to moderators only. Admins and other roles cannot access moderator routes.',
        confirmButtonColor: '#6b21a8', // purple
        confirmButtonText: 'Go to Home'
      }).then(() => {
        router.push('/') // redirect to home
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Page</h2>
          <p className="text-red-600 mb-4">Error: {error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Early return without router.push call
  if (!user) {
    return null // Let useEffect handle redirect
  }

  // Don't render if not moderator (let useEffect handle alert)
  if (!isModerator) {
    return null
  }

  // Success! User is authenticated and has MODERATOR role only
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
