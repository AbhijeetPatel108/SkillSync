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
    <div className="page-container">
      <div className="page-panel p-5 sm:p-8">
          <div className="page-header">
            <div>
              <p className="page-eyebrow">Community</p>
              <h1 className="page-title">Reviews</h1>
              <p className="page-subtitle">Share feedback and keep the SkillSync experience trustworthy for everyone.</p>
            </div>
            <div className="surface w-fit px-4 py-3 text-sm text-violet-200">Your reputation matters.</div>
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
  );
}

export default Reviews;