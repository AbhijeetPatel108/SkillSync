import {
  FiBookOpen,
  FiUsers,
  FiStar,
  FiMessageCircle,
  FiArrowRight,
  FiUser,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import ActivityCard from "../../components/dashboard/ActivityCard";
import StatCard from "../../components/dashboard/StatCard";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";

function Dashboard() {
  const navigate = useNavigate();

  const activities = [
    {
      title: "Alex accepted your match request",
      time: "2 minutes ago",
      icon: "🤝",
    },
    {
      title: "Sarah reviewed your profile",
      time: "1 hour ago",
      icon: "⭐",
    },
    {
      title: "New chat message received",
      time: "Today",
      icon: "💬",
    },
  ];

  const actions = [
    {
      title: "Browse Skills",
      description: "Discover skills to learn",
      icon: <FiBookOpen size={20} />,
      path: "/skills",
    },
    {
      title: "View Matches",
      description: "Review your connections",
      icon: <FiUsers size={20} />,
      path: "/matches",
    },
    {
      title: "Messages",
      description: "Continue your conversations",
      icon: <FiMessageCircle size={20} />,
      path: "/messages",
    },
    {
      title: "My Profile",
      description: "Keep your profile current",
      icon: <FiUser size={20} />,
      path: "/profile",
    },
  ];

  return (
    <div className="page-container">
      <div className="space-y-8">
        <WelcomeBanner />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="My Skills" value={12} color="text-violet-300" icon={<FiBookOpen />} subtitle="+3 this week" accent="from-violet-500/20 to-violet-500/5" barColor="bg-violet-300" />
          <StatCard title="Matches" value={8} color="text-emerald-300" icon={<FiUsers />} subtitle="+2 today" accent="from-emerald-500/20 to-emerald-500/5" barColor="bg-emerald-300" />
          <StatCard title="Reviews" value={19} color="text-amber-300" icon={<FiStar />} subtitle="4.9 average rating" accent="from-amber-500/20 to-amber-500/5" barColor="bg-amber-300" />
          <StatCard title="Messages" value={34} color="text-pink-300" icon={<FiMessageCircle />} subtitle="5 unread" accent="from-pink-500/20 to-pink-500/5" barColor="bg-pink-300" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
          <section className="page-panel p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-300">Activity</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Recent Activity</h2>
              </div>
              <button className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20">
                View All
                <FiArrowRight />
              </button>
            </div>

            <div className="space-y-3">
              {activities.map((activity, index) => (
                <ActivityCard key={index} activity={activity} />
              ))}
            </div>
          </section>

          <section className="page-panel p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-300">Quick start</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Quick Actions</h2>
            </div>

            <div className="space-y-3">
              {actions.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="group flex min-h-[76px] w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-slate-800"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200 transition group-hover:bg-violet-500/25">
                    {action.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block font-semibold text-white">{action.title}</span>
                    <span className="mt-1 block text-xs text-slate-400">{action.description}</span>
                  </div>
                  <FiArrowRight className="shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-violet-200" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;