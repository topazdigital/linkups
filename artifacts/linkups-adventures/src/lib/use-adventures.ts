import { useEffect, useState } from "react";
import type { Adventure } from "@workspace/api-client-react";
import { ApiRequestError, getPublicAdventures } from "./api";
import { tours } from "./tours";

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
        setAdventures(tours);
        setPreviewMessage(
          "Showing the supplied trip catalogue while no live listings are published.",
        );
      })
      .catch((reason: unknown) => {
        if (!mounted) return;
        if (
          reason instanceof ApiRequestError &&
          reason.status === 503 &&
          reason.message === "The database connection has not been configured."
        ) {
          setAdventures(tours);
          setPreviewMessage(
            "The database is not connected in this Replit preview, so the supplied trip catalogue is shown. Connect MySQL to manage live listings.",
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
