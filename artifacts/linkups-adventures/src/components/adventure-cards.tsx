import { ArrowRight, Camera, MapPin, Waves } from "lucide-react";
import { Link } from "wouter";
import { formatKes } from "@/lib/api";
import { useAdventures } from "@/lib/use-adventures";

type AdventureCardsProps = {
  variant?: "package" | "adventure";
  limit?: number;
};

function durationLabel(days: number, nights: number): string {
  return `${days} day${days === 1 ? "" : "s"}${nights ? ` · ${nights} night${nights === 1 ? "" : "s"}` : ""}`;
}

export function AdventureCards({
  variant = "package",
  limit,
}: AdventureCardsProps) {
  const { adventures, loading, error } = useAdventures();
  const visible = limit ? adventures.slice(0, limit) : adventures;

  if (loading) {
    return (
      <div className="catalogue-message" role="status">
        Loading available adventures…
      </div>
    );
  }
  if (error) {
    return (
      <div className="catalogue-message" role="alert">
        <strong>Adventure listings are unavailable.</strong>
        <p>{error}</p>
        <Link className="text-link" href="/contact">
          Contact our team instead <ArrowRight />
        </Link>
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <div className="catalogue-message">
        No adventures are published yet. Contact us to plan a custom trip.
      </div>
    );
  }

  if (variant === "adventure") {
    return (
      <div className="adventure-grid">
        {visible.map((adventure, index) => (
          <article className="adventure-card" key={adventure.id}>
            <img
              src={adventure.heroImageUrl || "/images/adventure-hero.png"}
              alt={adventure.title}
            />
            <div className="adventure-card-body">
              <span className="card-icon">
                {index % 2 ? <Waves /> : <Camera />}
              </span>
              <h3>{adventure.title}</h3>
              <p>
                {durationLabel(adventure.durationDays, adventure.durationNights)}
                {" · "}
                {adventure.category}
              </p>
              <span className="card-location">
                <MapPin /> Kenya
              </span>
              <strong>From {formatKes(adventure.price)} per person</strong>
              <Link
                className="button orange small-button"
                href={`/adventures/${adventure.slug}`}
              >
                Explore <ArrowRight />
              </Link>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="package-grid">
      {visible.map((adventure) => (
        <article className="package-card" key={adventure.id}>
          <img
            src={adventure.heroImageUrl || "/images/adventure-hero.png"}
            alt={adventure.title}
          />
          <div className="package-body">
            <small>
              {durationLabel(adventure.durationDays, adventure.durationNights)}
              {" · "}
              {adventure.category}
            </small>
            <h3>{adventure.title}</h3>
            <strong>From {formatKes(adventure.price)} per person</strong>
            <Link
              className="button orange small"
              href={`/adventures/${adventure.slug}`}
            >
              View package <ArrowRight />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
