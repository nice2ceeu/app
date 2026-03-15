import { NavLink } from "react-router-dom";

const LINKS = {
  Product: [
    { label: "Browse Jobs", to: "/jobs" },
    { label: "For Employers", to: "/employer" },
    { label: "Post a Job", to: "/employer/post" },
  ],
  Company: [
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "Privacy Policy", to: "/privacy" },
  ],
  Account: [
    { label: "Login", to: "/login" },
    { label: "Register", to: "/register" },
    { label: "Dashboard", to: "/user" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 border-t border-neutral-800 mt-auto">
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-8">

        {/* Top grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

          {/* Brand block */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
            <NavLink
              to="/"
              className="font-mono text-sm font-medium tracking-widest text-neutral-100 no-underline flex items-center gap-1"
            >
              <span>Nutp</span>
              <span className="text-neutral-600 mx-0.5">/</span>
              <span>app</span>
            </NavLink>

            <p className="text-xs text-neutral-500 leading-relaxed max-w-[180px]">
              A straightforward job board connecting talent with the right opportunities.
            </p>

            {/* Status indicator */}
            <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-neutral-600 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              All systems operational
            </span>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group} className="flex flex-col gap-1">
              <p className="font-mono text-[10px] tracking-widest uppercase text-neutral-600 mb-2">
                {group}
              </p>
              {links.map(({ label, to }) => (
                <NavLink
                  key={label}
                  to={to}
                  className="text-[13px] text-neutral-500 hover:text-neutral-200 no-underline transition-colors py-0.5 w-fit"
                >
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-neutral-800">
          <span className="font-mono text-[10.5px] tracking-wide text-neutral-600">
            © {year} Nutp/app — all rights reserved
          </span>
          <span className="font-mono text-[10.5px] text-neutral-700">
            built with ♥ and too much coffee
          </span>
        </div>

      </div>
    </footer>
  );
}