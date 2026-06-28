const menu = [
  "Dashboard",
  "Profile",
  "Skills",
  "Matches",
  "Reviews",
  "Chat",
];

function Sidebar() {
  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 p-6">
      <h2 className="text-3xl font-bold text-blue-500 mb-10">
        SkillSync
      </h2>

      <nav className="space-y-3">
        {menu.map((item) => (
          <button
            key={item}
            className="block w-full text-left px-4 py-3 rounded-xl hover:bg-slate-700 transition"
          >
            {item}
          </button>
        ))}

        <button className="block w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition">
          Logout
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;