import { FiArrowUpRight } from "react-icons/fi";

function StatCard({ title, value, color, icon, subtitle, accent, barColor }) {
  return (
    <div className="group relative flex min-h-44 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_18px_60px_-30px_rgba(15,23,42,1)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 sm:p-6">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-90`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 text-2xl ${color}`}>
            {icon}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">
            <FiArrowUpRight size={12} />
            {subtitle}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <h2 className={`text-4xl font-semibold leading-none ${color} sm:text-5xl`}>{value}</h2>
            <span className="mb-1 h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
              <span className={`block h-full w-3/4 rounded-full ${barColor}`} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatCard;