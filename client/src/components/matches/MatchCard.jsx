import { FiCheck, FiX, FiSend } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function MatchCard({ match, onAccept, onReject, onCancel }) {
  const otherUser = (match.sender?.id || match.sender?._id) === match.currentUser ? match.receiver : match.sender;
  const navigate = useNavigate();

  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_70px_-34px_rgba(0,0,0,0.95)] transition hover:border-violet-400/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{otherUser?.name}</h2>
          <p className="mt-1 text-sm text-slate-400">{otherUser?.location || "Location not added"}</p>
        </div>
        <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
          {match.status}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-slate-300">
        <span>Skill exchange opportunity</span>
        <span className="text-violet-300">Ready to connect</span>
      </div>

      {match.status === "pending" && match.type === "received" && (
        <div className="mt-6 flex gap-3">
          <button onClick={() => onAccept(match.id || match._id)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
            <FiCheck /> Accept
          </button>
          <button onClick={() => onReject(match.id || match._id)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500">
            <FiX /> Reject
          </button>
        </div>
      )}

      {match.status === "pending" && match.type === "sent" && (
        <button onClick={() => onCancel(match.id || match._id)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20">
          <FiSend /> Cancel Request
        </button>
      )}

      {match.status === "accepted" && (
        <button
          onClick={() => navigate(`/reviews/${otherUser.id || otherUser._id}`, { state: { matchId: match.id || match._id } })}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#8b5cf6] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          <FiSend /> Leave Review
        </button>
      )}
    </div>
  );
}

export default MatchCard;