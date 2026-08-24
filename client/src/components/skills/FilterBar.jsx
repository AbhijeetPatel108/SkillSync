function FilterBar({ category, level, onCategoryChange, onLevelChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
      >
        <option value="">All Categories</option>
        <option value="Technology">Technology</option>
        <option value="Design">Design</option>
        <option value="Business">Business</option>
        <option value="Language">Language</option>
      </select>

      <select
        value={level}
        onChange={(e) => onLevelChange(e.target.value)}
        className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
      >
        <option value="">All Levels</option>
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Expert">Expert</option>
      </select>
    </div>
  );
}

export default FilterBar;