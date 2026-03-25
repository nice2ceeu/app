import { useState, useEffect } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

// ── Star picker sub-component ────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <span
            className={
              star <= (hovered || value)
                ? "text-amber-400"
                : "text-gray-200"
            }
          >
            ★
          </span>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 font-mono text-xs text-gray-400">
          {["", "Poor", "Fair", "Good", "Great", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

// ── Rating Modal ─────────────────────────────────────────────────────────────
function RatingModal({ worker, onSubmit, onSkip, onClose, submitting }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (stars === 0) {
      setError("Please select a star rating before submitting.");
      return;
    }
    setError("");
    onSubmit({ stars, comment: comment.trim() });
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">

        {/* Close ✕ */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-5">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-1">
            End Contract
          </p>
          <h2 className="text-lg font-medium text-gray-900 tracking-tight">
            Leave a rating for {worker.firstName}?
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Help others know what it's like to work with{" "}
            <span className="text-gray-600 font-medium">{worker.firstName} {worker.lastName}</span>.
            You can skip this if you prefer.
          </p>
        </div>

        {/* Worker chip */}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-mono text-xs text-blue-600 font-medium shrink-0">
            {worker.firstName?.[0]}{worker.lastName?.[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {worker.firstName} {worker.lastName}
            </p>
            <p className="font-mono text-xs text-gray-400">{worker.jobTitle}</p>
          </div>
        </div>

        {/* Stars */}
        <div className="mb-4">
          <label className="block font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Star Rating <span className="text-red-400">*</span>
          </label>
          <StarPicker value={stars} onChange={setStars} />
          {error && (
            <p className="mt-2 text-xs text-red-500 font-mono">{error}</p>
          )}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Review <span className="text-gray-300">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience working with this person…"
            maxLength={500}
            rows={3}
            className="w-full text-sm text-gray-800 placeholder-gray-300 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-gray-400 transition-colors font-light"
          />
          <p className="text-right font-mono text-[10px] text-gray-300 mt-1">
            {comment.length}/500
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 text-sm font-mono tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            {submitting ? "Submitting…" : "Submit & End Contract"}
          </button>
          <button
            onClick={onSkip}
            disabled={submitting}
            className="w-full py-2.5 text-sm font-mono tracking-wider text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl border border-gray-200 transition-colors"
          >
            Skip & End Contract
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MyWorkers() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [endingId, setEndingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Rating modal state
  const [ratingTarget, setRatingTarget] = useState(null); // worker object to rate
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

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
    setTimeout(() => setToast(null), 3500);
  };

  // ── Called after the modal decides (submit rating OR skip) ────────────────
  const endContract = async (hireId, firstName) => {
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

  // ── "End Contract" button click → open rating modal ───────────────────────
  const handleEndContractClick = (w) => {
    setRatingTarget(w);
  };

  // ── User submits a rating, then we end the contract ───────────────────────
  const handleRatingSubmit = async ({ stars, comment }) => {
    if (!ratingTarget) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch(
        `${API_URL}/ratings?workerId=${ratingTarget.workerId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hireId: ratingTarget.hireId,
            stars,
            comment: comment || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit rating.");
    } catch (err) {
      // Rating failed — still proceed to end contract, just warn
      showToast("Rating failed to save, but contract will still end.", "error");
    } finally {
      setRatingSubmitting(false);
      const target = ratingTarget;
      setRatingTarget(null);
      await endContract(target.hireId, target.firstName);
    }
  };

  // ── User skips rating → just end contract ─────────────────────────────────
  const handleRatingSkip = async () => {
    if (!ratingTarget) return;
    const target = ratingTarget;
    setRatingTarget(null);
    await endContract(target.hireId, target.firstName);
  };

  // ── Close modal without ending contract ───────────────────────────────────
  const handleModalClose = () => {
    setRatingTarget(null);
  };

  const handleCancel = async (hireId, firstName) => {
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
     <Navbar userRole={profile?.userRole} verified={profile?.verified} />

      {/* Rating Modal */}
      {ratingTarget && (
        <RatingModal
          worker={ratingTarget}
          onSubmit={handleRatingSubmit}
          onSkip={handleRatingSkip}
          onClose={handleModalClose}
          submitting={ratingSubmitting}
        />
      )}

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
          <p className="font-mono text-xs text-gray-400 animate-pulse">
            Loading workers…
          </p>
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

                  {/* End Contract → opens rating modal */}
                  <button
                    onClick={() => handleEndContractClick(w)}
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