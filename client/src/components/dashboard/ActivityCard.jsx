import { FiArrowRight, FiClock } from "react-icons/fi";

function ActivityCard({ activity }) {
  return (
    <div className="group flex items-center justify-between rounded-[22px] border border-white/10 bg-slate-800/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-slate-800 sm:p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl">
          {activity.icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{activity.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <FiClock />
            <span>{activity.time}</span>
          </div>
        </div>
      </div>

      <div className="text-slate-500 transition group-hover:text-violet-300">
        <FiArrowRight size={20} />
      </div>
    </div>
  );
}

export default ActivityCard;