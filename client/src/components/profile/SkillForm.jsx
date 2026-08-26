import { useState } from "react";
import { FiPlus } from "react-icons/fi";

const categories = [
  "Technology",
  "Design",
  "Business",
  "Language",
  "Music",
  "Cooking",
  "Fitness",
  "Art",
  "Writing",
  "Other",
];

function SkillForm({
  onSubmit,
  title = "Expand your offering",
  description = "Share a new skill and make it easier for others to discover your expertise.",
  submitLabel = "Add Skill",
  loading = false,
  error = "",
  onCancel,
}) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    level: "Beginner",
    description: "",
  });
  const [validationError, setValidationError] = useState("");

  const handleChange = (e) => {
    setValidationError("");
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!form.name.trim()) {
      setValidationError("Enter a skill name before saving.");
      return;
    }

    if (!form.category) {
      setValidationError("Choose a category before saving.");
      return;
    }

    const submitted = await onSubmit({ ...form, name: form.name.trim(), description: form.description.trim() });

    if (submitted === false) return;

    setForm({
      name: "",
      category: "",
      level: "Beginner",
      description: "",
    });
    setValidationError("");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-violet-300">
          <FiPlus />
          <p className="text-[11px] font-medium uppercase tracking-[0.28em]">Add a skill</p>
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>

      {(validationError || error) && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-200">{validationError || error}</div>}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Skill name</label>
          <input
            type="text"
            name="name"
            placeholder="Skill name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition duration-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="">Select category</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Level</label>
          <select
            name="level"
            value={form.level}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
          <textarea
            rows="3"
            name="description"
            placeholder="What do you enjoy teaching or helping with?"
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition duration-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {onCancel && <button type="button" onClick={onCancel} className="flex-1 rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-700">Cancel</button>}
        <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#8b5cf6] py-3 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:from-violet-600 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60">
          <FiPlus />
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default SkillForm;