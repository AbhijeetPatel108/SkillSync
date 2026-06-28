import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;