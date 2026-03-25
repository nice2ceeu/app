import { useState, useEffect, useRef } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_STYLES = {
  PENDING:  "bg-yellow-50 text-yellow-600 border-yellow-200",
  APPROVED: "bg-green-50 text-green-600 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

export default function VerificationSubmit() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [govId, setGovId]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting]   = useState(null);  
  const [loadingApp, setLoadingApp] = useState(true);
  const [toast, setToast]         = useState(null);

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profileLoading && !profile) navigate("/login");
  }, [profile, profileLoading, navigate]);

  // ── Fetch existing application ───────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;

    const fetchMyApplication = async () => {
      try {
        const res = await fetch(`${API_URL}/verification/my`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setExisting(data);
        }
      } catch {
        // no application yet, ignore
      } finally {
        setLoadingApp(false);
      }
    };

    fetchMyApplication();
  }, [profile]);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── File select ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGovId(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setGovId(file);
    setPreview(URL.createObjectURL(file));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!govId) {
      showToast("Please upload your government ID.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("govId", govId);

      const res = await fetch(`${API_URL}/verification/submit`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      setExisting(data);
      setGovId(null);
      setPreview(null);
      showToast("Application submitted successfully.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading || loadingApp) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="font-mono text-xs text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <>
     <Navbar userRole={profile?.userRole} verified={profile?.verified} />

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

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Account
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Verification
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Submit a government-issued ID to verify your account.
          </p>
        </div>

        {/* ── Already submitted ─────────────────────────────────────────── */}
        {existing ? (
          <div className="border border-gray-100 rounded-xl px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono tracking-widest uppercase text-gray-400">
                Application Status
              </p>
              <span
                className={`inline-flex px-2 py-0.5 rounded border font-mono text-[10px] tracking-widest uppercase ${
                  STATUS_STYLES[existing.status] || "bg-gray-50 text-gray-400 border-gray-200"
                }`}
              >
                {existing.status}
              </span>
            </div>

            {/* Gov ID preview */}
            <div className="rounded-lg overflow-hidden border border-gray-100">
              <img
                src={`${API_URL}${existing.govIdUrl}`}
                alt="Submitted Government ID"
                className="w-full object-cover max-h-56"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Submitted</p>
                <p className="font-mono text-xs text-gray-900 mt-0.5">
                  {existing.submittedAt
                    ? new Date(existing.submittedAt).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div className="px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Reviewed</p>
                <p className="font-mono text-xs text-gray-900 mt-0.5">
                  {existing.reviewedAt
                    ? new Date(existing.reviewedAt).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            {existing.status === "REJECTED" && existing.rejectionReason && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="font-mono text-[10px] uppercase tracking-widest text-red-400 mb-1">
                  Rejection Reason
                </p>
                <p className="text-xs text-red-600">{existing.rejectionReason}</p>
              </div>
            )}

            {/* Allow resubmit if rejected */}
            {existing.status === "REJECTED" && (
              <button
                onClick={() => setExisting(null)}
                className="w-full font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Resubmit Application →
              </button>
            )}
          </div>

        ) : (

          /* ── Submit form ──────────────────────────────────────────────── */
          <div className="border border-gray-100 rounded-xl px-6 py-5 space-y-5">
            <p className="text-xs font-mono tracking-widest uppercase text-gray-400">
              Upload Government ID
            </p>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-contain"
                />
              ) : (
                <>
                  <p className="font-mono text-xs text-gray-400">
                    Drag & drop or click to upload
                  </p>
                  <p className="font-mono text-[10px] text-gray-300">
                    JPG, PNG, WEBP accepted
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File name */}
            {govId && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <p className="font-mono text-xs text-gray-600 truncate">{govId.name}</p>
                <button
                  onClick={() => { setGovId(null); setPreview(null); }}
                  className="font-mono text-[10px] text-gray-400 hover:text-red-500 ml-3 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !govId}
              className="w-full font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? "Submitting…" : "Submit Application →"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}