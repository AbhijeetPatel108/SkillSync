import { useState } from "react";
import { FiBookOpen, FiTarget, FiTrash2, FiX } from "react-icons/fi";

import SkillForm from "../profile/SkillForm";
import userService from "../../services/userService";

const limits = 10;

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function SkillList({ title, emptyMessage, skills, onDelete, deletingSkill }) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">{title === "Skills I Can Teach" ? "Share your expertise" : "Build your learning list"}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-semibold text-slate-400">
          {skills.length}/{limits}
        </span>
      </div>

      {skills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-center text-sm leading-6 text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {skills.map((skill) => (
            <div key={`${title}-${skill.name}`} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white">{skill.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-violet-200">{skill.category}</span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-1">{skill.level}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(skill.name)}
                  disabled={deletingSkill === skill.name}
                  aria-label={`Delete ${skill.name}`}
                  className="shrink-0 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
              {skill.description && <p className="mt-3 text-sm leading-6 text-slate-400">{skill.description}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SkillManager({ user, onRefresh }) {
  const [modalType, setModalType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const offeredSkills = user?.skillsOffered || [];
  const wantedSkills = user?.skillsWanted || [];

  const openModal = (type) => {
    setError("");
    setSuccess("");
    setModalType(type);
  };

  const handleAdd = async (skill) => {
    setSaving(true);
    setError("");
    try {
      if (modalType === "offered") {
        await userService.addOfferedSkill(skill);
      } else {
        await userService.addWantedSkill(skill);
      }
      await onRefresh();
      setModalType(null);
      setSuccess(`${skill.name} added successfully.`);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Unable to add this skill right now."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type, name) => {
    setDeletingSkill(`${type}:${name}`);
    setError("");
    setSuccess("");
    try {
      if (type === "offered") {
        await userService.removeOfferedSkill(name);
      } else {
        await userService.removeWantedSkill(name);
      }
      await onRefresh();
      setSuccess(`${name} removed successfully.`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to remove this skill right now."));
    } finally {
      setDeletingSkill("");
    }
  };

  const atLimit = modalType === "offered" ? offeredSkills.length >= limits : wantedSkills.length >= limits;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/45 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="page-eyebrow">My skills</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Shape your skill exchange profile</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Tell the community what you can teach and what you want to learn next.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => openModal("offered")} className="primary-button"><FiBookOpen /> Add teaching skill</button>
          <button type="button" onClick={() => openModal("wanted")} className="primary-button border-emerald-400/20 bg-emerald-600/80 hover:bg-emerald-500"><FiTarget /> Add learning goal</button>
        </div>
      </div>

      {success && <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}
      {error && !modalType && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-2">
        <SkillList title="Skills I Can Teach" emptyMessage="You haven't added any skills you can teach yet." skills={offeredSkills} onDelete={(name) => handleDelete("offered", name)} deletingSkill={deletingSkill.replace("offered:", "")} />
        <SkillList title="Skills I Want to Learn" emptyMessage="You haven't added any skills you want to learn yet." skills={wantedSkills} onDelete={(name) => handleDelete("wanted", name)} deletingSkill={deletingSkill.replace("wanted:", "")} />
      </div>

      {modalType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Add skill">
          <div className="relative w-full max-w-xl">
            <button type="button" onClick={() => setModalType(null)} aria-label="Close add skill form" className="absolute right-4 top-4 z-10 rounded-xl border border-white/10 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700"><FiX /></button>
            {atLimit ? (
              <div className="rounded-[28px] border border-amber-400/20 bg-slate-900 p-8 text-center shadow-2xl">
                <h2 className="text-xl font-semibold text-white">Skill limit reached</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">You can list a maximum of 10 {modalType} skills. Remove one before adding another.</p>
                <button type="button" onClick={() => setModalType(null)} className="primary-button mt-6">Close</button>
              </div>
            ) : (
              <SkillForm
                onSubmit={handleAdd}
                title={modalType === "offered" ? "Add a skill you can teach" : "Add a skill you want to learn"}
                description={modalType === "offered" ? "Help others discover the experience you can share." : "Keep track of the next skill you want to develop."}
                loading={saving}
                error={error}
                onCancel={() => setModalType(null)}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default SkillManager;
