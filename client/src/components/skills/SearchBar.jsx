import { FiSearch } from "react-icons/fi";

function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Search skills..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-3.5 pl-11 pr-4 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
      />
    </div>
  );
}

export default SearchBar;