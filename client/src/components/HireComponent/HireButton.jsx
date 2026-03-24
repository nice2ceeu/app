import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function HireButton({ employerId, worker, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleHire = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tokens/hire`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerId,
          workerId: worker.userId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Hire failed.");

      onSuccess?.(`Hired ${worker.firstName} — 3 tokens deducted.`);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleHire}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono text-gray-600 border border-gray-200 rounded-full hover:border-gray-400 hover:text-gray-900 transition-colors bg-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {loading ? "Hiring…" : "Hire"}
    </button>
  );
}