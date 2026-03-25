import { useState } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    address: "",
    jobTitle: "",
    userRole: "",
    verified: false,
    visible:false,
    hired:false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "userRole" && value !== "user" ? { jobTitle: "" } : {}),
    }));
  };

  const HandleHome =()=>{
    navigate('/')
  }
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { firstName, lastName, username, password, address, jobTitle, userRole } = form;
    const jobTitleRequired = userRole === "user" && !jobTitle;

    if (!firstName || !lastName || !username || !password || !address || !userRole || jobTitleRequired) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess("Account created! You can now sign in.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const text = await res.text();
        setError("Registration failed.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8">
      <p
            onClick={HandleHome}
            className="text-sm text-lightgray font-poppins hover:text-primary transition-colors inline-flex gap-1 items-center cursor-pointer mb-4"
            
          >
            <span> ← Home</span>
          </p>
        <p className="text-center text-xs font-mono tracking-widest text-gray-400 uppercase mb-8">
          <span className="text-gray-900 font-medium"></span>  Nuto?
        </p>

        <h2 className="text-2xl font-medium text-gray-900 mb-1">Create account</h2>
        <p className="text-sm text-gray-500 mb-6">Fill in the details below to get started</p>

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

        <form onSubmit={handleRegister} className="space-y-4">
        
          {/* First & Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                First name
              </label>
              <input
                className={inputClass}
                type="text"
                name="firstName"
                placeholder="Jane"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Last name
              </label>
              <input
                className={inputClass}
                type="text"
                name="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              className={inputClass}
              type="text"
              name="username"
              placeholder="jane_doe"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              className={inputClass}
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Address
            </label>
            <input
              className={inputClass}
              type="text"
              name="address"
              placeholder="123 Main St, City"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          {/* Role + Job Title (conditional) */}
          <div className={`grid gap-3 ${form.userRole === "user" ? "grid-cols-2" : "grid-cols-1"}`}>
            {form.userRole === "user" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Job title
                </label>
                <input
                  className={inputClass}
                  type="text"
                  name="jobTitle"
                  placeholder="Engineer"
                  value={form.jobTitle}
                  onChange={handleChange}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Role
              </label>
              <select
                className={`${inputClass} appearance-none cursor-pointer`}
                name="userRole"
                value={form.userRole}
                onChange={handleChange}
              >
                <option value="">Select role</option>
                <option value="user">User</option>
                <option value="employer">Employer</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition mt-1"
          >
            {loading ? "Please wait…" : "Create account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-gray-900 font-medium cursor-pointer border-b border-gray-300 hover:border-gray-600 transition"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}