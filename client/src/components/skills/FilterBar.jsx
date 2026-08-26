function FilterBar({ category, level, sort, userName, location, onCategoryChange, onLevelChange, onSortChange, onUserNameChange, onLocationChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="rounded-2xl border border-white/10 bg-slate-950/60 p-2 shadow-inner shadow-slate-950/30">
        <span className="mb-1.5 block px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Person</span>
        <input value={userName} onChange={(e) => onUserNameChange(e.target.value)} placeholder="Search by name" className="control w-full px-3 py-2.5 text-sm outline-none transition" />
      </label>

      <label className="rounded-2xl border border-white/10 bg-slate-950/60 p-2 shadow-inner shadow-slate-950/30">
        <span className="mb-1.5 block px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Location</span>
        <input value={location} onChange={(e) => onLocationChange(e.target.value)} placeholder="Search by location" className="control w-full px-3 py-2.5 text-sm outline-none transition" />
      </label>

      <label className="rounded-2xl border border-white/10 bg-slate-950/60 p-2 shadow-inner shadow-slate-950/30">
        <span className="mb-1.5 block px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Category</span>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="control w-full px-3 py-2.5 text-sm outline-none transition"
        >
          <option value="">All Categories</option>
          <option value="Technology">Technology</option>
          <option value="Design">Design</option>
          <option value="Business">Business</option>
          <option value="Language">Language</option>
          <option value="Music">Music</option>
          <option value="Cooking">Cooking</option>
          <option value="Fitness">Fitness</option>
          <option value="Art">Art</option>
          <option value="Writing">Writing</option>
          <option value="Other">Other</option>
        </select>
      </label>

      <label className="rounded-2xl border border-white/10 bg-slate-950/60 p-2 shadow-inner shadow-slate-950/30">
        <span className="mb-1.5 block px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Skill level</span>
        <select
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          className="control w-full px-3 py-2.5 text-sm outline-none transition"
        >
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Expert">Expert</option>
        </select>
      </label>
      <label className="rounded-2xl border border-white/10 bg-slate-950/60 p-2 shadow-inner shadow-slate-950/30">
        <span className="mb-1.5 block px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Sort by</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="control w-full px-3 py-2.5 text-sm outline-none transition"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="az">Name A-Z</option>
          <option value="za">Name Z-A</option>
        </select>
      </label>
    </div>
  );
}

export default FilterBar;