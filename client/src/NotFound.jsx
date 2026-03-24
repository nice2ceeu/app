import { useNavigate } from "react-router-dom";
import { useProfile } from "./context/ProfileContext";

export default function NotFound() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const homeRoute =
    profile?.userRole === "employer"
      ? "/employer/feeds"
      : profile?.userRole === "admin"
      ? "/admin/usermanagement"
      : "/user/queue";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-3">
        404
      </p>
      <h1 className="text-3xl font-light tracking-tight text-gray-900 mb-2">
        Page not found
      </h1>
      <p className="text-sm text-gray-400 font-mono mb-8">
        The route you're looking for doesn't exist.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => navigate(-1)}
          className="font-mono text-xs tracking-wider text-gray-600 border border-gray-200 hover:border-gray-400 px-5 py-2.5 rounded-lg transition-colors bg-white cursor-pointer"
        >
          ← Go Back
        </button>
        <button
          onClick={() => navigate(homeRoute)}
          className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          Go Home →
        </button>
      </div>
    </div>
  );
}