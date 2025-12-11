// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { User, Mail, Calendar, Shield } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { userAPI } from "../utils/api"; // make sure submitFeedback is defined here

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // Modal & Feedback states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userAPI.getProfile();
        if (res.data.success) {
          setProfileData(res.data.data);
          setUser(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setUser]);

  // ✅ Correct feedback submission
  const handleFeedbackSubmit = async (e) => {
  e.preventDefault();
  setFeedbackError("");
  setFeedbackSuccess("");

  if (!feedbackMessage.trim()) {
    setFeedbackError("Feedback cannot be empty.");
    return;
  }

  setSubmitting(true);
  try {
    await userAPI.submitFeedback({ message: feedbackMessage });
    setFeedbackMessage("");
    setFeedbackSuccess("Feedback submitted successfully!");
    setTimeout(() => setFeedbackSuccess(""), 3000);
    setIsModalOpen(false);
  } catch (err) {
    console.error("Feedback submission failed:", err);
    setFeedbackError(
      err.response?.data?.message || "Failed to submit feedback. Please try again."
    );
  } finally {
    setSubmitting(false);
  }
};

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

  const isUser = profileData.role?.toLowerCase() === "user";
  const showFeedbackButton = isUser || true;

  return (
    <div className="min-h-screen bg-[#d5f8f0]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Profile</h1>
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
                Role: {profileData.role || "User"}
              </p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4 mb-6">
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

          {/* Feedback Button */}
          {showFeedbackButton && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-teal-500 text-white font-semibold rounded hover:bg-teal-600"
            >
              Submit Feedback
            </button>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Send Feedback</h2>
            {feedbackSuccess && <p className="text-green-600 mb-2">{feedbackSuccess}</p>}
            {feedbackError && <p className="text-red-600 mb-2">{feedbackError}</p>}
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Write your feedback here..."
                required
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded text-white font-semibold ${
                  submitting ? "bg-teal-300 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600"
                }`}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
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

export default Profile;
