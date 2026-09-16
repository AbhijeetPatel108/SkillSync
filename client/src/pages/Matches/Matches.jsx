import { useEffect, useState } from "react";
import MatchTabs from "../../components/matches/MatchTabs";
import MatchCard from "../../components/matches/MatchCard";
import EmptyMatches from "../../components/matches/EmptyMatches";
import matchService from "../../services/matchService";
import { useAuth } from "../../context/AuthContext";

function Matches() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("received");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");

      let res;

      if (activeTab === "received") {
        res = await matchService.getReceived();
      } else if (activeTab === "sent") {
        res = await matchService.getSent();
      } else {
        res = await matchService.getAccepted();
      }

      const data = (res.matches || []).map((m) => ({
        ...m,
        currentUser: user?._id || user?.id,
        type: activeTab,
      }));

      setMatches(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your matches right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [activeTab]);

  const accept = async (id) => {
    await matchService.accept(id);
    loadMatches();
  };

  const reject = async (id) => {
    await matchService.reject(id);
    loadMatches();
  };

  const cancel = async (id) => {
    await matchService.cancel(id);
    loadMatches();
  };

  return (
    <div className="page-container">
      <div className="page-panel p-5 sm:p-8">
          <div className="page-header">
            <div>
              <p className="page-eyebrow">Connections</p>
              <h1 className="page-title">Matches</h1>
              <p className="page-subtitle">Review requests, manage conversations, and keep your collaboration pipeline moving.</p>
            </div>
            <div className="surface w-fit px-4 py-3 text-sm text-violet-200">Stay organized with your latest connections.</div>
          </div>

          <MatchTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {loading ? (
            <div className="mt-12 rounded-[24px] border border-white/10 bg-slate-800/60 p-10 text-center text-slate-300">
              Loading your matches...
            </div>
          ) : error ? (
            <div className="mt-12 rounded-[24px] border border-rose-500/30 bg-rose-500/10 p-10 text-center text-rose-200">
              {error}
            </div>
          ) : matches.length === 0 ? (
            <div className="mt-8">
              <EmptyMatches title="No Matches" message={`No ${activeTab} matches found.`} />
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {matches.map((match) => (
                <MatchCard key={match._id || match.id} match={match} onAccept={accept} onReject={reject} onCancel={cancel} />
              ))}
            </div>
          )}
        </div>
      </div>
  );
}

export default Matches;