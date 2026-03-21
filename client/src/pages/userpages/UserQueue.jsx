import { useState, useEffect } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function UserQueue() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!profileLoading && !profile) navigate("/login");
  }, [profile, profileLoading]);

  useEffect(() => {
    if (!profile) return;
    const checkVisibility = async () => {
        try {
        const res = await fetch(`${API_URL}/users/visibility`, {
            credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setVisible(data.visible ?? false);
        } catch (err) {
        console.error("Failed to check visibility:", err);
        }
    };
    checkVisibility();
    }, [profile]);
    
  useEffect(() => {
    if (profile) setVisible(profile.visible ?? false);
  }, [profile]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReady = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/ready`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setVisible(true);
      showToast("You are now visible for nearby work.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`${API_URL}/users/ready/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setVisible(false);
      showToast("You are no longer visible to employers.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCancelling(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="font-mono text-xs text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <Navbar userRole={profile.userRole} />

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-mono tracking-wide transition-all ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-gray-900 text-white"
          }`}
        >
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
          {toast.message}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Queue
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Nearby Work
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Let employers discover you based on your location.
          </p>
        </div>

        <div className="border border-gray-100 rounded-xl px-6 py-6 flex items-center justify-between bg-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-900">Visibility Status</p>
            <p className="text-xs text-gray-400 mt-1">
              {visible
                ? "You are currently visible to nearby employers."
                : "You are not visible yet. Make sure your account is verified and your location is set."}
            </p>
            {visible && (
              <span className="inline-flex items-center gap-1.5 mt-2 font-mono text-[10px] tracking-widest uppercase bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Active
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {visible && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="font-mono text-xs tracking-wider text-gray-600 border border-gray-200 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg transition-colors bg-white cursor-pointer whitespace-nowrap"
              >
                {cancelling ? "Cancelling…" : "Cancel →"}
              </button>
            )}
            <button
              onClick={handleReady}
              disabled={loading || visible}
              className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer whitespace-nowrap"
            >
              {loading ? "Checking…" : visible ? "Ready ✓" : "Ready for Nearby Work →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}