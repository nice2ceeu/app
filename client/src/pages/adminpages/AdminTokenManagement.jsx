import { useState, useEffect, useCallback } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_STYLES = {
  PAID:    "bg-green-50 text-green-600 border-green-200",
  PENDING: "bg-yellow-50 text-yellow-600 border-yellow-200",
  FAILED:  "bg-red-50 text-red-600 border-red-200",
};

export default function AdminTokenManagement() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("transactions"); // transactions | adjust | wallet
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(0);
  const [txLoading, setTxLoading] = useState(false);

  // Manual adjust
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Wallet lookup
  const [walletUserId, setWalletUserId] = useState("");
  const [walletData, setWalletData] = useState(null);
  const [walletHistory, setWalletHistory] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);

  const [toast, setToast] = useState(null);

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profileLoading && !profile) navigate("/login");
  }, [profile, profileLoading]);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch all transactions ────────────────────────────────────────────────
  const fetchTransactions = useCallback(async (page = 0) => {
    setTxLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/tokens/transactions?page=${page}&size=10`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load transactions.");
      setTransactions(data.content);
      setTxTotalPages(data.totalPages);
      setTxPage(page);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "transactions") fetchTransactions(0);
  }, [tab]);

  // ── Manual adjust ────────────────────────────────────────────────────────
  const handleAdjust = async () => {
    if (!adjustUserId || !adjustAmount) {
      showToast("User ID and amount are required.", "error");
      return;
    }
    setAdjustLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/tokens/adjust`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(adjustUserId),
          tokenAmount: Number(adjustAmount),
          notes: adjustNotes,
          adminId: profile.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Adjustment failed.");
      showToast(
        `${Number(adjustAmount) >= 0 ? "Granted" : "Deducted"} ${Math.abs(Number(adjustAmount))} tokens to user #${adjustUserId}.`
      );
      setAdjustUserId("");
      setAdjustAmount("");
      setAdjustNotes("");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAdjustLoading(false);
    }
  };

  // ── Wallet lookup ────────────────────────────────────────────────────────
  const handleWalletLookup = async () => {
    if (!walletUserId) {
      showToast("Enter a User ID.", "error");
      return;
    }
    setWalletLoading(true);
    setWalletData(null);
    setWalletHistory([]);
    try {
      const [walletRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/admin/tokens/wallet/${walletUserId}`, { credentials: "include" }),
        fetch(`${API_URL}/admin/tokens/transactions/user/${walletUserId}?page=0&size=5`, { credentials: "include" }),
      ]);
      const wallet = await walletRes.json();
      const history = await historyRes.json();
      if (!walletRes.ok) throw new Error(wallet.error || "User not found.");
      setWalletData(wallet);
      setWalletHistory(history.content || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setWalletLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

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

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Admin
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Token Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            View all transactions, adjust balances, and look up user wallets.
          </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 border border-gray-100 rounded-lg p-1 bg-gray-50 w-fit">
          {[
            { id: "transactions", label: "All Transactions" },
            { id: "adjust",       label: "Manual Adjust" },
            { id: "wallet",       label: "Wallet Lookup" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`font-mono text-xs tracking-wider px-4 py-2 rounded-md transition-all cursor-pointer ${
                tab === t.id
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: All Transactions ───────────────────────────────────────── */}
        {tab === "transactions" && (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {["User", "Amount", "Tokens", "Status", "Session ID", "Date"].map((h) => (
                <p key={h} className="font-mono text-[10px] tracking-widest uppercase text-gray-400">
                  {h}
                </p>
              ))}
            </div>

            {txLoading ? (
              <div className="px-5 py-10 text-center">
                <p className="font-mono text-xs text-gray-300 animate-pulse">Loading…</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="font-mono text-xs text-gray-300">No transactions yet.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  {/* User */}
                  <div>
                    <p className="text-xs font-medium text-gray-900 truncate">{tx.userName}</p>
                    <p className="text-[10px] text-gray-400 font-mono">#{tx.userId}</p>
                  </div>
                  {/* Amount */}
                  <p className="text-xs font-mono text-gray-700 self-center">₱{tx.amountPaid}</p>
                  {/* Tokens */}
                  <p className="text-xs font-mono text-gray-700 self-center">+{tx.tokensAdded}</p>
                  {/* Status */}
                  <div className="self-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded border font-mono text-[10px] tracking-widest uppercase ${
                        STATUS_STYLES[tx.status] || "bg-gray-50 text-gray-400 border-gray-200"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  {/* Session ID */}
                  <p className="text-[10px] font-mono text-gray-300 self-center truncate">
                    {tx.paymongoSessionId || "—"}
                  </p>
                  {/* Date */}
                  <p className="text-[10px] font-mono text-gray-400 self-center">
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
              ))
            )}

            {/* Pagination */}
            {txTotalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => fetchTransactions(txPage - 1)}
                  disabled={txPage === 0}
                  className="font-mono text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <p className="font-mono text-[10px] text-gray-400">
                  Page {txPage + 1} of {txTotalPages}
                </p>
                <button
                  onClick={() => fetchTransactions(txPage + 1)}
                  disabled={txPage + 1 >= txTotalPages}
                  className="font-mono text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Manual Adjust ──────────────────────────────────────────── */}
        {tab === "adjust" && (
          <div className="space-y-4 max-w-lg">

            <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50 space-y-4">
              <p className="text-xs font-mono tracking-widest uppercase text-gray-400">
                Adjust Token Balance
              </p>

              {/* User ID */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-mono">
                  User ID
                </label>
                <input
                  type="number"
                  placeholder="e.g. 42"
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-mono">
                  Token Amount{" "}
                  <span className="text-gray-300">(positive = grant, negative = deduct)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10 or -5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-mono">
                  Notes <span className="text-gray-300">(reason / reference)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manual credit - GCash receipt verified"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              {/* Preview */}
              {adjustUserId && adjustAmount && (
                <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-gray-100">
                  <p className="text-xs text-gray-500 font-mono">
                    User <span className="text-gray-900">#{adjustUserId}</span>
                  </p>
                  <p
                    className={`text-sm font-mono font-medium ${
                      Number(adjustAmount) >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {Number(adjustAmount) >= 0 ? "+" : ""}
                    {adjustAmount} tokens
                  </p>
                </div>
              )}

              <button
                onClick={handleAdjust}
                disabled={adjustLoading}
                className="w-full font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {adjustLoading ? "Applying…" : "Apply Adjustment →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Wallet Lookup ──────────────────────────────────────────── */}
        {tab === "wallet" && (
          <div className="space-y-4 max-w-lg">

            {/* Search */}
            <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50">
              <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-4">
                Look Up User Wallet
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="User ID"
                  value={walletUserId}
                  onChange={(e) => setWalletUserId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleWalletLookup()}
                  className="flex-1 px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                />
                <button
                  onClick={handleWalletLookup}
                  disabled={walletLoading}
                  className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 px-5 py-2.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {walletLoading ? "…" : "Search →"}
                </button>
              </div>
            </div>

            {/* Wallet result */}
            {walletData && (
              <div className="space-y-3">

                {/* Balance card */}
                <div className="border border-gray-100 rounded-xl px-6 py-5 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{walletData.userName}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">User #{walletData.userId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-light text-gray-900">{walletData.balance}</p>
                      <p className="text-[10px] text-gray-400 font-mono">tokens</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="px-3 py-2.5 bg-white rounded-lg border border-gray-100">
                      <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Total Purchased</p>
                      <p className="font-mono text-sm text-gray-900 mt-0.5">{walletData.totalPurchased}</p>
                    </div>
                    <div className="px-3 py-2.5 bg-white rounded-lg border border-gray-100">
                      <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Total Spent</p>
                      <p className="font-mono text-sm text-gray-900 mt-0.5">{walletData.totalSpent}</p>
                    </div>
                  </div>
                </div>

                {/* Recent transactions */}
                {walletHistory.length > 0 && (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400">
                        Recent Transactions
                      </p>
                    </div>
                    {walletHistory.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="text-xs font-mono text-gray-700">
                            ₱{tx.amountPaid} → +{tx.tokensAdded} tokens
                          </p>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded border font-mono text-[10px] tracking-widest uppercase ${
                            STATUS_STYLES[tx.status] || "bg-gray-50 text-gray-400 border-gray-200"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}