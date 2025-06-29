'use client';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF, FaApple } from 'react-icons/fa';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [staySignedIn, setStaySignedIn] = useState(true);

 const onSubmit = async (data) => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    // Success logic: e.g., store token, redirect
    console.log('Login successful:', result);
    // For example, redirect:
    // router.push('/dashboard');
  } catch (err) {
    console.error('Login error:', err.message);
    alert(err.message); // or use state to show error in UI
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email input */}
          <input
            type="email"
            placeholder="Email or username"
            {...register('email', { required: 'Email is required' })}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}

          {/* Submit Button */}
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

        {/* Stay signed in */}
        <div className="flex items-center mt-6 text-sm">
          <input
            id="staySignedIn"
            type="checkbox"
            checked={staySignedIn}
            onChange={() => setStaySignedIn(!staySignedIn)}
            className="mr-2 accent-blue-600"
          />
          <label htmlFor="staySignedIn" className="flex items-center gap-1">
            Stay signed in
            <span className="text-gray-400 cursor-pointer" title="Your session stays active even after closing the browser.">ℹ️</span>
          </label>
        </div>
      </div>
    </div>
  );
}
