import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import ReviewCard from "../../components/reviews/ReviewCard";
import ReviewForm from "../../components/reviews/ReviewForm";
import reviewService from "../../services/reviewService";

function Reviews() {
  const { userId } = useParams();
  const location = useLocation();
  const matchId = location.state?.matchId;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await reviewService.getReviews(userId);
      setReviews(res.reviews || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadReviews();
    }
  }, [userId]);

  const submitReview = async (data) => {
    try {
      await reviewService.createReview({
        ...data,
        revieweeId: userId,
        matchId,
      });
      alert("Review submitted successfully!");
      loadReviews();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_70px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-300">Community</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Reviews</h1>
              <p className="mt-2 text-sm leading-7 text-slate-400">Share feedback and keep the SkillSync experience trustworthy for everyone.</p>
            </div>
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">Your reputation matters.</div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <ReviewForm onSubmit={submitReview} />

            <div>
              {loading ? (
                <div className="rounded-[24px] border border-white/10 bg-slate-800/60 p-10 text-center text-slate-300">
                  Loading reviews...
                </div>
              ) : error ? (
                <div className="rounded-[24px] border border-rose-500/30 bg-rose-500/10 p-10 text-center text-rose-200">
                  {error}
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-700 bg-slate-800/50 p-10 text-center text-slate-400">
                  No reviews yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id || review._id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reviews;