import { useState } from "react";
import RatingStars from "./RatingStars";

function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({ rating, comment });

    setRating(5);
    setComment("");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_70px_-34px_rgba(0,0,0,0.95)]">
      <h2 className="mb-6 text-xl font-semibold text-white">Write a Review</h2>

      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-slate-300">Rating</p>
        <RatingStars rating={rating} editable onChange={setRating} />
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">Comment</label>
        <textarea
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#8b5cf6] py-3 font-semibold text-white transition hover:-translate-y-0.5">
        Submit Review
      </button>
    </form>
  );
}

export default ReviewForm;