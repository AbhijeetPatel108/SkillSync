import { useEffect, useState } from "react";

import skillService from "../../services/skillService";
import matchService from "../../services/matchService";
import SkillCard from "../../components/skills/SkillCard";
import SearchBar from "../../components/skills/SearchBar";
import FilterBar from "../../components/skills/FilterBar";
import Pagination from "../../components/skills/Pagination";
import SkillManager from "../../components/skills/SkillManager";
import userService from "../../services/userService";

function Skills() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [userName, setUserName] = useState("");
  const [location, setLocation] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await skillService.getSkills({ search, userName, category, level, location, sort, page, limit: 8 });
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

  const fetchProfile = async () => {
    try {
      const res = await userService.getMyProfile();
      setProfile(res.user);
    } catch (err) {
      setProfileError(err.response?.data?.message || "Unable to load your skill profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [search, userName, category, level, location, sort, page]);

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="page-container">
      <div className="page-panel p-5 sm:p-8">
          {profileLoading ? (
            <div className="mb-8 rounded-2xl border border-white/10 bg-slate-950/30 p-6 text-sm text-slate-400">Loading your skill profile...</div>
          ) : profileError ? (
            <div className="mb-8 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">{profileError}</div>
          ) : (
            <div className="mb-8">
              <SkillManager user={profile} onRefresh={fetchProfile} />
            </div>
          )}
          <div className="page-header">
            <div>
              <p className="page-eyebrow">Discover</p>
              <h1 className="page-title">Find your next skill exchange</h1>
              <p className="page-subtitle">Search by expertise, filter by category, and connect with collaborators who match your learning goals.</p>
            </div>
            <div className="surface w-fit px-4 py-3 text-sm text-violet-200">Explore curated talent with real-world expertise.</div>
          </div>

          <div className="surface p-4 sm:p-5">
            <div className="space-y-4">
              <SearchBar value={search} onChange={(value) => { setPage(1); setSearch(value); }} />
              <FilterBar
                category={category}
                level={level}
                sort={sort}
                userName={userName}
                location={location}
                onCategoryChange={(value) => { setPage(1); setCategory(value); }}
                onLevelChange={(value) => { setPage(1); setLevel(value); }}
                onSortChange={(value) => { setPage(1); setSort(value); }}
                onUserNameChange={(value) => { setPage(1); setUserName(value); }}
                onLocationChange={(value) => { setPage(1); setLocation(value); }}
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
  );
}

export default Skills;