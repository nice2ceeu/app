import { useState, useEffect, useCallback } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_STYLES = {
  PENDING:  "bg-yellow-50 text-yellow-600 border-yellow-200",
  APPROVED: "bg-green-50 text-green-600 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

export default function VerificationAdmin() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [selected, setSelected]         = useState(null); // selected app for modal
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [toast, setToast]               = useState(null);

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profileLoading && !profile) navigate("/login");
  }, [profile, profileLoading, navigate]);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch all applications ───────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/verification/admin/all`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load applications.");
      setApplications(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile) fetchApplications();
  }, [profile, fetchApplications]);

  // ── Approve ──────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/verification/admin/approve/${id}`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed.");
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? data : a))
      );
      setSelected(null);
      showToast("Application approved.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reject ───────────────────────────────────────────────────────────────
  const handleReject = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/verification/admin/reject/${id}?reason=${encodeURIComponent(rejectReason)}`,
        { method: "PATCH", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed.");
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? data : a))
      );
      setSelected(null);
      setRejectReason("");
      showToast("Application rejected.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const filtered = filterStatus === "ALL"
    ? applications
    : applications.filter((a) => a.status === filterStatus);

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

      {/* ── Review Modal ───────────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
          onClick={() => { setSelected(null); setRejectReason(""); }}
        >
          <div
            className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{selected.username}</p>
                <p className="font-mono text-[10px] text-gray-400 mt-0.5">
                  #{selected.userId} · {selected.userRole}
                </p>
              </div>
              <span
                className={`inline-flex px-2 py-0.5 rounded border font-mono text-[10px] tracking-widest uppercase ${
                  STATUS_STYLES[selected.status] || "bg-gray-50 text-gray-400 border-gray-200"
                }`}
              >
                {selected.status}
              </span>
            </div>

            {/* Gov ID image */}
            <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
              <img
                src={`${API_URL}${selected.govIdUrl}`}
                alt="Government ID"
                className="w-full object-contain max-h-56"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Submitted</p>
                <p className="font-mono text-xs text-gray-900 mt-0.5">{formatDate(selected.submittedAt)}</p>
              </div>
              <div className="px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Reviewed</p>
                <p className="font-mono text-xs text-gray-900 mt-0.5">{formatDate(selected.reviewedAt)}</p>
              </div>
            </div>

            {/* Rejection reason input — only show if pending */}
            {selected.status === "PENDING" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-mono">
                  Rejection Reason <span className="text-gray-300">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ID is blurry or expired"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            )}

            {/* Existing rejection reason */}
            {selected.status === "REJECTED" && selected.rejectionReason && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="font-mono text-[10px] uppercase tracking-widest text-red-400 mb-1">
                  Rejection Reason
                </p>
                <p className="text-xs text-red-600">{selected.rejectionReason}</p>
              </div>
            )}

            {/* Actions — only for pending */}
            {selected.status === "PENDING" && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleReject(selected.id)}
                  disabled={actionLoading}
                  className="flex-1 font-mono text-xs tracking-wider text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  {actionLoading ? "…" : "Reject"}
                </button>
                <button
                  onClick={() => handleApprove(selected.id)}
                  disabled={actionLoading}
                  className="flex-1 font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  {actionLoading ? "…" : "Approve →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Admin
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Verification Applications
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Review and approve or reject submitted verification requests.
          </p>
        </div>

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 border border-gray-100 rounded-lg p-1 bg-gray-50 w-fit">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`font-mono text-xs tracking-wider px-4 py-2 rounded-md transition-all cursor-pointer ${
                filterStatus === s
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              <span className="ml-1.5 text-[10px] text-gray-300">
                {s === "ALL"
                  ? applications.length
                  : applications.filter((a) => a.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {["User", "Role", "Status", "Submitted", "Reviewed", "Action"].map((h) => (
              <p key={h} className="font-mono text-[10px] tracking-widest uppercase text-gray-400">
                {h}
              </p>
            ))}
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center">
              <p className="font-mono text-xs text-gray-300 animate-pulse">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-mono text-xs text-gray-300">No applications found.</p>
            </div>
          ) : (
            filtered.map((app) => (
              <div
                key={app.id}
                className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                {/* User */}
                <div>
                  <p className="text-xs font-medium text-gray-900 truncate">{app.username}</p>
                  <p className="text-[10px] text-gray-400 font-mono">#{app.userId}</p>
                </div>

                {/* Role */}
                <p className="text-xs font-mono text-gray-500 self-center capitalize">
                  {app.userRole?.toLowerCase()}
                </p>

                {/* Status */}
                <div className="self-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded border font-mono text-[10px] tracking-widest uppercase ${
                      STATUS_STYLES[app.status] || "bg-gray-50 text-gray-400 border-gray-200"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Submitted */}
                <p className="text-[10px] font-mono text-gray-400 self-center">
                  {formatDate(app.submittedAt)}
                </p>

                {/* Reviewed */}
                <p className="text-[10px] font-mono text-gray-400 self-center">
                  {formatDate(app.reviewedAt)}
                </p>

                {/* Action */}
                <div className="self-center">
                  <button
                    onClick={() => { setSelected(app); setRejectReason(""); }}
                    className="font-mono text-[10px] tracking-wider text-gray-400 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Review →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p className="font-mono text-[10px] text-gray-300 mt-3 text-right">
            {filtered.length} application{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
}