import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";

const API_URL = import.meta.env.VITE_API_URL;

export default function PaymentSuccess() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("verifying"); // verifying | confirmed | failed
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    if (profileLoading) return;
    if (!profile) {
      navigate("/login");
      return;
    }

    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("failed");
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(
          `${API_URL}/tokens/confirm?session_id=${sessionId}`,
          { credentials: "include" }
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Verification failed.");

        if (data.status === "PAID") {
          setTransaction(data);
          setStatus("confirmed");
        } else {
          setStatus("failed");
        }
      } catch (err) {
        console.error(err);
        setStatus("failed");
      }
    };

    confirm();
  }, [profile, profileLoading]);

  if (profileLoading || status === "verifying") {
    return (
      <>
        <Navbar userRole={profile?.userRole} />
        <div className="max-w-3xl mx-auto px-6 py-10">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">Wallet</p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">Payment Received</h1>
          <p className="text-sm text-gray-400 mt-2">
            Your tokens will be credited shortly. You may close this page.
          </p>
          <button onClick={() => navigate(profile?.userRole === "employer" ? "/employer/find" : "/user/queue")}
            className="mt-6 font-mono text-xs tracking-wider text-white bg-gray-900 px-5 py-2.5 rounded-lg">
            Continue →
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole={profile?.userRole} />

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Wallet
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            {status === "confirmed" ? "Payment Confirmed" : "Payment Failed"}
          </h1>
        </div>

        {status === "confirmed" ? (
          /* ── Success ──────────────────────────────────────────────────── */
          <div className="space-y-4">

            {/* Checkmark card */}
            <div className="border border-gray-100 rounded-xl px-6 py-10 bg-gray-50 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg">
                ✓
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Tokens credited to your wallet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Your payment was verified successfully.
                </p>
              </div>
            </div>

            {/* Transaction summary */}
            {d && (
              <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50 space-y-3">
                <p className="text-xs font-mono tracking-widest uppercase text-gray-400">
                  Summary
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">Amount Paid</span>
                  <span className="text-sm font-medium text-gray-900 font-mono">
                    ₱{transaction.amountPaid}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">Tokens Credited</span>
                  <span className="text-sm font-medium text-gray-900 font-mono">
                    +{transaction.tokensAdded} tokens
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">Reference</span>
                  <span className="text-xs text-gray-400 font-mono truncate max-w-[160px]">
                    {transaction.paymongoSessionId}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
           <div className="flex gap-2">
            <button
              onClick={() => navigate(profile?.userRole === "employer" ? "/employer/topup" : "/user/topup")}
              className="font-mono text-xs tracking-wider text-gray-600 border border-gray-200 hover:border-gray-400 px-5 py-2.5 rounded-lg transition-colors bg-white cursor-pointer"
            >
              Top Up Again
            </button>
            <button
              onClick={() => navigate(profile?.userRole === "employer" ? "/employer/find" : "/user/queue")}
              className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {profile?.userRole === "employer" ? "Go to Finder →" : "Go to Queue →"}
            </button>
          </div>

          </div>
        ) : (
          /* ── Failed ───────────────────────────────────────────────────── */
          <div className="space-y-4">

            <div className="border border-gray-100 rounded-xl px-6 py-10 bg-gray-50 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 text-red-500 flex items-center justify-center text-lg">
                ✕
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Payment could not be verified
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  If you were charged, please contact support with your
                  reference number. Your tokens will be credited manually.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate(profile?.userRole === "employer" ? "/employer/topup" : "/user/topup")}
                className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Try Again →
              </button>
            </div>

          </div>
        )}

      </div>
    </>
  );
}