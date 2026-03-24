import { useState, useEffect } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function MyWorkers() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [endingId, setEndingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null); // ← was missing

  useEffect(() => {
    if (!profileLoading && !profile) navigate("/login");
  }, [profile, profileLoading]);

  const fetchWorkers = async () => {
    try {
      const res = await fetch(`${API_URL}/employer/hires`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setWorkers(data);
    } catch (err) {
      console.error("Failed to fetch workers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    fetchWorkers();
  }, [profile]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEndContract = async (hireId, firstName) => {
    setEndingId(hireId);
    try {
      const res = await fetch(`${API_URL}/employer/hires/${hireId}/end`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to end contract.");
      setWorkers((prev) => prev.filter((w) => w.hireId !== hireId));
      showToast(`Contract with ${firstName} ended.`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setEndingId(null);
    }
  };

  const handleCancel = async (hireId, firstName) => { // ← moved before early return
    setCancellingId(hireId);
    try {
      const res = await fetch(`${API_URL}/employer/hires/${hireId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel contract.");
      setWorkers((prev) => prev.filter((w) => w.hireId !== hireId));
      showToast(`Contract with ${firstName} cancelled. Worker refunded.`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleMessage = (w) => {
    navigate("/employer/message", { state: { receiver: w.username } });
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
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Employer
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            My Workers
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your currently hired workers.
          </p>
        </div>

        {loading ? (
          <p className="font-mono text-xs text-gray-400 animate-pulse">Loading workers…</p>
        ) : workers.length === 0 ? (
          <div className="border border-gray-100 rounded-xl px-6 py-10 bg-gray-50 text-center">
            <p className="text-sm text-gray-500">No active workers.</p>
            <p className="font-mono text-xs text-gray-400 mt-1">
              Hire workers from the Laborer Finder.
            </p>
            <button
              onClick={() => navigate("/employer/find")}
              className="mt-4 font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 px-5 py-2.5 rounded-lg transition-colors"
            >
              Find Workers →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {workers.map((w) => (
              <div
                key={w.hireId}
                className="border border-gray-100 rounded-xl px-5 py-4 bg-gray-50 flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-mono text-xs text-blue-600 font-medium shrink-0">
                    {w.firstName?.[0]}{w.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {w.firstName} {w.lastName}
                    </p>
                    <p className="font-mono text-xs text-gray-400">{w.jobTitle}</p>
                    <p className="font-mono text-[10px] text-gray-300 mt-0.5">
                      Hired {new Date(w.hiredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMessage(w)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-gray-600 border border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors bg-white"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Message
                  </button>
                  <button
                    onClick={() => handleCancel(w.hireId, w.firstName)}
                    disabled={cancellingId === w.hireId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-yellow-600 border border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    {cancellingId === w.hireId ? "Cancelling…" : "Cancel"}
                  </button>
                  <button
                    onClick={() => handleEndContract(w.hireId, w.firstName)}
                    disabled={endingId === w.hireId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-red-600 border border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {endingId === w.hireId ? "Ending…" : "End Contract"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}