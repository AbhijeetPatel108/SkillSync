import { Navigate } from "react-router-dom";
import { FiLoader } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-slate-900/80 px-8 py-7 shadow-[0_30px_100px_-30px_rgba(37,99,235,0.7)] backdrop-blur-xl">
          <FiLoader className="animate-spin text-violet-300" size={28} />
          <div className="text-center">
            <p className="text-lg font-semibold text-white">Loading your workspace</p>
            <p className="mt-1 text-sm text-slate-400">Checking your session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;