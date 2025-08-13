"use client";

import { useForm } from "react-hook-form";
import { useContext, useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import Image from "next/image";
import { AuthContext } from "../../../Provider/AuthProvider";
import { useRouter } from 'next/navigation';

export default function RegistrationPage() {

const {handleGoogleSignIn, user} = useContext(AuthContext)
  const router = useRouter();


const handleGoogleLoginAndRedirect = async () => {
    try {
      await handleGoogleSignIn();
      // Log user information after Google Sign-In
      if (user) {
        console.log('Google Sign-In User:', {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
      }
      router.push('/'); // Redirect to home page after successful Google login
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert('Google Sign-In failed. Please try again.');
    }
  };

  const [accountType, setAccountType] = useState("Login");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({ mode: "onChange" });

  const isSignup = accountType === "Signup";

  const onSubmit = async (data) => {
    console.log("Form submitted:", { ...data, accountType });
    const { firstName, lastName, email, password } = data;
    console.log(firstName, lastName, email, password, accountType);
  };

  const imagePath = isSignup
    ? "/SignIn_SignUp_Logo/Reg_1.jpg"
    : "/SignIn_SignUp_Logo/Reg_2.jpg";

  return (
    <div className="min-h-screen flex items-center justify-between">
      <div className="flex w-full h-screen lg:px-[30px] xl:px-[60px]">
        {/* Left: Dynamic Image */}
        <div className="xl:w-2/5 lg:p-6 xl:p-8 relative hidden lg:block">
          <img
            className="rounded-lg lg:h-[90%] xl:h-auto"
            src={imagePath}
            alt=""
          />
        </div>

        {/* Right: Form */}
        <div className="w-full md:w-3/5 p-8 flex items-center justify-center mx-auto">
          <div className="w-full max-w-md h-[80%] space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-4">
              {isSignup ? "Create an account" : "Welcome back"}
            </h2>

            {/* Tabs */}
            <div className="flex mb-4 border-[1px] p-1 border-gray-300 rounded-full overflow-hidden">
              {["Login", "Signup"].map((type) => (
                <button
                  key={type}
                  onClick={() => setAccountType(type)}
                  className={`w-1/2 py-2 text-sm font-medium transition rounded-2xl ${
                    accountType === type
                      ? "bg-purple-400 text-white"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
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
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="First name"
                      {...register("firstName", {
                        required: "First name is required",
                      })}
                      className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      {...register("lastName", {
                        required: "Last name is required",
                      })}
                      className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    {...register("email", { required: "Email is required" })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      {...register("password", {
                        required: "Password is required",
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
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="Email"
                    {...register("email", { required: "Email is required" })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      {...register("password", {
                        required: "Password is required",
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
                  </div>
                </>
              )}

              {/* Legal text */}
              {isSignup && (
                <p className="text-xs text-gray-600">
                  By selecting <strong>Create account</strong>, you agree to our{" "}
                  <a href="#" className="text-blue-600 underline">
                    User Agreement
                  </a>{" "}
                  and acknowledge reading our{" "}
                  <a href="#" className="text-blue-600 underline">
                    User Privacy Notice
                  </a>
                  .
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValid}
                className={`w-full py-2 rounded-full font-semibold transition ${
                  isValid
                    ? "bg-black text-white hover:bg-gray-900"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSignup ? "Create account" : "Login"}
              </button>
            </form>

            {/* Switch Links */}
            <p className="text-center text-sm text-gray-600">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAccountType("Login")}
                    className="text-blue-600 underline"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAccountType("Signup")}
                    className="text-blue-600 underline"
                  >
                    Signup
                  </button>
                </>
              )}
            </p>

            {/* Social Login (only for Login tab) */}
            {accountType === "Login" && (
              <>
                <div className="text-center text-gray-500">or continue with</div>
                <div className="flex justify-center space-x-4">
                  <button onClick={handleGoogleLoginAndRedirect}  className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100">
                    <Image
                      src="/SocialMediaLogo/Google.png"
                      alt="Google"
                      width={30}
                      height={30}
                    />
                  </button>
                  <button className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100">
                    <Image
                      src="/SocialMediaLogo/Facebook.png"
                      alt="Facebook"
                      width={22}
                      height={22}
                    />
                  </button>
                  <button className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100">
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
    </div>
  );
}
