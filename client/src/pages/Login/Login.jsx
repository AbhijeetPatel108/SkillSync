import { useState } from "react";
import { FiArrowRight, FiLock, FiMail, FiStar } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.2),_transparent_35%),#080a12] px-4 py-10">
      <div className="w-full max-w-[450px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-[0_30px_100px_-20px_rgba(76,29,149,0.7)] backdrop-blur-xl">
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#8b5cf6] to-[#4338ca] px-6 py-7 text-center sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg shadow-violet-900/20">
            <FiStar size={26} />
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-violet-100/90">Continue building your SkillSync network.</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="min-h-0">
          {error && (
            <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-200">
              {error}
            </div>
          )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-11 pr-4 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-11 pr-4 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#8b5cf6] px-4 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Login"}
              {!loading && <FiArrowRight />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium text-violet-300 transition hover:text-violet-200">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;