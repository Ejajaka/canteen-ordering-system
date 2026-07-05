import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Calendar } from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

interface EditProfilePageProps {
  userName: string;
  userId: string;
  onBack: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ userName, userId, onBack }) => {
  // Seed from auth.currentUser so UI never flashes empty values
  const current = auth.currentUser;
  const initialName = current?.displayName || userName || '';
  const initialEmail = current?.email || '';

  const [profileData, setProfileData] = useState({
    name: initialName,
    email: initialEmail,
    phone: '',
    dateOfBirth: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (!mounted) return;
        if (snap.exists()) {
          const d = snap.data() as any;
          setProfileData({
            name: d.fullName || initialName,
            email: current?.email || d.email || initialEmail,
            phone: d.phone || '',
            dateOfBirth: d.dateOfBirth || ''
          });
        } else {
          setProfileData({
            name: initialName,
            email: initialEmail,
            phone: '',
            dateOfBirth: ''
          });
        }
      } catch (err) {
        console.error('Failed fetching profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [userId, initialEmail, initialName, current?.email]);

  // ---- Validation ----
  const validateBeforeSave = (): string | null => {
    if (!profileData.name.trim()) return 'Full name cannot be empty.';
    if (!/^\d{10}$/.test(profileData.phone)) return 'Phone number must be exactly 10 digits.';

    if (profileData.dateOfBirth) {
      const today = new Date();
      const dob = new Date(profileData.dateOfBirth);
      dob.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (dob > today) return 'Date of birth cannot be in the future.';
    }

    return null;
  };

  const handleSaveProfile = async () => {
    try {
      const vErr = validateBeforeSave();
      if (vErr) {
        alert(vErr);
        return;
      }

      const u = auth.currentUser;
      if (!u) throw new Error('Not signed in');

      // Update displayName in Auth if changed
      if (profileData.name && profileData.name !== u.displayName) {
        try {
          await updateProfile(u, { displayName: profileData.name });
        } catch (e: any) {
          console.warn('Failed to update auth displayName:', e);
        }
      }

      // Email is immutable (read-only)
      const canonicalEmail = u.email || profileData.email;

      // Update Firestore doc
      await updateDoc(doc(db, 'users', userId), {
        fullName: profileData.name,
        email: canonicalEmail,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth
      });

      alert('Profile updated successfully!');
      onBack();
    } catch (e: any) {
      console.error('Failed to save profile:', e);
      alert(`Failed to update profile: ${e?.message || e}`);
    }
  };

  // helper: sanitize phone to digits only (max 10)
  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    setProfileData({ ...profileData, phone: digits });
  };

  // Disable future DOBs
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) return <div className="p-6">Loading profile…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white">
      <div className="bg-white shadow-sm p-4 flex items-center">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg mr-4">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold text-gray-800 pr-12">Edit Profile</h1>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-sm text-gray-500 mb-1">User ID</div>
            <div className="font-semibold text-gray-800">{userId}</div>
          </div>

          {/* Full Name */}
          <InputField
            label="Full Name"
            value={profileData.name}
            onChange={(v: string) => setProfileData({ ...profileData, name: v })}
            icon={User}
            required
          />

          {/* Email (read-only) */}
          <div className="mb-6">
            <label className="block text-gray-500 text-sm mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={profileData.email}
                readOnly
                disabled
                aria-disabled
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-600 cursor-not-allowed"
                title="Email cannot be changed"
              />
              <div className="text-xs text-gray-400 mt-2">Email cannot be changed from this screen.</div>
            </div>
          </div>

          {/* Phone (10 digits only) */}
          <div className="mb-6">
            <label className="block text-gray-500 text-sm mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="\d{10}"
                maxLength={10}
                value={profileData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Enter 10 digit phone number"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-500"
                required
              />
              <div className="text-xs text-gray-400 mt-2">Phone must be exactly 10 digits.</div>
            </div>
          </div>

          {/* Date of Birth (cannot exceed today) */}
          <div className="mb-6">
            <label className="block text-gray-500 text-sm mb-2">Date of Birth</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Calendar className="w-5 h-5" />
              </div>
              <input
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) =>
                  setProfileData({ ...profileData, dateOfBirth: e.target.value })
                }
                max={todayStr} // restrict selection to today or earlier
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-500"
              />
              
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl text-lg hover:bg-yellow-500 mt-4"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable input component
const InputField = ({
  label,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  required = false
}: any) => (
  <div className="mb-6">
    <label className="block text-gray-500 text-sm mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Icon className="w-5 h-5" />
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-500"
        required={required}
      />
    </div>
  </div>
);

export default EditProfilePage;
