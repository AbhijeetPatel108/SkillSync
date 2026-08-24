function FilterBar({ category, level, onCategoryChange, onLevelChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="rounded-2xl border border-white/10 bg-slate-950/60 p-2 shadow-inner shadow-slate-950/30">
        <span className="mb-1.5 block px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Category</span>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        >
          <option value="">All Categories</option>
          <option value="Technology">Technology</option>
          <option value="Design">Design</option>
          <option value="Business">Business</option>
          <option value="Language">Language</option>
        </select>
      </label>

      <label className="rounded-2xl border border-white/10 bg-slate-950/60 p-2 shadow-inner shadow-slate-950/30">
        <span className="mb-1.5 block px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Skill level</span>
        <select
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        >
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Expert">Expert</option>
        </select>
      </label>
    </div>
  );
}

export default FilterBar;