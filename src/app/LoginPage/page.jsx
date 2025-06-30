'use client';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF, FaApple } from 'react-icons/fa';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const [step, setStep] = useState('email');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = (data) => {
    setEmailOrUsername(data.email);
    setValue('email', data.email); // Set for final submit
    setStep('password');
  };

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      console.log('Login successful:', result);
      // router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err.message);
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-2">Sign in to your account</h2>
        <p className="text-sm text-center mb-6">
          New to eBay?{' '}
          <a href="/RegistrationPage" className="text-blue-600 hover:underline">Create account</a>
        </p>

        <form onSubmit={handleSubmit(step === 'email' ? handleEmailSubmit : onSubmit)} className="space-y-4">
          {step === 'email' ? (
            <>
              <input
                type="text"
                placeholder="Email or username"
                {...register('email', { required: 'Email or username is required' })}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </>
          ) : (
            <>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition"
          >
            Continue
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-sm text-gray-500">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Social login buttons */}
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center border border-gray-300 rounded-full py-2 hover:bg-gray-50 transition">
            <FcGoogle className="text-xl mr-2" />
            Continue with Google
          </button>
          <button className="w-full flex items-center justify-center border border-gray-300 rounded-full py-2 hover:bg-gray-50 transition">
            <FaFacebookF className="text-blue-600 text-lg mr-2" />
            Continue with Facebook
          </button>
          <button className="w-full flex items-center justify-center border border-gray-300 rounded-full py-2 hover:bg-gray-50 transition">
            <FaApple className="text-black text-lg mr-2" />
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
}
