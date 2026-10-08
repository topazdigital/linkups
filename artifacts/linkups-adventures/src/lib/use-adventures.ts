import { useEffect, useState } from "react";
import type { Adventure } from "@workspace/api-client-react";
import { ApiRequestError, getPublicAdventures } from "./api";

export function useAdventures() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    getPublicAdventures()
      .then((items) => {
        if (mounted) setAdventures(items);
      })
      .catch((reason: unknown) => {
        if (!mounted) return;
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

  return { adventures, loading, error };
}
