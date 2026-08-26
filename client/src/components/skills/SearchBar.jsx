import { FiSearch } from "react-icons/fi";

function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Search skills, people, or expertise..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="control w-full py-3.5 pl-11 pr-4 text-sm outline-none transition"
      />
    </div>
  );
}

export default SearchBar;