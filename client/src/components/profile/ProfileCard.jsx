import { FiAward, FiMapPin, FiMail, FiStar } from "react-icons/fi";

import SkillBadge from "./SkillBadge";

function ProfileCard({ user, onDeleteSkill }) {
  const featuredSkill = user.skillsOffered?.[0]?.name || "collaboration";

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/70 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      <div className="h-36 bg-gradient-to-r from-[#7C3AED] via-[#8b5cf6] to-[#4338ca]" />

      <div className="px-5 pb-6 sm:px-7 lg:px-8">
        <div className="-mt-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative">
              <img
                src={user.avatar || "https://i.pravatar.cc/200?img=12"}
                alt={user.name}
                className="h-28 w-28 rounded-full border-4 border-slate-900 object-cover shadow-lg sm:h-32 sm:w-32"
              />
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-slate-900 bg-emerald-400" />
            </div>

            <div className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">{user.name}</h2>
                <span className="rounded-full border border-violet-400/40 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-violet-200">
                  Verified
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-3 py-1.5">
                  <FiMail size={14} />
                  {user.email}
                </span>
                <span className="flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1.5">
                  <FiMapPin size={14} />
                  {user.location || "Location not added"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Currently spotlighting <span className="font-medium text-slate-200">{featuredSkill}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-center shadow-lg shadow-violet-950/20">
            <div className="mb-1 flex justify-center text-violet-200">
              <FiStar size={18} />
            </div>
            <h3 className="text-2xl font-semibold text-white">{user.averageRating?.toFixed(1) || "0.0"}</h3>
            <p className="text-sm text-violet-100/80">Average rating</p>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-white/10 bg-slate-800/70 p-5 shadow-inner shadow-black/20">
          <div className="mb-3 flex items-center gap-2 text-white">
            <FiStar />
            <h3 className="text-lg font-semibold">About</h3>
          </div>
          <p className="leading-7 text-slate-300">{user.bio || "No bio added yet."}</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-4 text-center transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-slate-800">
            <h3 className="text-2xl font-semibold text-violet-300">{user.skillsOffered?.length || 0}</h3>
            <p className="mt-1 text-sm text-slate-400">Skills offered</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-4 text-center transition duration-300 hover:-translate-y-0.5 hover:border-amber-400/30 hover:bg-slate-800">
            <h3 className="text-2xl font-semibold text-amber-300">{user.totalReviews || 0}</h3>
            <p className="mt-1 text-sm text-slate-400">Reviews</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-center transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/15">
            <div className="mb-2 flex justify-center text-emerald-300">
              <FiAward size={20} />
            </div>
            <p className="font-semibold text-emerald-200">Active</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-white">Skills Offered</h3>
            <span className="text-sm text-slate-400">{user.skillsOffered?.length || 0} listed</span>
          </div>

          {user.skillsOffered?.length ? (
            <div className="flex flex-wrap gap-3">
              {user.skillsOffered.map((skill, index) => (
                <SkillBadge key={index} skill={skill} onDelete={onDeleteSkill} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/50 p-6 text-center text-slate-400">
              No skills added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;