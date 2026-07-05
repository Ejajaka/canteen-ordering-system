// src/components/SignupForm.tsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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

const SignupForm: React.FC<SignupFormProps> = ({
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
  onSwitchToLogin,
}) => {
  // Local UI error state
  const [error, setError] = useState<string | null>(null);

  // Industry-standard-ish password policy:
  // - minimum length 12
  // - at least one lowercase
  // - at least one uppercase
  // - at least one digit
  // - at least one special character
  const passwordPolicyRegex =
    /^(?=.{12,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=~`\[\]{}|;:'",.<>\/\\]).*$/;

  const validateForm = (): string | null => {
    if (!fullName || fullName.trim().length === 0) {
      return 'Full name is required.';
    }

    // phone already sanitized on change; ensure exactly 10 digits
    if (!/^\d{10}$/.test(phone)) {
      return 'Phone must be exactly 10 digits.';
    }

    if (!signupEmail || signupEmail.trim().length === 0) {
      return 'Email is required.';
    }
    // basic email sanity check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      return 'Please enter a valid email.';
    }

    if (!signupPassword) {
      return 'Password is required.';
    }
    if (!passwordPolicyRegex.test(signupPassword)) {
      return 'Password must be at least 12 characters and include uppercase, lowercase, a number and a special character.';
    }

    if (signupPassword !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const vErr = validateForm();
    if (vErr) {
      setError(vErr);
      return;
    }

    // all good -> forward submit to parent
    onSubmit(e);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4 relative">
      {/* Background GIF grid (same as Login / Forgot Password) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-4 gap-4 p-4">
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

      {/* Signup form card */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <img src="/mycanteen.png" alt="MyCanteen Logo" className="h-16 w-auto mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Join MyCanteen</h1>
            <p className="text-gray-600 text-sm">Create your canteen account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, 40))}
                required
                className="w-full p-3 border rounded-lg"
                aria-required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value.slice(0, 100))}
                required
                className="w-full p-3 border rounded-lg"
                aria-required
              />
            </div>

            {/* Phone restricted to 10 digits */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone (10 digits)</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => {
                  // allow only digits, max 10
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(v);
                }}
                required
                className="w-full p-3 border rounded-lg"
                aria-required
                inputMode="numeric"
                pattern="\d{10}"
                title="Enter exactly 10 digits"
              />
              <div className="text-xs text-gray-400 mt-1">We require a 10-digit phone number (no spaces or symbols).</div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Choose a strong password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value.slice(0, 128))}
                  required
                  className="w-full p-3 border rounded-lg pr-10"
                  aria-required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Minimum 12 characters; include uppercase, lowercase, a number and a special character.
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value.slice(0, 128))}
                  required
                  className="w-full p-3 border rounded-lg pr-10"
                  aria-required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 text-white p-3 rounded-lg disabled:opacity-60"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-red-600 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
