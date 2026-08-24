import { FiBookOpen, FiMessageCircle, FiLogOut, FiUser, FiUsers, FiStar, FiLayout } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const menu = [
  { label: "Dashboard", to: "/dashboard", icon: <FiLayout size={18} /> },
  { label: "Profile", to: "/profile", icon: <FiUser size={18} /> },
  { label: "Skills", to: "/skills", icon: <FiBookOpen size={18} /> },
  { label: "Matches", to: "/matches", icon: <FiUsers size={18} /> },
  { label: "Reviews", to: "/matches", icon: <FiStar size={18} /> },
  { label: "Chat", to: "/messages", icon: <FiMessageCircle size={18} /> },
];

function Sidebar() {
  const { logout } = useAuth();
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
    <aside className="w-full border-b border-white/10 bg-slate-900/80 p-4 backdrop-blur-xl lg:w-72 lg:border-b-0 lg:border-r lg:p-6">
      <div className="rounded-[24px] border border-white/10 bg-slate-800/70 p-4 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.7)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#8b5cf6] text-lg font-semibold text-white shadow-lg shadow-violet-950/30">
            S
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">SkillSync</h2>
            <p className="text-sm text-slate-400">Workspace</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
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