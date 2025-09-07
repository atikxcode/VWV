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

  useEffect(() => {
    if (!loading && !user) {
      setShouldRedirectToLogin(true)
    }
  }, [user, loading])

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.push(`/RegistrationPage?redirect=${pathname}`)
    }
  }, [shouldRedirectToLogin, router, pathname])

  useEffect(() => {
    if (!user) {
      setFetching(false)
      return
    }

    const fetchCurrentUser = async () => {
        setFetching(true)
        try {
          console.log('🔍 Debug: Starting user fetch...')
          console.log('🔍 User object:', user)
          
          // Get the Firebase token for authentication
          const token = await user.getIdToken()
          console.log('🔍 Token obtained:', token ? 'Yes (length: ' + token.length + ')' : 'No token')
          
          if (!token) {
            throw new Error('No authentication token available')
          }

          const url = `/api/user?email=${encodeURIComponent(user.email)}`
          console.log('🔍 Fetching URL:', url)

          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          console.log('🔍 Response status:', res.status)
          console.log('🔍 Response ok:', res.ok)

          if (!res.ok) {
            const errorText = await res.text()
            console.log('🔍 Error response body:', errorText)
            throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`)
          }

          const data = await res.json()
          console.log('🔍 User data received:', data)
          
          const userRole = data.user?.role
          console.log('🔍 User role from database:', userRole)

          setIsAdmin(userRole === 'admin')

          if (userRole !== 'admin') {
            setShouldShowAccessDenied(true)
          }
        } catch (err) {
          console.error('❌ Failed to fetch user data:', err)
          console.error('❌ Error details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          })
          setError(err)
          
          // If it's an authentication error, redirect to login
          if (err.message.includes('Authentication required') || 
              err.message.includes('Invalid token') || 
              err.message.includes('Token expired')) {
            setShouldRedirectToLogin(true)
          }
        } finally {
          setFetching(false)
        }
      }

    fetchCurrentUser()
  }, [user])

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

  if (loading || fetching) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="text-center mt-8">
        <p className="text-red-600">Error: {error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!user) {
    return null 
  }

  if (!isAdmin) {
    return null
  }

  return children
}
