import { FiArrowRight, FiClock } from "react-icons/fi";

function ActivityCard({ activity }) {
  return (
    <div className="group flex min-h-[76px] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-800/75 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-slate-800 sm:p-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl shadow-inner shadow-violet-950/20">
          {activity.icon}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">{activity.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <FiClock size={14} />
            <span>{activity.time}</span>
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            <span className="text-emerald-300">Recent</span>
          </div>
        </div>
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900/70 text-slate-400 transition group-hover:border-violet-400/30 group-hover:text-violet-200">
        <FiArrowRight size={16} />
      </div>
    </div>
  );
}

export default ActivityCard;