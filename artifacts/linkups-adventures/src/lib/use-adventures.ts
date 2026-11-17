import { useEffect, useState } from "react";
import type { Adventure } from "@workspace/api-client-react";
import { ApiRequestError, getPublicAdventures } from "./api";
import { tours } from "./tours";

function getPreviewAdventures(): Adventure[] {
  return tours.map((tour, index) => {
    const durationDays = Number(tour.detail.match(/(\d+)\s*day/i)?.[1] ?? 1);
    const durationNights = Number(tour.detail.match(/(\d+)\s*night/i)?.[1] ?? 0);
    const price = Number(
      tour.price.match(/KES\s*([\d,]+)/i)?.[1].replaceAll(",", "") ?? 0,
    );
    const category = tour.slug.includes("beach")
      ? "Beach escape"
      : tour.slug.includes("girls")
        ? "Group escape"
        : "Safari";

    return {
      id: index + 1,
      slug: tour.slug,
      title: tour.name,
      category,
      durationDays,
      durationNights,
      price,
      description: null,
      heroImageUrl: tour.image,
      isFeatured: true,
      isPublished: true,
    };
  });
}

const previewAdventures = getPreviewAdventures();

export function useAdventures() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    getPublicAdventures()
      .then((items) => {
        if (!mounted) return;
        if (items.length > 0) {
          setAdventures(items);
          return;
        }
        setAdventures(previewAdventures);
        setPreviewMessage(
          "Showing adventures from the imported site while no live listings are published.",
        );
      })
      .catch((reason: unknown) => {
        if (!mounted) return;
        if (
          reason instanceof ApiRequestError &&
          reason.status === 503 &&
          reason.message === "The database connection has not been configured."
        ) {
          setAdventures(previewAdventures);
          setPreviewMessage(
            "The database is not connected in this Replit preview, so the imported adventures are shown. Connect MySQL to manage live listings.",
          );
          return;
        }
        setError(
          reason instanceof ApiRequestError
            ? reason.message
            : "Adventures could not be loaded.",
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { adventures, loading, error, previewMessage };
}
