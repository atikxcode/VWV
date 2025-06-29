'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import Image from 'next/image';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState('Personal');
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isValid } } = useForm({ mode: 'onChange' });

  const isBusiness = accountType === 'Business';

  const onSubmit = async (data) => {
    console.log('Form submitted:', { ...data, accountType });
    // Add backend logic here
  };

  const imagePath = isBusiness
    ? '/SignIn_SignUp_Logo/BusinessRegistration.jpg' // dummy
    : '/SignIn_SignUp_Logo/PersonalRegistration.jpg'; // dummy

  return (
    <div className="min-h-screen flex items-center justify-between bg-white ">
      <div className="flex w-full h-screen px-[60px]">
        
        {/* Left: Dynamic Image - 40% */}
        <div className="w-2/5 p-8 relative hidden md:block ">
          <img className='rounded-lg' src={imagePath} alt="" />
        </div>

        {/* Right: Form - 60% */}
        <div className="w-full md:w-3/5 p-8 flex items-center justify-center">
          <div className="w-full max-w-md h-[80%] space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-4">Create an account</h2>

            {/* Account Tabs */}
            <div className="flex mb-4 border-[1px] p-1 border-gray-300 rounded-full overflow-hidden">
              {['Personal', 'Business'].map((type) => (
                <button
                  key={type}
                  onClick={() => setAccountType(type)}
                  className={`w-1/2 py-2 text-sm font-medium transition rounded-2xl ${
                    accountType === type
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Business Description */}
            {isBusiness && (
              <p className="text-sm text-gray-700 mb-2">
                Continue to register as a <strong>business or nonprofit</strong>, or if you plan to sell a large number of goods.
              </p>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {isBusiness ? (
                <>
                  <input
                    type="text"
                    placeholder="Business name"
                    {...register('businessName', { required: 'Business name is required' })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                  />
                  <input
                    type="email"
                    placeholder="Business email"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      {...register('password', { required: 'Password is required' })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10"
                    />
                    <span
                      className="absolute top-2.5 right-3 text-gray-500 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                    </span>
                  </div>

                  <select
                    {...register('country', { required: 'Country is required' })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                  >
                    <option value="">Where is your business registered?</option>
                    <option value="us">United States</option>
                    <option value="bd">Bangladesh</option>
                    <option value="uk">United Kingdom</option>
                    <option value="in">India</option>
                    <option value="ca">Canada</option>
                  </select>
                  <p className="text-xs text-gray-500">If your business isn't registered, select your country of residence.</p>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('buyOnly')}
                      className="mr-2 accent-blue-600"
                    />
                    <label className="text-sm text-gray-700">
                      I’m only interested in buying on eBay for now
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="First name"
                      {...register('firstName', { required: 'First name is required' })}
                      className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      {...register('lastName', { required: 'Last name is required' })}
                      className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      {...register('password', { required: 'Password is required' })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10"
                    />
                    <span
                      className="absolute top-2.5 right-3 text-gray-500 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                    </span>
                  </div>
                </>
              )}

              {/* Legal text */}
              <p className="text-xs text-gray-600">
                By selecting <strong>Create {accountType.toLowerCase()} account</strong>, you agree to our{' '}
                <a href="#" className="text-blue-600 underline">User Agreement</a> and acknowledge reading our{' '}
                <a href="#" className="text-blue-600 underline">User Privacy Notice</a>.
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValid}
                className={`w-full py-2 rounded-full font-semibold transition ${
                  isValid
                    ? 'bg-black text-white hover:bg-gray-900'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Create {accountType.toLowerCase()} account
              </button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Already have an account? <a href="/login" className="text-blue-600 underline">Sign in</a>
            </p>

            {accountType === 'Personal' && (
              <>
                {/* Social Login Buttons */}
                <div className="text-center text-gray-500">or continue with</div>
                <div className="flex justify-center space-x-4">
                  <button className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100">
                    <Image src="/SocialMediaLogo/Google.png" alt="Google" width={30} height={30} />
                  </button>
                  <button className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100">
                    <Image src="/SocialMediaLogo/Facebook.png" alt="Facebook" width={22} height={22} />
                  </button>
                  <button className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100">
                    <Image src="/SocialMediaLogo/Apple.png" alt="Apple" width={23} height={23} />
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}