"use client";

import { useState } from "react";

interface StarRatingProps {
  tripId: string;
  onSubmitted: () => void;
}

export default function StarRating({ tripId, onSubmitted }: StarRatingProps) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          stars,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(onSubmitted, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit rating");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-black/40 rounded-lg p-4 border border-emerald-500/20 text-center animate-in fade-in duration-300">
        <p className="text-emerald-400 text-sm font-bold">Thanks for your rating!</p>
        <div className="flex justify-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`text-lg ${i <= stars ? "opacity-100" : "opacity-20"}`}>
              ★
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 rounded-lg p-4 border border-white/10 space-y-3 animate-in fade-in duration-300">
      <p className="text-white/50 text-[10px] uppercase tracking-widest text-center">
        Rate your ride
      </p>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => setStars(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition-transform hover:scale-125 focus:outline-none"
          >
            <span
              className={
                i <= (hovered || stars)
                  ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                  : "text-white/15"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Leave a comment (optional)"
        maxLength={500}
        rows={2}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-white/20"
      />

      {error && (
        <p className="text-red-400 text-[11px] text-center">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={stars === 0 || submitting}
        className="w-full py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Submit Rating"}
      </button>
    </div>
  );
}
