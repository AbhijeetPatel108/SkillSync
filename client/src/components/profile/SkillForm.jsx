import { useState } from "react";
import { FiPlus } from "react-icons/fi";

function SkillForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    level: "Beginner",
    description: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.category) return;

    onSubmit(form);

    setForm({
      name: "",
      category: "",
      level: "Beginner",
      description: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      <div className="mb-5">
        <div className="flex items-center gap-2 text-violet-300">
          <FiPlus />
          <p className="text-sm font-medium uppercase tracking-[0.28em]">Add a skill</p>
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">Expand your offering</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Share a new skill and make it easier for others to discover your expertise.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Skill name</label>
          <input
            type="text"
            name="name"
            placeholder="Skill Name"
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
            <option value="">Select Category</option>
            <option value="Technology">Technology</option>
            <option value="Design">Design</option>
            <option value="Business">Business</option>
            <option value="Language">Language</option>
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
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition duration-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#8b5cf6] py-3 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:from-violet-600 hover:to-violet-500">
        <FiPlus />
        Add Skill
      </button>
    </form>
  );
}

export default SkillForm;