import { useEffect, useState } from "react";

import skillService from "../../services/skillService";
import matchService from "../../services/matchService";
import SkillCard from "../../components/skills/SkillCard";
import SearchBar from "../../components/skills/SearchBar";
import FilterBar from "../../components/skills/FilterBar";
import Pagination from "../../components/skills/Pagination";

function Skills() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await skillService.getSkills({ search, category, level, page, limit: 8 });
      setUsers(res.users);
      setMeta(res.meta);
    } catch (err) {
      setUsers([]);
      setError(err.response?.data?.message || "Unable to load skill profiles right now.");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (id) => {
    try {
      await matchService.sendRequest(id);
      alert("Match request sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [search, category, level, page]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_70px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-300">Discover</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Find your next skill exchange</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">Search by expertise, filter by category, and connect with collaborators who match your learning goals.</p>
            </div>
            <div className="inline-flex w-fit rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">Explore curated talent with real-world expertise.</div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-slate-950/40 p-4 sm:p-5">
            <div className="space-y-4">
              <SearchBar value={search} onChange={(value) => { setPage(1); setSearch(value); }} />
              <FilterBar
                category={category}
                level={level}
                onCategoryChange={(value) => { setPage(1); setCategory(value); }}
                onLevelChange={(value) => { setPage(1); setLevel(value); }}
              />
            </div>
          </div>

          {loading ? (
            <div className="mt-16 rounded-[24px] border border-white/10 bg-slate-800/60 p-10 text-center text-slate-300">
              Loading talented profiles...
            </div>
          ) : error ? (
            <div className="mt-16 rounded-[24px] border border-rose-500/30 bg-rose-500/10 p-10 text-center text-rose-200">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="mt-16 rounded-[24px] border border-dashed border-slate-700 bg-slate-800/50 p-10 text-center text-slate-400">
              No profiles match the current filters. Try widening your search.
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {users.map((user) => (
                  <SkillCard key={user._id || user.id} user={user} onSendRequest={sendRequest} />
                ))}
              </div>
              <Pagination meta={meta} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Skills;