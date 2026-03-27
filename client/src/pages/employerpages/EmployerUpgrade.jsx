import { useState } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";

const API_URL = import.meta.env.VITE_API_URL;

const PLANS = [
 
  {
    key: "pro",
    label: "Pro",
    price: 100,
    billing: "/ month",
    description: "Unlock the full Nutohr experience.",
    perks: [
      "All features unlocked",
      "Priority support",
    ],
   
  },
];

export default function EmployerUpgrade() {
  const { profile, loading: profileLoading } = useProfile();
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const isPro = selectedPlan === "pro";
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          plan: selectedPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session.");

      window.location.href = data.checkoutUrl;
    } catch (err) {
      showToast(err.message, "error");
      setLoading(false);
    }
  };

  const activePlan = PLANS.find((p) => p.key === selectedPlan);

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
            Account
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Upgrade Plan
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Unlock more tokens, features, and higher limits.
          </p>
        </div>

        <div className="space-y-4">

          {/* ── Current plan pill ─────────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-0.5">
                Current Plan
              </p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {profile?.upgraded ? "Pro" : "Free"}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-white border border-gray-200 font-mono text-[10px] tracking-widest uppercase text-gray-500">
              Active
            </span>
          </div>

          {/* ── Plan selector ─────────────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50">
            <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-4">
              Choose a Plan
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PLANS.map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`relative text-left rounded-xl border px-5 py-4 transition-all cursor-pointer ${
                    selectedPlan === plan.key
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <span
                      className={`absolute top-3 right-3 px-2 py-0.5 rounded font-mono text-[9px] tracking-widest uppercase ${
                        selectedPlan === plan.key
                          ? "bg-white text-gray-900"
                          : "bg-gray-900 text-white"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}

                  {/* Plan name */}
                  <p className="font-mono text-xs tracking-widest uppercase mb-2 opacity-60">
                    {plan.label}
                  </p>

                  {/* Price */}
                  <p className="text-xl font-light tracking-tight">
                    ₱{plan.price}
                    <span className="text-xs font-mono opacity-50 ml-1">
                      {plan.billing}
                    </span>
                  </p>

                  {/* Description */}
                  <p
                    className={`text-xs mt-1.5 ${
                      selectedPlan === plan.key ? "text-gray-300" : "text-gray-400"
                    }`}
                  >
                    {plan.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Perks list ────────────────────────────────────────────────── */}
          {activePlan && (
            <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50">
              <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-4">
                What's Included
              </p>
              <ul className="space-y-2.5">
                {activePlan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="mt-0.5 text-gray-400 font-mono text-xs">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          {/* ── Summary & Upgrade button ──────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {activePlan ? `₱${activePlan.price} / month` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {activePlan
                  ? isPro
                    ? `${activePlan.label} plan · billed monthly`
                    : "Select Pro to continue"
                  : "Select a plan to continue"}
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={loading || !selectedPlan || !isPro}
              className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer whitespace-nowrap"
            >
              {loading ? "Redirecting…" : "Upgrade →"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}