import React from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, Phone } from 'lucide-react';

interface SignupFormProps {
  signupEmail: string;
  setSignupEmail: (email: string) => void;
  signupPassword: string;
  setSignupPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  fullName: string;
  setFullName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onSwitchToLogin: () => void;
}

function SignupForm({
  signupEmail,
  setSignupEmail,
  signupPassword,
  setSignupPassword,
  confirmPassword,
  setConfirmPassword,
  fullName,
  setFullName,
  phone,
  setPhone,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isLoading,
  onSubmit,
  onSwitchToLogin
}: SignupFormProps) {
  return (
    <>
      <div className="text-center mb-8">
        <img
          src="/mycanteen.png"
          alt="MyCanteen Logo"
          className="h-16 w-auto mx-auto mb-4 drop-shadow-lg"
        />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Join MyCanteen</h1>
        <p className="text-gray-600">Create your canteen account</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium text-gray-700 block">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="fullName"
              type="text"
              maxLength={25}
              value={fullName}
              onChange={(e) => setFullName(e.target.value.slice(0, 25))}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-gray-700 block">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="signup-email"
              type="email"
              maxLength={25}
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value.slice(0, 25))}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700 block">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone"
              type="tel"
              maxLength={25}
              value={phone}
              onChange={(e) => setPhone(e.target.value.slice(0, 25))}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
              placeholder="Enter your phone number"
              required
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium text-gray-700 block">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              maxLength={25}
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value.slice(0, 25))}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
              placeholder="Create a password"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              maxLength={25}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value.slice(0, 25))}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating account...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>Create Account</span>
              <ArrowRight className="h-5 w-5" />
            </div>
          )}
        </button>
      </form>

      <div className="mt-6 mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Already have an account?</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
        >
          Sign in instead
        </button>
      </div>
    </>
  );
}

export default SignupForm;