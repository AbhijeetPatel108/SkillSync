import { FiSun, FiTrendingUp } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

function WelcomeBanner() {
  const { user } = useAuth();

  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
  }

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#7C3AED] via-[#6d28d9] to-[#312e81] p-6 shadow-[0_20px_70px_-24px_rgba(0,0,0,0.95)] sm:p-8">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-slate-950/20 blur-3xl" />

      <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-yellow-300">
              <FiSun className="text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {greeting}, <span className="text-yellow-300">{user?.name?.split(" ")[0] || "Learner"}</span> 👋
              </h1>
              <p className="mt-2 text-sm leading-6 text-violet-100 sm:text-base">
                Ready to learn, teach, and grow your skills today?
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-[260px] rounded-[24px] border border-white/15 bg-slate-950/20 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <FiTrendingUp className="text-emerald-300" size={24} />
            <span className="text-lg font-semibold text-white">Weekly Progress</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm text-white">
                <span>Profile Completion</span>
                <span>85%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/20">
                <div className="h-2 w-[85%] rounded-full bg-emerald-400" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm text-white">
                <span>Weekly Goal</span>
                <span>4 / 5</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/20">
                <div className="h-2 w-[80%] rounded-full bg-amber-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeBanner;