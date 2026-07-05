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
  onForgotPassword: (prefillEmail?: string) => void;
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
  onForgotPassword,
}: LoginFormProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4 relative">
      {/* Background GIF grid (same as other screens) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-4 gap-4 p-4 pointer-events-none">
          <div className="flex items-center justify-center">
            <img src="/1.gif" alt="Campus 1" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/Amv.gif" alt="Campus AMV" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/Blr.gif" alt="Campus BLR" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/Cbe.gif" alt="Campus CBE" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/Chn.gif" alt="Campus CHN" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/Fbd.gif" alt="Campus FBD" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/Khi.gif" alt="Campus KHI" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/Mys.gif" alt="Campus LKO" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
          </div>
        </div>
      </div>

      {/* Card (no white border) */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
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
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
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
                  maxLength={50}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
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

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onForgotPassword(loginEmail)}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
              >
                Forgot password?
              </button>
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

          {/* Switch to Signup */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                {/* slight transparency to sit nicely on the semi-transparent card */}
                <span className="px-2 bg-white/80 text-gray-500">New to MyCanteen?</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
