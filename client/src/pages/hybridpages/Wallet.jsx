import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";

const API_URL = import.meta.env.VITE_API_URL;

export default function Wallet() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const topupRoute = profile?.userRole === "employer" ? "/employer/topup" : "/user/topup";

  useEffect(() => {
    if (profileLoading || !profile) return;
    fetchWallet();
    fetchHistory(0);
  }, [profile, profileLoading]);

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/wallet/${profile.id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setWallet(data);
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    }
  };

  const fetchHistory = async (p) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/tokens/history/${profile.id}?page=${p}&size=5`,
        { credentials: "include" }
      );
      const data = await res.json();
      setTransactions(data.content);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading || loading) {
    return (
      <>
        <Navbar userRole={profile?.userRole} />
        <div className="max-w-3xl mx-auto px-6 py-10">
          <p className="font-mono text-xs text-gray-400 animate-pulse">Loading…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole={profile?.userRole} />

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
              Wallet
            </p>
            <h1 className="text-2xl font-light tracking-tight text-gray-900">
              My Wallet
            </h1>
          </div>
          <button
            onClick={() => navigate(topupRoute)}
            className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Top Up →
          </button>
        </div>

        <div className="space-y-4">

          {/* ── Balance card ─────────────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl px-6 py-8 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-1">
                Token Balance
              </p>
              <p className="text-4xl font-light text-gray-900">
                {wallet?.balance ?? 0}
                <span className="text-sm text-gray-400 ml-2 font-mono">tokens</span>
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-gray-400 font-mono">
                Total Purchased:{" "}
                <span className="text-gray-700">{wallet?.totalPurchased ?? 0}</span>
              </p>
              <p className="text-xs text-gray-400 font-mono">
                Total Spent:{" "}
                <span className="text-gray-700">{wallet?.totalSpent ?? 0}</span>
              </p>
            </div>
          </div>

          {/* ── Transaction history ──────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50">
            <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-4">
              Transaction History
            </p>

            {transactions.length === 0 ? (
              <p className="text-xs text-gray-400 font-mono text-center py-6">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-xs font-mono text-gray-700">
                        +{tx.tokensAdded} tokens
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5 truncate max-w-[180px]">
                        {tx.paymongoSessionId}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400">
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-gray-900">
                        ₱{tx.amountPaid}
                      </p>
                      <span
                        className={`text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded ${
                          tx.status === "PAID"
                            ? "bg-green-50 text-green-600 border border-green-100"
                            : tx.status === "FAILED"
                            ? "bg-red-50 text-red-500 border border-red-100"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => fetchHistory(page - 1)}
                  disabled={page === 0}
                  className="font-mono text-xs text-gray-500 disabled:opacity-30 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  ← Prev
                </button>
                <p className="font-mono text-[10px] text-gray-400">
                  {page + 1} / {totalPages}
                </p>
                <button
                  onClick={() => fetchHistory(page + 1)}
                  disabled={page + 1 >= totalPages}
                  className="font-mono text-xs text-gray-500 disabled:opacity-30 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}