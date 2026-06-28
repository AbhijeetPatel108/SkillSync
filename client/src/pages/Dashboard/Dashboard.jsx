import MainLayout from "../../layouts/MainLayout";

function Dashboard() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold">
        Welcome Back 👋
      </h1>

      <p className="text-slate-400 mt-2">
        This is your SkillSync dashboard.
      </p>
    </MainLayout>
  );
}

export default Dashboard;