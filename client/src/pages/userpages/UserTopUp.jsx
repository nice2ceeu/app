import { useState } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";

const API_URL = import.meta.env.VITE_API_URL;

const PRESET_AMOUNTS = [100, 200, 300, 500];

export default function TopUp() {
  const { profile, loading: profileLoading } = useProfile();

  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const finalAmount =
    selectedAmount !== null
      ? selectedAmount
      : customAmount !== ""
      ? Number(customAmount)
      : null;

  // Token estimate: ₱10 = 1 token
  const tokenEstimate = finalAmount ? Math.floor(finalAmount / 10) : null;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePreset = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustom = (e) => {
    setSelectedAmount(null);
    setCustomAmount(e.target.value);
  };

  const handlePayOnline = async () => {
    if (!finalAmount || finalAmount < 50) {
      showToast("Minimum top-up amount is ₱50.", "error");
      return;
    }

    setLoading(true);
    try {
      // Backend creates the PayMongo checkout session and returns checkout_url
      const res = await fetch(`${API_URL}/tokens/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          amount: finalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session.");

      // Redirect to PayMongo checkout page
      window.location.href = data.checkoutUrl;
    } catch (err) {
      showToast(err.message, "error");
      setLoading(false);
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
      <Navbar userRole={profile?.userRole} />

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

        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Wallet
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Top Up
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Add credits to your wallet. ₱10 = 1 token.
          </p>
        </div>

        <div className="space-y-4">

          {/* ── Amount ───────────────────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50">
            <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-4">
              Select Amount
            </p>

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handlePreset(amt)}
                  className={`py-3 rounded-lg font-mono text-sm tracking-wider border transition-all cursor-pointer ${
                    selectedAmount === amt
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  ₱{amt}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-400">
                ₱
              </span>
              <input
                type="number"
                min="50"
                placeholder="Other amount"
                value={customAmount}
                onChange={handleCustom}
                className="w-full pl-8 pr-4 py-2.5 text-sm font-mono border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* Token estimate */}
            {tokenEstimate !== null && (
              <p className="mt-3 font-mono text-[10px] tracking-widest uppercase text-gray-400">
                ≈{" "}
                <span className="text-gray-700 font-medium">
                  {tokenEstimate} tokens
                </span>{" "}
                will be credited after payment
              </p>
            )}
          </div>

          {/* ── Accepted payments badge ───────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl px-6 py-4 bg-gray-50 flex items-center gap-3 flex-wrap">
            <span className="px-2.5 py-1 rounded bg-blue-50 border border-blue-100 font-mono text-[10px] tracking-widest uppercase text-blue-500">
              GCash
            </span>
            <span className="px-2.5 py-1 rounded bg-green-50 border border-green-100 font-mono text-[10px] tracking-widest uppercase text-green-600">
              PayMaya
            </span>
            <span className="px-2.5 py-1 rounded bg-orange-50 border border-orange-100 font-mono text-[10px] tracking-widest uppercase text-orange-500">
              ShopeePay
            </span>
            <p className="text-xs text-gray-400 font-mono">
              — You'll be redirected to a secure checkout page.
            </p>
          </div>

          {/* ── Summary & Pay button ──────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {finalAmount ? `₱${finalAmount}` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {tokenEstimate
                  ? `${tokenEstimate} tokens · credited after payment`
                  : "Select an amount to continue"}
              </p>
            </div>
            <button
              onClick={handlePayOnline}
              disabled={loading || !finalAmount}
              className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer whitespace-nowrap"
            >
              {loading ? "Redirecting…" : "Pay Online →"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}