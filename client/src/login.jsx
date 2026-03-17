import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "./context/ProfileContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const redirectByRole = (role, navigate) => {
  if (role === "employer") navigate("/employer/feeds", { replace: true });
  else if (role === "admin") navigate("/admin/usermanagement", { replace: true });
  else navigate("/user/queue", { replace: true });
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();
  const { profile, loading: profileLoading, setProfile } = useProfile();

  // Redirect if already logged in
  useEffect(() => {
    if (profileLoading) return;
    if (!profile) return;
    redirectByRole(profile.userRole, navigate);
  }, [profile, profileLoading]);

  const handleHome = () => navigate("/");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please wait a moment.");
        return;
      }

      const text = await res.text();

      if (res.ok) {
        setSuccess("Login successful! Redirecting…");

        // FIX #1: removed duplicate if (profileRes.ok) nesting
        const profileRes = await fetch(`${API_URL}/profile`, {
          credentials: "include",
        });

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          redirectByRole(data.userRole, navigate);
        } else {
          navigate("/", { replace: true });
        }
      } else {
        setError(text || "Invalid credentials.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8">

        <p
          onClick={handleHome}
          className="text-sm text-lightgray font-poppins hover:text-primary transition-colors inline-flex gap-1 items-center cursor-pointer mb-4"
        >
          <span>← Home</span>
        </p>

        <p className="text-center text-xs font-mono tracking-widest text-gray-400 uppercase mb-8">
          <span className="text-gray-900 font-medium"></span> Nuto?
        </p>

        <h2 className="text-2xl font-medium text-gray-900 mb-1">Sign in</h2>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition mt-1"
          >
            {loading ? "Please wait…" : "Sign in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>

        <p className="text-center text-sm text-gray-500">
          No account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-gray-900 font-medium cursor-pointer border-b border-gray-300 hover:border-gray-600 transition"
          >
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}