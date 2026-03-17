import { useState, useEffect } from "react";
import { useProfile } from "./context/ProfileContext";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";

const stats = [
  { label: "Active Jobs", value: "1,240" },
  { label: "Employers", value: "380" },
  { label: "Hired This Month", value: "94" },
];

const categories = [
  { icon: "💻", label: "Technology" },
  { icon: "📐", label: "Design" },
  { icon: "📊", label: "Finance" },
  { icon: "🏥", label: "Healthcare" },
  { icon: "📦", label: "Logistics" },
  { icon: "🎓", label: "Education" },
];

const recentJobs = [
  { title: "Frontend Engineer", company: "Acme Corp", location: "Remote", tag: "Full-time" },
  { title: "Product Designer", company: "Studio K", location: "Makati", tag: "Contract" },
  { title: "Data Analyst", company: "FinData Inc", location: "BGC", tag: "Full-time" },
  { title: "DevOps Engineer", company: "CloudBase", location: "Remote", tag: "Part-time" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const userRole = profile?.userRole ?? null;
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);
  
  return (

    
    <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar userRole={userRole} />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6">

          {/* Hero */}
          <div
            className={`py-16 transition-all duration-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase text-gray-400 mb-5">
              <span className="inline-block w-6 h-px bg-gray-300" />
              Job Board
            </p>
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-gray-900 leading-tight max-w-xl mb-8">
              Find your next{" "}
              <span className="font-medium border-b-2 border-gray-900 pb-0.5">
                great role
              </span>
              ,<br />
              faster than before.
            </h1>

            {/* Search bar */}
            <div className="flex items-center max-w-lg bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm focus-within:border-gray-400 focus-within:shadow-md transition-all">
              <input
                type="text"
                placeholder="Search jobs, companies, or keywords…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/jobs?q=${query}`)}
                className="flex-1 px-4 py-3 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={() => navigate(`/jobs?q=${query}`)}
                className="px-5 py-3 bg-gray-900 hover:bg-gray-700 text-white font-mono text-xs tracking-wider transition-colors whitespace-nowrap cursor-pointer border-none"
              >
                Search →
              </button>
            </div>
          </div>

          {/* Stats */}
          <div
            className={`flex border border-gray-200 rounded-lg bg-white overflow-hidden mb-14 transition-all duration-500 delay-150 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex-1 px-7 py-6 ${i !== stats.length - 1 ? "border-r border-gray-200" : ""}`}
              >
                <div className="font-mono text-2xl font-medium text-gray-900 mb-1">
                  {s.value}
                </div>
                <div className="text-xs text-gray-400 tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div
            className={`mb-14 transition-all duration-500 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="font-mono text-[10.5px] tracking-widest uppercase text-gray-400 mb-4">
              Browse by category
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {categories.map((c) => (
                <button
                  key={c.label}
                  className="flex items-center gap-2.5 px-3.5 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:-translate-y-px transition-all cursor-pointer"
                >
                  <span className="text-base">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Jobs */}
          <div
            className={`mb-14 transition-all duration-500 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="font-mono text-[10.5px] tracking-widest uppercase text-gray-400 mb-4">
              Recent listings
            </p>
            <div className="flex flex-col gap-2">
              {recentJobs.map((j) => (
                <div
                  key={j.title}
                  onClick={() => navigate("/jobs")}
                  className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg px-5 py-4 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-900">{j.title}</span>
                    <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
                      <span>{j.company}</span>
                      <span>·</span>
                      <span>{j.location}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] tracking-wider uppercase bg-gray-100 text-gray-500 px-2.5 py-1 rounded whitespace-nowrap">
                    {j.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}