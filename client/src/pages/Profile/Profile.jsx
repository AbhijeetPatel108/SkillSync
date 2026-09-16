import { useEffect, useState } from "react";
import { FiEdit, FiStar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import ProfileCard from "../../components/profile/ProfileCard";
import userService from "../../services/userService";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const res = await userService.getMyProfile();
      setUser(res.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_45%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-slate-900/70 p-8 text-center shadow-[0_25px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/20">
            <FiStar size={24} />
          </div>
          <h2 className="text-2xl font-semibold text-white">Loading your profile</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Preparing your workspace and skill profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_45%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
      <div className="page-container">
        <div className="page-panel overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#6d28d9] to-[#312e81]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_45%)]" />
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-slate-950/20 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-violet-100/80">Profile hub</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.35rem]">My Profile</h1>
                  <p className="mt-3 text-sm leading-7 text-violet-50/90 sm:text-base">
                    Manage your skills, highlight your expertise, and keep your presence polished for collaborators.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/profile/edit")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg"
                >
                  <FiEdit />
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate("/skills")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg"
                >
                  Manage Skills
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/15 bg-slate-950/20 px-3 py-1.5 text-sm text-violet-50/90 backdrop-blur-sm">
                  Updated profile insights
                </span>
                <span className="rounded-full border border-white/15 bg-slate-950/20 px-3 py-1.5 text-sm text-violet-50/90 backdrop-blur-sm">
                  Skill discovery ready
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)] xl:items-start">
              <div className="transition-all duration-300 hover:-translate-y-1 xl:col-span-2">
                <ProfileCard user={user} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;