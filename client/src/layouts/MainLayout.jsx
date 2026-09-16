import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

function MainLayout({ children }) {
  return (
    <div className="app-shell text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;