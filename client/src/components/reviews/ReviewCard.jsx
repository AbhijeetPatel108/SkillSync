import RatingStars from "./RatingStars";

function ReviewCard({ review }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_70px_-34px_rgba(0,0,0,0.95)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{review.reviewer?.name}</h2>
          <p className="mt-1 text-sm text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
        </div>
        <RatingStars rating={review.rating} />
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{review.comment}</p>
    </div>
  );
}

export default ReviewCard;