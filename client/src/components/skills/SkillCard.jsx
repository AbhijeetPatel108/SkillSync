import { FiMapPin, FiSend, FiStar } from "react-icons/fi";

function SkillCard({ user, onSendRequest }) {
  return (
    <div className="flex h-full flex-col rounded-[26px] border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_70px_-34px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={user.avatar || "https://i.pravatar.cc/150"} alt={user.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-violet-500/20" />
          <div>
            <h2 className="text-xl font-semibold text-white">{user.name}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
              <FiMapPin size={14} />
              <span>{user.location || "Unknown"}</span>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-200">
          <FiStar size={12} />
          {Number(user.averageRating || 0).toFixed(1)}
        </div>
      </div>

      <p className="mt-5 line-clamp-4 text-sm leading-7 text-slate-300">{user.bio || "No bio available."}</p>

      <div className="mt-5 flex-1">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">Skills offered</h3>
        <div className="space-y-2">
          {user.skillsOffered?.map((skill, index) => (
            <div key={skill.id || skill._id || index} className="rounded-xl border border-violet-400/15 bg-violet-500/10 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-violet-100">{skill.name}</span>
                <span className="text-xs text-violet-200/70">{skill.category} · {skill.level}</span>
              </div>
              {skill.description && <p className="mt-1 text-xs leading-5 text-slate-300">{skill.description}</p>}
            </div>
          ))}
        </div>
        {user.skillsWanted?.length > 0 && <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Also wants to learn</p>}
        {user.skillsWanted?.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{user.skillsWanted.slice(0, 3).map((skill, index) => <span key={skill.id || skill._id || index} className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">{skill.name}</span>)}</div>}
      </div>

      <button
        type="button"
        onClick={() => onSendRequest(user.id || user._id)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#8b5cf6] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
      >
        <FiSend />
        Send Match Request
      </button>
    </div>
  );
}

export default SkillCard;