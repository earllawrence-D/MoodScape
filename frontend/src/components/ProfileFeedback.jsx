// ProfileFeedback.jsx
import React, { useState } from "react";
import api from '../utils/api'; // default import

export default function ProfileFeedback() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError("Feedback cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/feedback', { message });
 // ✅ Correct backend call
      setMessage("");
      setSuccess("Feedback submitted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 p-4 border-t">
      <h2 className="text-lg font-bold mb-2">Send Feedback</h2>

      {success && <p className="text-green-600 mb-2">{success}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your feedback here..."
          required
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />

        <button
          type="submit"
          disabled={submitting}
          className={`px-4 py-2 rounded text-white font-semibold ${
            submitting
              ? "bg-teal-300 cursor-not-allowed"
              : "bg-teal-500 hover:bg-teal-600"
          }`}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
