import React from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  loginPassword: string;
  setLoginPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onSwitchToSignup: () => void;
}

function LoginForm({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showPassword,
  setShowPassword,
  isLoading,
  onSubmit,
  onSwitchToSignup,
}: LoginFormProps) {
  return (
    <>
      <div className="text-center mb-8">
        <img
          src="/mycanteen.png"
          alt="MyCanteen Logo"
          className="h-16 w-auto mx-auto mb-4 drop-shadow-lg"
        />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
        <p className="text-gray-600">Sign in to your canteen account</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              maxLength={100}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value.slice(0, 100))}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              maxLength={25}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value.slice(0, 25))}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
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

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>Sign In</span>
              <ArrowRight className="h-5 w-5" />
            </div>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6 mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
        </div>
      </div>

      {/* Switch to Signup */}
      <div className="text-center">
        
      </div>
    </>
  );
}

export default LoginForm;
