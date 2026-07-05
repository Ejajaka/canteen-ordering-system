// src/components/ChangePasswordPage.tsx
import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { auth } from '../firebaseConfig';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';

interface ChangePasswordPageProps {
  onBack: () => void;
}

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ onBack }) => {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // control visibility for new/confirm and old separately
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  // Industry-grade-ish password policy:
  // - minimum length: 12
  // - at least one lowercase
  // - at least one uppercase
  // - at least one digit
  // - at least one special character (common symbols)
  const passwordPolicyRegex =
    /^(?=.{12,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=~`\[\]{}|;:'",.<>\/\\]).*$/;

  const validateNewPassword = (pwd: string) => {
    if (!pwd) return 'Password is required.';
    if (!passwordPolicyRegex.test(pwd)) {
      return 'Password must be at least 12 characters and include lowercase, uppercase, number and a special character (e.g. @, #, $, !).';
    }
    return null;
  };

  const handleUpdatePassword = async () => {
    // local validation
    if (!passwords.oldPassword) {
      alert('Please enter your current password to verify.');
      return;
    }

    const newPwdErr = validateNewPassword(passwords.newPassword);
    if (newPwdErr) {
      alert(newPwdErr);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }

    // Protection: ensure new password different from old
    if (passwords.oldPassword === passwords.newPassword) {
      alert('New password must be different from the current password.');
      return;
    }

    setIsUpdating(true);
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error('No user signed in or email unavailable.');

      // Reauthenticate
      const cred = EmailAuthProvider.credential(user.email, passwords.oldPassword);
      try {
        await reauthenticateWithCredential(user, cred);
      } catch (reauthErr: any) {
        // reauth failed
        console.error('Reauthentication failed:', reauthErr);
        alert('Could not verify current password. Please ensure the current password is correct.');
        setIsUpdating(false);
        return;
      }

      // Update password
      try {
        await updatePassword(user, passwords.newPassword);
        alert('Password updated successfully!');
        // clear sensitive fields
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        onBack();
      } catch (updateErr: any) {
        console.error('updatePassword error:', updateErr);
        alert(`Failed to update password: ${updateErr?.message || updateErr}`);
      }
    } catch (e: any) {
      console.error('Unexpected error:', e);
      alert(`Failed: ${e?.message || e}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const passwordStrengthNote = (
    <div className="text-xs text-gray-500 mt-2">
      Password requirements: minimum 12 characters, must include at least one uppercase letter, one lowercase letter, one number and one special character (examples: <span className="font-mono">@ # $ ! % ^ & *</span>).
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white">
      <div className="bg-white shadow-sm p-4 flex items-center">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg mr-4"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold text-gray-800 pr-12">
          Change Password
        </h1>
      </div>

      <div className="p-6 max-w-md mx-auto">
        {/* Old password */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 block mb-2">Current Password</label>
          <div className="relative">
            <input
              type={showOld ? 'text' : 'password'}
              placeholder="Enter current password"
              value={passwords.oldPassword}
              onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
              className="w-full p-3 rounded-xl border"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowOld((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              aria-label={showOld ? 'Hide current password' : 'Show current password'}
            >
              {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 block mb-2">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              placeholder="New password "
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full p-3 rounded-xl border"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {passwordStrengthNote}
        </div>

        {/* Confirm new password */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 block mb-2">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat new password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full p-3 rounded-xl border"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Tip: choose a unique password you don't use elsewhere. Consider using a password manager.
          </div>
        </div>

        <button
          onClick={handleUpdatePassword}
          className={`w-full bg-yellow-400 font-bold py-3 rounded-xl ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
