'use client'

import { Controller, useForm } from 'react-hook-form'
import { useContext, useEffect, useState } from 'react'
import { HiEye, HiEyeOff } from 'react-icons/hi'
import Image from 'next/image'
import { AuthContext } from '../../../Provider/AuthProvider'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import Swal from 'sweetalert2'
import 'react-phone-input-2/lib/style.css'
import PhoneInput from 'react-phone-input-2'

export default function RegistrationPage() {
  const {
    handleGoogleSignIn,
    user,
    handleAppleSignIn,
    createUser,
    updateUser,
    logOut,
    signIn,
    verifyEmail,
    passwordReset,
  } = useContext(AuthContext)
  const router = useRouter()

  // Function to get Firebase token and store it
  const storeFirebaseToken = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken()
      localStorage.setItem('auth-token', token)
      
      return token
    } catch (error) {
      console.error('Error getting Firebase token:', error)
      throw error
    }
  }

  // Save or update user in your backend database
  const saveUserToBackend = async (userInfo, isUpdate = false) => {
    try {
      const token = localStorage.getItem('auth-token')
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Only add auth header if we have a token AND it's an update
      // For creation during login/signup, don't require auth token
      if (token && isUpdate) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/user', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...userInfo,
          action: isUpdate ? 'update' : 'create'
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user')
      }
      
      // Store complete user info in localStorage
      localStorage.setItem('user-info', JSON.stringify(data.user))
      
      return data.user
    } catch (error) {
      console.error('Error saving user to backend:', error)
      throw error
    }
  }

  // Google login function
  const handleGoogleLoginAndRedirect = async () => {
    try {
      const result = await handleGoogleSignIn()
      if (result.user) {
        console.log('Google Sign-In User:', {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        })

        // Store Firebase token first
        await storeFirebaseToken(result.user)

        // Save/update user in your database
        const dbUser = await saveUserToBackend({
          email: result.user.email,
          name: result.user.displayName || result.user.email || 'Google User',
          profilePicture: result.user.photoURL || '',
          firebaseUid: result.user.uid
        })

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Welcome ${dbUser.name}!`,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })

        router.push('/')
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Google Sign-In failed. Please try again.',
        showConfirmButton: false,
        timer: 3000,
      })
    }
  }

  // Apple login function
  const handleAppleLoginAndRedirect = async () => {
    try {
      const result = await handleAppleSignIn()
      const loggedInUser = result.user

      // Store Firebase token first
      await storeFirebaseToken(loggedInUser)

      // Save/update user in your database
      const dbUser = await saveUserToBackend({
        email: loggedInUser.email,
        name: loggedInUser.displayName || loggedInUser.email || 'Apple User',
        profilePicture: loggedInUser.photoURL || '',
        firebaseUid: loggedInUser.uid
      })

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Welcome ${dbUser.name}!`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })

      router.push('/')
    } catch (error) {
      console.error('Apple Sign-In Error:', error)
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Apple Sign-In failed. Please try again.',
        showConfirmButton: false,
        timer: 3000,
      })
    }
  }

  const [accountType, setAccountType] = useState('Login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm({ mode: 'onChange' })

  const watchedEmail = watch('email')
  const isSignup = accountType === 'Signup'

  useEffect(() => {
    setCurrentEmail(watchedEmail)
  }, [watchedEmail])

  // Form Submit For Login/Signup
  const onSubmit = async (data) => {
    setIsLoading(true)

    if (!isSignup) {
      // LOGIN FLOW
      try {
        const result = await signIn(data.email, data.password)

        if (!result.user.emailVerified) {
          await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: 'Please verify your email before logging in!',
            showConfirmButton: true,
          })
          setIsLoading(false)
          return
        }

        // Store Firebase token
        await storeFirebaseToken(result.user)

        // Get user data from database (which includes the role)
        const dbUser = await saveUserToBackend({
          email: result.user.email,
          name: result.user.displayName || result.user.email || 'User',
          firebaseUid: result.user.uid
        })

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Welcome back, ${dbUser.name}!`,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })

        router.push('/')
      } catch (error) {
        console.error(error)

        let message = 'Login failed'
        if (
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/invalid-email'
        ) {
          message = 'Wrong email or password'
        } else if (error.code === 'auth/too-many-requests') {
          message = 'Too many failed attempts. Please try again later.'
        } else if (error.message && error.message.includes('User not found in database')) {
          message = 'Account not found. Please sign up first.'
        }

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: message,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })
      }
    } else {
      // SIGNUP FLOW
      const userDetails = {
        email: data.email,
        name: data.fullName,
        phone: phoneNumber,
        role: 'user', // Default role for new signups
      }

      try {
        // Create Firebase user
        const result = await createUser(userDetails.email, data.password)
        await updateUser(result.user, userDetails.name)
        
        // Create user in database (without token since email isn't verified yet)
        await saveUserToBackend({
          ...userDetails,
          firebaseUid: result.user.uid
        })

        // Send verification email
        await verifyEmail()

        await Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Check your email to verify your account before logging in!',
          showConfirmButton: true,
        })

        // Reset form and switch to login
        reset()
        setPhoneNumber('')
        setAccountType('Login')
        await logOut()
      } catch (error) {
        console.error(error)
        
        let message = 'Registration failed'
        if (error.code === 'auth/email-already-in-use') {
          message = 'An account with this email already exists'
        } else if (error.code === 'auth/weak-password') {
          message = 'Password is too weak'
        } else if (error.code === 'auth/invalid-email') {
          message = 'Invalid email address'
        } else if (error.message && error.message.includes('User already exists')) {
          message = 'An account with this email already exists'
        }
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: message,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })
      }
    }

    setIsLoading(false)
  }

  // Password Reset
  const handlePasswordReset = () => {
    if (!currentEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'Please enter your email address first.',
      })
      return
    }

    passwordReset(currentEmail)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Password reset email sent! Please check your email.',
        })
      })
      .catch((error) => {
        console.error(error)
        let message = 'Something went wrong.'
        if (error.code === 'auth/user-not-found') {
          message = 'No account found with this email address.'
        } else if (error.code === 'auth/invalid-email') {
          message = 'Invalid email address.'
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: message,
        })
      })
  }

  const imagePath = isSignup
    ? '/SignIn_SignUp_Logo/Reg_1.jpg'
    : '/SignIn_SignUp_Logo/Reg_2.jpg'

  return (
    <div className="min-h-screen flex items-center justify-between">
      <div className="flex w-full h-screen lg:px-[30px] xl:px-[60px]">
        {/* Left: Dynamic Image */}
        <div className="xl:w-2/5 lg:p-6 xl:p-8 relative hidden lg:block">
          <img
            className="rounded-lg md:h-[80%] lg:h-[90%] xl:h-auto"
            src={imagePath}
            alt=""
          />
        </div>

        {/* Right: Form */}
        <div className="w-full md:w-3/5 p-8 flex items-center justify-center mx-auto">
          <div className="w-full max-w-md h-[80%] space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-4">
              {isSignup ? 'Create an account' : 'Welcome back'}
            </h2>

            {/* Tabs */}
            <div className="flex mb-4 border-[1px] p-1 border-gray-300 rounded-full overflow-hidden">
              {['Login', 'Signup'].map((type) => (
                <button
                  key={type}
                  onClick={() => setAccountType(type)}
                  disabled={isLoading}
                  className={`w-1/2 py-2 text-sm font-medium transition rounded-2xl ${
                    accountType === type
                      ? 'bg-purple-400 text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Signup Description */}
            {isSignup && (
              <p className="text-sm text-gray-700 mb-2">
                Continue to register as a <strong>new user</strong> to start
                your journey.
              </p>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {isSignup ? (
                <>
                  {/* Full Name */}
                  <div>
                    <input
                      type="text"
                      placeholder="Full Name"
                      {...register('fullName', {
                        required: 'Full Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters'
                        }
                      })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Number Field */}
                  <div>
                    <Controller
                      name="phone"
                      control={control}
                      rules={{ required: 'Phone number is required' }}
                      render={({ field }) => (
                        <PhoneInput
                          {...field}
                          country={'bd'}
                          enableSearch={true}
                          placeholder="Enter phone number"
                          inputClass="!w-full !border !border-gray-300 !rounded-md !pl-12 !py-2 !bg-white"
                          buttonClass="!border !border-gray-300 !rounded-l-md !bg-gray-100"
                          dropdownClass="!bg-white !border !border-gray-300"
                          onChange={(value) => {
                            field.onChange(value)
                            setPhoneNumber(value)
                          }}
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="relative mt-3">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/,
                          message:
                            'Password must have an uppercase letter, a lowercase letter, and be at least 6 characters long',
                        },
                      })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10"
                    />
                    <span
                      className="absolute top-2.5 right-3 text-gray-500 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <HiEyeOff size={20} />
                      ) : (
                        <HiEye size={20} />
                      )}
                    </span>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="relative mt-3">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === watch('password') ||
                          'Passwords do not match',
                      })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10"
                    />
                    <span
                      className="absolute top-2.5 right-3 text-gray-500 cursor-pointer"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <HiEyeOff size={20} />
                      ) : (
                        <HiEye size={20} />
                      )}
                    </span>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      {...register('password', {
                        required: 'Password is required',
                      })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10"
                    />
                    <span
                      className="absolute top-2.5 right-3 text-gray-500 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <HiEyeOff size={20} />
                      ) : (
                        <HiEye size={20} />
                      )}
                    </span>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Forgot Password Area */}
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              )}

              {/* Legal text */}
              {isSignup && (
                <p className="text-xs text-gray-600">
                  By selecting <strong>Create account</strong>, you agree to our{' '}
                  <a href="#" className="text-blue-600 underline">
                    User Agreement
                  </a>{' '}
                  and acknowledge reading our{' '}
                  <a href="#" className="text-blue-600 underline">
                    User Privacy Notice
                  </a>
                  .
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className={`w-full py-2 rounded-full font-semibold transition flex items-center justify-center ${
                  isValid && !isLoading
                    ? 'bg-black text-white hover:bg-gray-900'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isSignup ? 'Creating...' : 'Logging in...'}
                  </div>
                ) : (
                  (isSignup ? 'Create account' : 'Login')
                )}
              </button>
            </form>

            {/* Switch Links */}
            <p className="text-center text-sm text-gray-600">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAccountType('Login')}
                    disabled={isLoading}
                    className="text-blue-600 underline disabled:opacity-50"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAccountType('Signup')}
                    disabled={isLoading}
                    className="text-blue-600 underline disabled:opacity-50"
                  >
                    Signup
                  </button>
                </>
              )}
            </p>

            {/* Social Login (only for Login tab) */}
            {accountType === 'Login' && (
              <>
                <div className="text-center text-gray-500">
                  or continue with
                </div>
                <div className="flex justify-center space-x-4">
                  {/* Google */}
                  <button
                    onClick={handleGoogleLoginAndRedirect}
                    disabled={isLoading}
                    className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Image
                      src="/SocialMediaLogo/Google.png"
                      alt="Google"
                      width={30}
                      height={30}
                    />
                  </button>

                  {/* Apple */}
                  <button
                    onClick={handleAppleLoginAndRedirect}
                    disabled={isLoading}
                    className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Image
                      src="/SocialMediaLogo/Apple.png"
                      alt="Apple"
                      width={23}
                      height={23}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
