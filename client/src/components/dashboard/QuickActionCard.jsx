function QuickActionCard({ title, icon }) {
  return (
    <button className="w-full flex items-center gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700 hover:bg-blue-600 transition">
      <span className="text-2xl">{icon}</span>
      <span className="text-white font-medium">{title}</span>
    </button>
  );
}

export default QuickActionCard;