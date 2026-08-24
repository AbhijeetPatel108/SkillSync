import { FaStar } from "react-icons/fa";

function RatingStars({ rating = 0, editable = false, onChange }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!editable}
          onClick={() => editable && onChange(star)}
          className={editable ? "cursor-pointer transition hover:scale-110" : "cursor-default"}
          aria-label={`Rate ${star} out of 5`}
        >
          <FaStar
            className={`text-xl ${
              star <= rating ? "text-yellow-400" : "text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default RatingStars;