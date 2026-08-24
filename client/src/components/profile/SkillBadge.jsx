function SkillBadge({ skill, onDelete }) {
  return (
    <div className="group flex items-center justify-between rounded-2xl border border-violet-400/20 bg-slate-800/80 px-4 py-3 shadow-sm shadow-black/10 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-slate-800/90">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
          <h4 className="truncate font-semibold text-white">{skill.name}</h4>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {skill.category} • {skill.level}
        </p>
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(skill.name)}
          className="ml-4 rounded-full px-3 py-1.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
        >
          Remove
        </button>
      )}
    </div>
  );
}

export default SkillBadge;