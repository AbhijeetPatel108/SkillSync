import { useEffect, useState } from "react";
import { FiEdit2, FiFolder, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";

import projectService from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";

const emptyForm = { title: "", description: "", status: "open", skills: "" };
const statuses = ["open", "in_progress", "completed", "archived"];

function formatStatus(status) {
  return status.replace("_", " ");
}

function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await projectService.getProjects({ search, limit: 12 });
      setProjects(response.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (project) => {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description,
      status: project.status,
      skills: project.skills.join(", "),
    });
    setError("");
    setShowForm(true);
  };

  const selectProject = async (project) => {
    try {
      const response = await projectService.getProject(project.id);
      setSelectedProject(response.project);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load project details.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form, skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean) };
    try {
      const response = editingId
        ? await projectService.updateProject(editingId, payload)
        : await projectService.createProject(payload);
      setShowForm(false);
      setSelectedProject(response.project);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save project.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (project) => {
    if (!window.confirm(`Delete ${project.title}?`)) return;
    try {
      await projectService.deleteProject(project.id);
      if (selectedProject?.id === project.id) setSelectedProject(null);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete project.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-panel p-5 sm:p-8">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">Collaboration workspace</p>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">Share what you are building and find collaborators with the right skills.</p>
          </div>
          <button type="button" onClick={openCreate} className="primary-button"><FiPlus /> New project</button>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
          <FiSearch className="text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </div>

        {error && <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-10 text-center text-slate-300">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 p-10 text-center text-slate-400">No projects match your search.</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((project) => {
              const isOwner = Number(project.owner.id) === Number(user?.id);
              return (
                <article key={project.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-violet-400/30">
                  <button type="button" onClick={() => selectProject(project)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3"><FiFolder className="mt-1 shrink-0 text-violet-300" /><div><h2 className="truncate text-lg font-semibold text-white">{project.title}</h2><p className="mt-1 text-sm text-slate-400">by {project.owner.name}</p></div></div>
                      <span className="shrink-0 rounded-full bg-violet-500/10 px-3 py-1 text-xs capitalize text-violet-200">{formatStatus(project.status)}</span>
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-300">{project.description || "No description provided."}</p>
                    <div className="mt-4 flex flex-wrap gap-2">{project.skills.map((skill) => <span key={skill} className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{skill}</span>)}</div>
                  </button>
                  {isOwner && <div className="mt-5 flex gap-2 border-t border-white/10 pt-4"><button type="button" onClick={() => openEdit(project)} className="control inline-flex items-center gap-2 px-3 text-sm text-slate-200"><FiEdit2 /> Edit</button><button type="button" onClick={() => remove(project)} className="control inline-flex items-center gap-2 px-3 text-sm text-rose-200"><FiTrash2 /> Delete</button></div>}
                </article>
              );
            })}
          </div>
        )}

        {selectedProject && <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-5"><div className="flex items-start justify-between gap-4"><div><p className="page-eyebrow">Project details</p><h2 className="mt-2 text-2xl font-semibold text-white">{selectedProject.title}</h2></div><button type="button" onClick={() => setSelectedProject(null)} aria-label="Close project details" className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><FiX /></button></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{selectedProject.description || "No description provided."}</p><p className="mt-4 text-sm text-slate-400">Owner: <span className="text-slate-200">{selectedProject.owner.name}</span></p></div>}
      </div>

      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-white">{editingId ? "Edit project" : "Create project"}</h2><button type="button" onClick={() => setShowForm(false)} aria-label="Close project form" className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><FiX /></button></div><label className="mt-6 block text-sm text-slate-300">Title<input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="control mt-2 w-full px-3" /></label><label className="mt-4 block text-sm text-slate-300">Description<textarea maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="control mt-2 min-h-32 w-full p-3" /></label><label className="mt-4 block text-sm text-slate-300">Skills<span className="mt-1 block text-xs text-slate-500">Comma-separated, up to 10</span><input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} className="control mt-2 w-full px-3" /></label><label className="mt-4 block text-sm text-slate-300">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="control mt-2 w-full px-3">{statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="control px-4 text-sm text-slate-300">Cancel</button><button disabled={saving} type="submit" className="primary-button">{saving ? "Saving..." : "Save project"}</button></div></form></div>}
    </div>
  );
}

export default Projects;
