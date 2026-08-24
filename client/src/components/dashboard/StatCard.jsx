import { FiArrowUpRight } from "react-icons/fi";

function StatCard({ title, value, color, icon, subtitle, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_70px_-34px_rgba(0,0,0,0.95)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-violet-950/20 sm:p-6">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-80 transition duration-500 group-hover:opacity-100`} />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-2xl ${color}`}>
            {icon}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-emerald-300">
            <FiArrowUpRight />
            {subtitle}
          </div>
        </div>

        <h2 className={`mt-6 text-4xl font-semibold ${color} sm:text-5xl`}>{value}</h2>
        <p className="mt-2 text-sm text-slate-400 sm:text-base">{title}</p>
      </div>
    </div>
  );
}

export default StatCard;