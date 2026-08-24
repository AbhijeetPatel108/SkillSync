import { FiBell, FiChevronDown, FiMenu } from "react-icons/fi";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/skills", label: "Skills" },
  { to: "/matches", label: "Matches" },
  { to: "/messages", label: "Messages" },
  { to: "/profile", label: "Profile" },
];

function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#8b5cf6] text-lg font-semibold text-white shadow-lg shadow-violet-950/30">
            S
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-white">SkillSync</h1>
            <p className="text-xs text-slate-400">Talent marketplace</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-800/70 p-1.5 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative rounded-full border border-white/10 bg-slate-800/80 p-2.5 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            aria-label="Notifications"
          >
            <FiBell size={18} />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
              3
            </span>
          </button>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-800/80 px-2 py-2 pr-3 shadow-lg shadow-slate-950/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8b5cf6] text-sm font-semibold text-white">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden md:block">
              <h3 className="text-sm font-semibold text-white">{user?.name || "User"}</h3>
              <p className="text-xs text-slate-400">Learner</p>
            </div>
            <FiChevronDown className="hidden text-slate-400 sm:block" />
          </div>

          <button className="rounded-full border border-white/10 bg-slate-800/80 p-2.5 text-white md:hidden" type="button" aria-label="Menu">
            <FiMenu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;