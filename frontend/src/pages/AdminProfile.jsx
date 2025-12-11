// src/pages/AdminProfile.jsx
import { useState, useEffect } from "react";
import AdminNavbar from "../components/AdminNavbar";
import { User, Mail, Calendar, Shield } from "lucide-react";
import { adminAPI } from "../utils/api";

const AdminProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await adminAPI.getProfile();
        if (res.data.success) {
          // Ensure isActive is true for admins
          const admin = res.data.data;
          if (admin.role.toLowerCase() === "admin" && admin.isActive == null) {
            admin.isActive = true;
          }
          setProfileData(admin);
        }
      } catch (err) {
        console.error("Failed to fetch admin profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d5f8f0]">
        <p className="text-gray-700">Loading profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d5f8f0]">
        <p className="text-red-600">Failed to load profile. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d5f8f0]">
      <AdminNavbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Admin Profile</h1>
        <p className="text-gray-700 mb-6">Your account information</p>

        {/* Profile Card */}
        <div className="bg-white border-2 border-teal-400 rounded-xl shadow-md p-6 max-w-2xl">

          {/* Avatar & Name */}
          <div className="flex items-center space-x-6 mb-6 border-b pb-6 border-gray-300">
            <div className="w-24 h-24 rounded-full bg-teal-200 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">
                {profileData.username?.[0]?.toUpperCase()}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData.fullName || profileData.username}
              </h2>
              <p className="text-gray-600">@{profileData.username}</p>
              <p className="text-sm text-gray-500 mt-1">
                Role: {profileData.role}
              </p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            <ProfileField icon={User} label="Username" value={profileData.username} />
            <ProfileField icon={Mail} label="Email" value={profileData.email} />
            <ProfileField
              icon={Calendar}
              label="Member Since"
              value={new Date(profileData.createdAt).toLocaleDateString()}
            />
            <ProfileField
              icon={Shield}
              label="Account Status"
              value={profileData.isActive ? "Active" : "Inactive"}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

const ProfileField = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
    <Icon className="w-5 h-5 text-teal-600" />
    <div className="flex-1">
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-gray-900 font-semibold">{value}</p>
    </div>
  </div>
);

export default AdminProfile;
