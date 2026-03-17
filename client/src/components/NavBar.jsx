import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
const API_URL = import.meta.env.VITE_API_URL;


const ROLE_LINKS = {

  // USER — job seeker links
  user: [
    { label: "Queue", path: "/user/queue" },
    { label: "Messages", path: "/user/message" },
    { label: "Feeds", path: "/user/feeds" },
    { label: "My profile", path: "/user/myprofile" },
    { label: "Settings", path: "/user/settings" },


  ],

  employer: [
    { label: "Feeds", path: "/employer/feeds" },
    { label: "Laborer Finder", path: "/employer/find" },
    { label: "Messages", path: "/employer/message" },
    { label: "Settings", path: "/employer/settings" },
  ],

  // ADMIN — platform management links
  admin: [
    { label: "Manage User", path: "/admin/usermanagement" },
    

  ],
};

export default function Navbar({ userRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { setProfile } = useProfile();

  const normalizedRole = userRole?.toLowerCase();
  // const dashboard = normalizedRole ? ROLE_DASHBOARD[normalizedRole] : undefined;
  const extraLinks = normalizedRole ? (ROLE_LINKS[normalizedRole] ?? []) : [];

  const handleSignOut = async () => {
    await fetch(`${API_URL}/signout`, {
      method: "POST",
      credentials: "include",
    });
    setProfile(null);
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `text-sm px-3 py-1.5 rounded-md transition whitespace-nowrap no-underline ${
      isActive
        ? "text-gray-900 bg-gray-100 font-medium"
        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

        {/* Brand */}
        {userRole !== "admin" ? (
            <NavLink
              to="/"
              className="font-mono text-sm font-medium tracking-wider text-gray-900 no-underline flex items-center gap-1 shrink-0"
            >
              <span>Nuto</span>
            </NavLink>
          ): (
            <h4
              className="font-mono text-sm font-medium tracking-wider text-gray-900 no-underline flex items-center gap-1 shrink-0"
            >
              <span>Nuto</span>
            </h4>
          )}

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-1 flex-1">

          {/* Dashboard link — shown for all logged-in roles */}
          {/* {dashboard && (
            <NavLink to={dashboard.path} className={linkClass}>
              {dashboard.label}
            </NavLink>
          )} */}

          {/* Role-specific links — see ROLE_LINKS above to add more */}
          {extraLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className={linkClass}>
              {link.label}
            </NavLink>
          ))}

          {/* Guest links — only shown when not logged in */}
          {!userRole && (
            <>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <NavLink to="/register" className={linkClass}>Register</NavLink>
            </>
          )}
        </div>

        {/* Right side — role badge + sign out */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {userRole && (
            <>
              <span className="text-xs font-medium uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-md border border-gray-200">
                {userRole}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 border border-gray-200 rounded-md px-3 py-1.5 hover:text-gray-900 hover:border-gray-400 transition bg-transparent cursor-pointer"
              >
                Sign out
              </button>
            </>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="sm:hidden flex flex-col gap-1 p-1 bg-transparent border-none cursor-pointer"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-px bg-gray-500 rounded" />
          <span className="block w-5 h-px bg-gray-500 rounded" />
          <span className="block w-5 h-px bg-gray-500 rounded" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden flex flex-col border-t border-gray-200 px-5 pt-2 pb-4 gap-1">

          {/* Dashboard — all roles */}
          {dashboard && (
            <NavLink
              to={dashboard.path}
              className="text-sm text-gray-700 px-2.5 py-2 rounded-md hover:bg-gray-50 no-underline"
              onClick={() => setMenuOpen(false)}
            >
              {dashboard.label}
            </NavLink>
          )}

          {/* Role-specific links */}
          {extraLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className="text-sm text-gray-700 px-2.5 py-2 rounded-md hover:bg-gray-50 no-underline"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          {/* Guest links */}
          {!userRole && (
            <>
              <NavLink
                to="/login"
                className="text-sm text-gray-700 px-2.5 py-2 rounded-md hover:bg-gray-50 no-underline"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="text-sm text-gray-700 px-2.5 py-2 rounded-md hover:bg-gray-50 no-underline"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </NavLink>
            </>
          )}

          {/* Sign out — all roles */}
          {userRole && (
            <button
              onClick={handleSignOut}
              className="text-left text-sm text-red-600 px-2.5 py-2 rounded-md hover:bg-red-50 bg-transparent border-none cursor-pointer w-full"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}