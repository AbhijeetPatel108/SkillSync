function Navbar() {
  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      <h1 className="text-2xl font-bold text-blue-500">
        SkillSync
      </h1>

      <div className="flex items-center gap-4">
        <button className="text-xl">🔔</button>

        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
          A
        </div>
      </div>
    </header>
  );
}

export default Navbar;