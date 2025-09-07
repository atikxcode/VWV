'use client'

import { useState, useEffect, useContext } from 'react'
import Image from 'next/image'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { AuthContext } from '../../../../Provider/AuthProvider'
import { useRouter } from 'next/navigation'

export default function UpdateProfile() {
  const { user: authUser, logOut } = useContext(AuthContext)

  const [user, setUser] = useState({
    email: '',
    name: '',
    phone: '',
    role: '',
    profilePicture: '',
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [imagePreview, setImagePreview] = useState('')
  const router = useRouter()

  // Initialize user data from AuthContext
  useEffect(() => {
    if (authUser) {
      setUser({
        email: authUser.email || '',
        name: authUser.name || '',
        phone: authUser.phone || '',
        role: authUser.role || '',
        profilePicture: authUser.profilePicture || '',
      })
      setImagePreview(authUser.profilePicture || '')
    }
  }, [authUser])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authUser) {
      window.location.href = '/login'
    }
  }, [authUser])

  // 🔧 HELPER FUNCTION: Get authentication token
  const getAuthToken = async () => {
    let token = localStorage.getItem('auth-token')
    
    // If no stored token, try getting fresh one from Firebase user
    if (!token && authUser) {
      try {
        token = await authUser.getIdToken()
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handlePhoneChange = (phone) => {
    setUser((prev) => ({
      ...prev,
      phone: phone,
    }))
    if (errors.phone) {
      setErrors((prev) => ({
        ...prev,
        phone: '',
      }))
    }
  }

  const handleSignOut = () => {
    logOut().then().catch()
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file')
        return
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Image size should be less than 5MB')
        return
      }
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
      // Upload immediately
      uploadProfilePicture(file)
    }
  }

  // 🔧 FIXED: Upload with authentication token
  const uploadProfilePicture = async (file) => {
    try {
      setUploading(true)
      setMessage('')

      // Get authentication token
      const token = await getAuthToken()

      const formData = new FormData()
      formData.append('email', user.email)
      formData.append('file', file)
      
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`, // 🔧 FIX: Add auth token
        },
        body: formData,
      })

      const data = await response.json()
      
      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('auth-token')
        localStorage.removeItem('user-info')
        router.push('/RegistrationPage')
        return
      }

      if (response.ok) {
        setUser((prev) => ({
          ...prev,
          profilePicture: data.imageUrl,
        }))
        setMessage('Profile picture updated successfully!')
      } else {
        setMessage(data.error || 'Failed to upload image')
        setImagePreview(user.profilePicture || '') // Reset preview
      }
    } catch (error) {
      console.error('Upload error:', error)
      if (error.message.includes('authentication')) {
        setMessage('Authentication failed. Please login again.')
        router.push('/RegistrationPage')
      } else {
        setMessage('Error uploading image')
        setImagePreview(user.profilePicture || '')
      }
    } finally {
      setUploading(false)
    }
  }

  // 🔧 FIXED: Delete with authentication token
  const deleteProfilePicture = async () => {
    try {
      setUploading(true)
      setMessage('')

      // Get authentication token
      const token = await getAuthToken()

      const response = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`, // 🔧 FIX: Add auth token
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('auth-token')
        localStorage.removeItem('user-info')
        router.push('/RegistrationPage')
        return
      }

      if (response.ok) {
        setUser((prev) => ({
          ...prev,
          profilePicture: '',
        }))
        setImagePreview('')
        setMessage('Profile picture deleted successfully!')
      } else {
        setMessage(data.error || 'Failed to delete image')
      }
    } catch (error) {
      console.error('Delete error:', error)
      if (error.message.includes('authentication')) {
        setMessage('Authentication failed. Please login again.')
        router.push('/RegistrationPage')
      } else {
        setMessage('Error deleting image')
      }
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!user.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!user.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!user.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (user.phone.length < 10) {
      newErrors.phone = 'Phone number is too short'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 🔧 FIXED: Submit with authentication token
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setLoading(true)
      setMessage('')

      // Get authentication token
      const token = await getAuthToken()

      // Clean and process phone number
      let processedPhone = user.phone.replace(/\D/g, '') // Remove all non-digits

      // Remove country code prefix for Bangladesh (+880) if present
      if (processedPhone.startsWith('880')) {
        processedPhone = processedPhone.substring(3)
      }

      // Ensure it's in proper 11-digit Bangladeshi format
      if (processedPhone.length === 10 && !processedPhone.startsWith('0')) {
        processedPhone = '0' + processedPhone
      }

      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // 🔧 FIX: Add auth token
        },
        body: JSON.stringify({
          action: 'update',
          email: user.email,
          name: user.name,
          phone: processedPhone, // Send cleaned 11-digit format
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('auth-token')
        localStorage.removeItem('user-info')
        router.push('/RegistrationPage')
        return
      }

      if (response.ok) {
        setMessage('Profile updated successfully!')
        
        // Update local user state with response data if available
        if (data.user) {
          setUser((prev) => ({
            ...prev,
            name: data.user.name,
            phone: data.user.phone,
          }))
        }
      } else {
        setMessage(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Update error:', error)
      if (error.message.includes('authentication')) {
        setMessage('Authentication failed. Please login again.')
        router.push('/RegistrationPage')
      } else {
        setMessage('Error updating profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    if (authUser) {
      setUser({
        email: authUser.email || '',
        name: authUser.name || '',
        phone: authUser.phone || '',
        role: authUser.role || '',
        profilePicture: authUser.profilePicture || '',
      })
      setImagePreview(authUser.profilePicture || '')
      setMessage('')
      setErrors({})
    }
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Update Profile
                </h1>
                <p className="text-blue-100 mt-1">
                  Manage your account information
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-white bg-opacity-20 text-purple-500 px-4 py-2 rounded-md hover:bg-opacity-30 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Message Alert */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-md ${
                  message.toLowerCase().includes('success')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">
                        <svg
                          className="w-16 h-16"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={deleteProfilePicture}
                      disabled={uploading}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Phone Field with React Phone Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <PhoneInput
                    country={'bd'}
                    value={user.phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter phone number"
                    containerClass="phone-input-container"
                    inputClass={`w-full ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    buttonClass="country-selector"
                    dropdownClass="country-dropdown"
                    searchClass="country-search"
                    enableSearch={true}
                    disableSearchIcon={false}
                    countryCodeEditable={false}
                    specialLabel=""
                    inputProps={{
                      name: 'phone',
                      required: true,
                      autoFocus: false,
                    }}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={user.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                    readOnly
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Role Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none"
                    readOnly
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Role is managed by administrators
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom CSS for Phone Input Styling */}
      <style jsx global>{`
        .phone-input-container .react-tel-input {
          font-family: inherit;
        }

        .phone-input-container .react-tel-input .form-control {
          width: 100%;
          height: 42px;
          padding: 8px 12px 8px 58px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          background-color: #fff;
          transition: border-color 0.15s ease-in-out,
            box-shadow 0.15s ease-in-out;
        }

        .phone-input-container .react-tel-input .form-control:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }

        .phone-input-container .react-tel-input .flag-dropdown {
          border: 1px solid #d1d5db;
          border-radius: 6px 0 0 6px;
          background-color: #fff;
        }

        .phone-input-container .react-tel-input .flag-dropdown:hover {
          background-color: #f9fafb;
        }

        .phone-input-container .react-tel-input .flag-dropdown.open {
          background-color: #f9fafb;
        }

        .phone-input-container .react-tel-input .country-list {
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #d1d5db;
          max-height: 200px;
        }

        .phone-input-container .react-tel-input .country-list .country:hover {
          background-color: #f3f4f6;
        }

        .phone-input-container
          .react-tel-input
          .country-list
          .country.highlight {
          background-color: #dbeafe;
        }
      `}</style>
    </div>
  )
}
