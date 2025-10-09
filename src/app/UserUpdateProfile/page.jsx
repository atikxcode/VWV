'use client'

import { useState, useEffect, useContext } from 'react'
import Image from 'next/image'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { AuthContext } from '../../../Provider/AuthProvider'
import { useRouter } from 'next/navigation'
import { Camera, User as UserIcon, Mail, Phone, LogOut, Save, RotateCcw, Trash2, Upload } from 'lucide-react'

export default function UserUpdateProfile() {
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
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
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
      window.location.href = '/RegistrationPage'
    }
  }, [authUser])

  // Helper: Get authentication token
  const getAuthToken = async () => {
    let token = localStorage.getItem('auth-token')
    
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

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
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
        showMessage('Please select a valid image file', 'error')
        return
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('Image size should be less than 5MB', 'error')
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

  const uploadProfilePicture = async (file) => {
    try {
      setUploading(true)
      setMessage('')

      const token = await getAuthToken()

      const formData = new FormData()
      formData.append('email', user.email)
      formData.append('file', file)
      
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      
      if (response.status === 401) {
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
        showMessage('Profile picture updated successfully!', 'success')
      } else {
        showMessage(data.error || 'Failed to upload image', 'error')
        setImagePreview(user.profilePicture || '')
      }
    } catch (error) {
      console.error('Upload error:', error)
      if (error.message.includes('authentication')) {
        showMessage('Authentication failed. Please login again.', 'error')
        router.push('/RegistrationPage')
      } else {
        showMessage('Error uploading image', 'error')
        setImagePreview(user.profilePicture || '')
      }
    } finally {
      setUploading(false)
    }
  }

  const deleteProfilePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return
    }

    try {
      setUploading(true)
      setMessage('')

      const token = await getAuthToken()

      const response = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.status === 401) {
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
        showMessage('Profile picture removed successfully!', 'success')
      } else {
        showMessage(data.error || 'Failed to delete image', 'error')
      }
    } catch (error) {
      console.error('Delete error:', error)
      if (error.message.includes('authentication')) {
        showMessage('Authentication failed. Please login again.', 'error')
        router.push('/RegistrationPage')
      } else {
        showMessage('Error deleting image', 'error')
      }
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!user.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (user.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setLoading(true)
      setMessage('')

      const token = await getAuthToken()

      // Clean phone number
      let processedPhone = user.phone.replace(/\D/g, '')

      if (processedPhone.startsWith('880')) {
        processedPhone = processedPhone.substring(3)
      }

      if (processedPhone.length === 10 && !processedPhone.startsWith('0')) {
        processedPhone = '0' + processedPhone
      }

      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update',
          email: user.email,
          name: user.name,
          phone: processedPhone,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('user-info')
        router.push('/RegistrationPage')
        return
      }

      if (response.ok) {
        showMessage('Profile updated successfully!', 'success')
        
        if (data.user) {
          setUser((prev) => ({
            ...prev,
            name: data.user.name,
            phone: data.user.phone,
          }))
        }
      } else {
        showMessage(data.error || 'Failed to update profile', 'error')
      }
    } catch (error) {
      console.error('Update error:', error)
      if (error.message.includes('authentication')) {
        showMessage('Authentication failed. Please login again.', 'error')
        router.push('/RegistrationPage')
      } else {
        showMessage('Error updating profile', 'error')
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-8 py-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">
                  My Profile
                </h1>
                <p className="text-purple-100">
                  Update your personal information
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex text-purple-500 items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm  px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-start gap-3 animate-slideDown ${
              messageType === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {messageType === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="flex-1 font-medium">{message}</p>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Profile Picture Section */}
            <div className="bg-gradient-to-b from-gray-50 to-white px-8 py-10 border-b border-gray-100">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center ring-4 ring-purple-50 shadow-lg">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Profile"
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-20 h-20 text-purple-300" />
                    )}
                  </div>
                  
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                    </div>
                  )}

                  {/* Camera Icon Overlay */}
                  <label className="absolute bottom-2 right-2 bg-purple-600 text-white p-3 rounded-full cursor-pointer hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110">
                    <Camera size={20} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <label className="flex items-center gap-2 cursor-pointer bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    <Upload size={18} />
                    <span className="font-medium">Upload New Photo</span>
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
                      className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl hover:bg-red-100 transition-all duration-200 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={18} />
                      <span className="font-medium">Remove Photo</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Max file size: 5MB • Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="px-8 py-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <UserIcon size={18} className="text-purple-600" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-200 ${
                      errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <span>⚠</span> {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Phone size={18} className="text-purple-600" />
                    Phone Number *
                  </label>
                  <PhoneInput
                    country={'bd'}
                    value={user.phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter phone number"
                    containerClass="phone-input-container"
                    inputClass={`w-full ${
                      errors.phone ? 'border-red-300' : 'border-gray-200'
                    }`}
                    enableSearch={true}
                    countryCodeEditable={false}
                    specialLabel=""
                    inputProps={{
                      name: 'phone',
                      required: true,
                    }}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <span>⚠</span> {errors.phone}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Mail size={18} className="text-purple-600" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={user.email}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600"
                    readOnly
                  />
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    🔒 Email cannot be changed for security reasons
                  </p>
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <UserIcon size={18} className="text-purple-600" />
                    Account Type
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 capitalize">
                      {user.role || 'User'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    👤 Role is managed by administrators
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
                >
                  <RotateCcw size={18} />
                  Reset Changes
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Custom CSS for Phone Input */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .phone-input-container .react-tel-input .form-control {
          width: 100%;
          height: 50px;
          padding: 12px 12px 12px 58px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          font-size: 15px;
          background-color: #fff;
          transition: all 0.2s ease;
        }

        .phone-input-container .react-tel-input .form-control:focus {
          outline: none;
          border-color: #9333ea;
          box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.1);
        }

        .phone-input-container .react-tel-input .flag-dropdown {
          border: 2px solid #e5e7eb;
          border-radius: 12px 0 0 12px;
          background-color: #fff;
          transition: all 0.2s ease;
        }

        .phone-input-container .react-tel-input .flag-dropdown:hover {
          background-color: #f9fafb;
        }

        .phone-input-container .react-tel-input .country-list {
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 2px solid #e5e7eb;
          max-height: 250px;
        }

        .phone-input-container .react-tel-input .country-list .country:hover {
          background-color: #f3f4f6;
        }

        .phone-input-container .react-tel-input .country-list .country.highlight {
          background-color: #f3e8ff;
        }
      `}</style>
    </div>
  )
}
