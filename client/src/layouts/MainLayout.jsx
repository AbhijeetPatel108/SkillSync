import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.16),_transparent_32%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />

        <div className="flex flex-1 flex-col">
          <Navbar />

          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;