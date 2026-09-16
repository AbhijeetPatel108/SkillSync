import { FiSun, FiTrendingUp } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

function WelcomeBanner() {
  const { user } = useAuth();

  const hour = new Date().getHours();
  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#6546d7] via-[#4932a5] to-[#252453] p-6 shadow-[0_20px_70px_-24px_rgba(0,0,0,0.95)] sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-slate-950/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-yellow-300 shadow-lg shadow-violet-950/20">
              <FiSun className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-100/80">Overview</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {greeting}, <span className="text-yellow-300">{user?.name?.split(" ")[0] || "Learner"}</span> 👋
              </h1>
              <p className="mt-2 text-sm leading-6 text-violet-100 sm:text-base">
                Ready to learn, teach, and grow with your network today?
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm rounded-[24px] border border-white/15 bg-slate-950/20 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <FiTrendingUp size={18} />
            </div>
            <span className="text-lg font-semibold text-white">Weekly Progress</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm text-white">
                <span>Profile Completion</span>
                <span>85%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[85%] rounded-full bg-emerald-400" />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm text-white">
                <span>Weekly Goal</span>
                <span>4 / 5</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[80%] rounded-full bg-amber-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeBanner;