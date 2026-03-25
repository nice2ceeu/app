import { useState, useEffect, useCallback } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const ROLE_STYLES = {
  admin: "bg-purple-50 text-purple-600 border-purple-200",
  user:  "bg-gray-50 text-gray-500 border-gray-200",
};

export default function UserManagement() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);

  useEffect(() => {
    if (!profileLoading && !profile) navigate("/login");
  }, [profile, profileLoading, navigate]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch users ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/all-user`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users.");
      setUsers(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile) fetchUsers();
  }, [profile, fetchUsers]);

  if (profileLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="font-mono text-xs text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <Navbar userRole={profile?.userRole} />

      {/* Toast */}
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

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Admin
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            User Summary
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            View and manage all registered users.
          </p>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-9 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {["ID", "First Name", "Last Name", "Username", "Address", "Job Title", "Role", "Verified", "Visible"].map((h) => (
              <p key={h} className="font-mono text-[10px] tracking-widest uppercase text-gray-400">
                {h}
              </p>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="px-5 py-10 text-center">
              <p className="font-mono text-xs text-gray-300 animate-pulse">Loading…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-mono text-xs text-gray-300">No users found.</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-9 gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                {/* ID */}
                <p className="font-mono text-[10px] text-gray-400 self-center">#{user.id}</p>

                {/* First Name */}
                <p className="text-xs text-gray-900 self-center truncate">{user.firstName}</p>

                {/* Last Name */}
                <p className="text-xs text-gray-900 self-center truncate">{user.lastName}</p>

                {/* Username */}
                <p className="text-xs font-mono text-gray-600 self-center truncate">{user.username}</p>

                {/* Address */}
                <p className="text-xs text-gray-500 self-center truncate">{user.address || "—"}</p>

                {/* Job Title */}
                <p className="text-xs text-gray-500 self-center truncate">{user.jobTitle || "—"}</p>

                {/* Role */}
                <div className="self-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded border font-mono text-[10px] tracking-widest uppercase ${
                      ROLE_STYLES[user.userRole] || "bg-gray-50 text-gray-400 border-gray-200"
                    }`}
                  >
                    {user.userRole}
                  </span>
                </div>

                {/* Verified */}
                <p
                  className={`text-xs font-mono self-center ${
                    user.verified ? "text-green-600" : "text-gray-300"
                  }`}
                >
                  {user.verified ? "Yes" : "No"}
                </p>

                {/* Visible */}
                <p
                  className={`text-xs font-mono self-center ${
                    user.visible ? "text-green-600" : "text-gray-300"
                  }`}
                >
                  {user.visible ? "Yes" : "No"}
                </p>
              </div>
            ))
          )}
        </div>

        {!loading && users.length > 0 && (
          <p className="font-mono text-[10px] text-gray-300 mt-3 text-right">
            {users.length} user{users.length !== 1 ? "s" : ""} total
          </p>
        )}

      </div>
    </>
  );
}