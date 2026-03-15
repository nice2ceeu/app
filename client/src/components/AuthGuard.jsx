import { useProfile } from "../context/ProfileContext";
import { Navigate, Outlet } from "react-router-dom";

export default function AuthGuard({ allowedRoles = [], redirectTo = "/login" }) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-lightbackground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-lightgray font-poppins">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to={redirectTo} replace />;
  }

const role = profile.userRole;

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const dashboardMap = { user: "/user", employer: "/employer", admin: "/admin" };
    return <Navigate to={dashboardMap[role] ?? redirectTo} replace />;
  }

  return <Outlet />;
}