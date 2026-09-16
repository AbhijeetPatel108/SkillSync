import { FiBookOpen, FiMessageCircle, FiLogOut, FiUser, FiUsers, FiStar, FiLayout, FiFolder, FiShield } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const menu = [
  { label: "Dashboard", to: "/dashboard", icon: <FiLayout size={18} /> },
  { label: "Profile", to: "/profile", icon: <FiUser size={18} /> },
  { label: "Skills", to: "/skills", icon: <FiBookOpen size={18} /> },
  { label: "Matches", to: "/matches", icon: <FiUsers size={18} /> },
  { label: "Reviews", to: "/matches", icon: <FiStar size={18} /> },
  { label: "Chat", to: "/messages", icon: <FiMessageCircle size={18} /> },
  { label: "Projects", to: "/projects", icon: <FiFolder size={18} /> },
];

function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <aside className="w-full border-b border-white/10 bg-[#0e111b]/90 p-4 backdrop-blur-xl lg:w-72 lg:border-b-0 lg:border-r lg:p-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/65 p-4 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.7)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#8b5cf6] text-lg font-semibold text-white shadow-lg shadow-violet-950/30">
            S
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">SkillSync</h2>
            <p className="text-sm text-slate-400">Workspace</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {[...menu, ...(user?.role === "admin" ? [{ label: "Admin", to: "/admin/users", icon: <FiShield size={18} /> }] : [])].map((item) => (
            <NavLink
              key={item.label}
              to={item.label === "Reviews" ? `/reviews/${user?._id || user?.id}` : item.to}
              className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-violet-600/20 text-violet-200 shadow-inner shadow-violet-950/20"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`
              }
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-700/70">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="my-5 border-t border-white/10" />

        <div className="flex items-center gap-3 rounded-xl bg-slate-950/35 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.name || "Your profile"}</p>
            <p className="text-xs text-slate-500">Personal workspace</p>
          </div>
        </div>

        <button
          className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20"
          type="button"
          onClick={handleLogout}
        >
          <FiLogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;