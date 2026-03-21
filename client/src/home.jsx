import { useState, useEffect } from "react";
import { useProfile } from "./context/ProfileContext";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";

const API_URL = import.meta.env.VITE_API_URL;

const stats = [
  { label: "Active Jobs", value: "1,240" },
  { label: "Employers", value: "380" },
  { label: "Hired This Month", value: "94" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const [userVisible, setUserVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const userRole = profile?.userRole?.toLowerCase() ?? null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
  if (!profile) return;
  const checkVisibility = async () => {
    try {
      const res = await fetch(`${API_URL}/users/visibility`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setUserVisible(data.visible ?? false);
    } catch (err) {
      console.error("Failed to check visibility:", err);
    }
  };
  checkVisibility();
}, [profile,userRole]);

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
      setUserVisible(true);
      showToast("You are now visible for nearby work.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/ready/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setUserVisible(false);
      showToast("You are no longer visible to employers.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar userRole={userRole} />

      {/* Toast */}
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

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6">

          {/* Hero */}
          <div className={`py-16 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}>
            <p className="flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase text-gray-400 mb-5">
              <span className="inline-block w-6 h-px bg-gray-300" />
              Job Board
            </p>
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-gray-900 leading-tight max-w-xl mb-8">
              Find your next{" "}
              <span className="font-medium border-b-2 border-gray-900 pb-0.5">
                great role
              </span>
              ,<br />
              faster than before.
            </h1>

            {/* Guest / Admin — show search bar */}
            {(userRole === null || userRole === "admin") && (
              <div className="flex items-center max-w-lg bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm focus-within:border-gray-400 focus-within:shadow-md transition-all">
                <input
                  type="text"
                  placeholder="Search Nearby Laborer…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/jobs?q=${query}`)}
                  className="flex-1 px-4 py-3 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                />
                <button
                  onClick={() => navigate(`/login`)}
                  className="px-5 py-3 bg-gray-900 hover:bg-gray-700 text-white font-mono text-xs tracking-wider transition-colors whitespace-nowrap cursor-pointer border-none"
                >
                  Search →
                </button>
              </div>
            )}

            {/* User — ready for nearby work */}
            {userRole === "user" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReady}
                  disabled={loading || userVisible}
                  className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer"
                >
                  {loading ? "Checking…" : userVisible ? "Ready ✓" : "Ready for Nearby Work →"}
                </button>
                {userVisible && (
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="font-mono text-xs tracking-wider text-gray-600 border border-gray-200 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg transition-colors bg-white cursor-pointer"
                  >
                    {loading ? "Cancelling…" : "Cancel →"}
                  </button>
                )}
                {userVisible && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Active
                  </span>
                )}
              </div>
            )}

            {/* Employer — go to laborer finder */}
            {userRole === "employer" && (
              <button
                onClick={() => navigate("/employer/find")}
                className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer"
              >
                Find Nearby Laborers →
              </button>
            )}
          </div>

          {/* Stats */}
          <div className={`flex border border-gray-200 rounded-lg bg-white overflow-hidden mb-14 transition-all duration-500 delay-150 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}>
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex-1 px-7 py-6 ${i !== stats.length - 1 ? "border-r border-gray-200" : ""}`}
              >
                <div className="font-mono text-2xl font-medium text-gray-900 mb-1">
                  {s.value}
                </div>
                <div className="text-xs text-gray-400 tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}