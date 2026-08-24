import { FaStar } from "react-icons/fa";

function RatingStars({
  rating = 0,
  editable = false,
  onChange,
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!editable}
          onClick={() => editable && onChange(star)}
          className={editable ? "cursor-pointer" : "cursor-default"}
        >
          <FaStar
            className={`text-xl transition ${
              star <= rating
                ? "text-yellow-400"
                : "text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default RatingStars;