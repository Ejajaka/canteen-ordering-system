import React, { useState } from 'react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ForgotPasswordPageProps {
  onBack: () => void;
  prefillEmail?: string;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack, prefillEmail = '' }) => {
  const [email, setEmail] = useState(prefillEmail);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<null | { type: 'ok' | 'err'; msg: string }>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!email.trim()) {
      setStatus({ type: 'err', msg: 'Please enter your email.' });
      return;
    }
    setIsSending(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setStatus({ type: 'ok', msg: 'Password reset link sent! Check your inbox (and spam folder).' });
    } catch (err: any) {
      setStatus({ type: 'err', msg: err?.message || 'Failed to send reset email. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
      {/* Background GIF grid overlay (same as your sample) */}
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

      {/* Keep the original card/content unchanged */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl relative">
          <button
            onClick={onBack}
            className="absolute left-4 top-4 p-2 rounded-lg hover:bg-gray-100"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center mb-8">
            <img src="/mycanteen.png" alt="MyCanteen Logo" className="h-16 w-auto mx-auto mb-4 drop-shadow-lg" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset your password</h1>
            <p className="text-gray-600">
              Enter the email associated with your account and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium text-gray-700 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {isSending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending…</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Send reset link</span>
                  <Send className="h-5 w-5" />
                </div>
              )}
            </button>
          </form>

          {status && (
            <div
              className={`mt-6 rounded-xl px-4 py-3 text-sm ${
                status.type === 'ok'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {status.msg}
            </div>
          )}

          <div className="mt-6 text-center">
            <button onClick={onBack} className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
