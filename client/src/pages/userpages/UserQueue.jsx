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
  const [tokenError, setTokenError] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [hired, setHired] = useState(false);

  useEffect(() => {
    if (!profileLoading && !profile) navigate("/login");
  }, [profile, profileLoading]);

  useEffect(() => {
    if (!profile) return;

    const fetchHired = async () => {
      try {
        const res = await fetch(`${API_URL}/hired-status`, { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setHired(data.hired ?? false);
          if (data.hired) setVisible(false); 
        }
      } catch (err) {
        console.error("Failed to fetch hired status:", err);
      }
    };

    fetchHired();
    const interval = setInterval(fetchHired, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/wallet/${profile.id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setWallet(data);
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    }
  };
    useEffect(() => {  
      fetchWallet();
    }, [hired]);
  
  useEffect(() => {
    if (!profile) return;
    
    const checkVisibility = async () => {
      try {
        const res = await fetch(`${API_URL}/users/visibility`, { credentials: "include" });
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
    setTokenError(false);
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
      if (err.message.toLowerCase().includes("token")) {
        setTokenError(true);
      } else {
        showToast(err.message, "error");
      }
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
      <Navbar userRole={profile?.userRole} verified={profile?.verified} />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-mono tracking-wide transition-all ${
          toast.type === "error"
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-gray-900 text-white"
        }`}>
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
          {toast.message}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10 flex items-start justify-between">
          <div>
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
          <div className="text-right">
            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-1">
              Token Balance
            </p>
            <p className="text-2xl font-light text-gray-900">
              {wallet?.balance ?? 0}
              <span className="text-xs text-gray-400 ml-1 font-mono">tokens</span>
            </p>
          </div>
        </div>

        {/* ── Hired banner ── */}
        {hired && (
          <div className="mb-4 flex items-start justify-between px-6 py-5 rounded-xl bg-blue-50 border border-blue-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                <p className="font-mono text-[10px] tracking-widest uppercase text-blue-500">
                  Currently Hired
                </p>
              </div>
              <p className="text-sm font-medium text-gray-900">
                You have an active job
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                You are currently hired. Complete your job before going available again.
              </p>
            </div>
            <button
              onClick={() => navigate("/user/jobs")}
              className="font-mono text-xs tracking-wider text-blue-600 border border-blue-200 hover:border-blue-400 px-4 py-2 rounded-lg transition-colors bg-white whitespace-nowrap"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* ── Visibility card ── */}
        <div className="border border-gray-100 rounded-xl px-6 py-6 flex items-center justify-between bg-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-900">Visibility Status</p>
            <p className="text-xs text-gray-400 mt-1">
              {hired
                ? "Visibility is paused while you are hired."
                : visible
                ? "You are currently visible to nearby employers."
                : "You are not visible yet. Make sure your account is verified and your location is set."}
            </p>
            {hired ? (
              <span className="inline-flex items-center gap-1.5 mt-2 font-mono text-[10px] tracking-widest uppercase bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Hired
              </span>
            ) : visible ? (
              <span className="inline-flex items-center gap-1.5 mt-2 font-mono text-[10px] tracking-widest uppercase bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Active
              </span>
            ) : null}
          </div>

          {!hired && (
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
          )}
        </div>

        {tokenError && (
          <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-mono">
            <div className="flex items-center gap-2.5">
              <span>✕</span> Insufficient tokens. Minimum 3 tokens required to go visible.
            </div>
            <button
              onClick={() => navigate("/user/topup")}
              className="ml-4 font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Top Up →
            </button>
          </div>
        )}
      </div>
    </>
  );
}