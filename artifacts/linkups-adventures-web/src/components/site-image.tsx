import type { ComponentProps } from "react";

const optimizedLocalImages: Record<string, string> = {
  "/images/about-founder.png": "/images/about-founder.webp",
  "/images/adventure-camp.png": "/images/adventure-camp.webp",
  "/images/adventure-coast.png": "/images/adventure-coast.webp",
  "/images/adventure-hero.png": "/images/adventure-hero.webp",
  "/images/adventure-mountain.png": "/images/adventure-mountain.webp",
  "/images/contact-hero.png": "/images/contact-hero.webp",
  "/images/group-travel-hero.png": "/images/group-travel-hero.webp",
  "/images/linkups-logo.png": "/images/linkups-logo.webp",
  "/images/trips/amboseli-wild-dash.jpg":
    "/images/trips/amboseli-wild-dash.webp",
  "/images/trips/amboseli-wild-horizons-2day.jpg":
    "/images/trips/amboseli-wild-horizons-2day.webp",
  "/images/trips/amboseli-wild-horizons-3day.jpg":
    "/images/trips/amboseli-wild-horizons-3day.webp",
  "/images/trips/coast-unleashed.jpg":
    "/images/trips/coast-unleashed.webp",
  "/images/trips/girls-naivasha-roadtrip.jpg":
    "/images/trips/girls-naivasha-roadtrip.webp",
  "/images/trips/kilimanjaro-sky-escape.jpg":
    "/images/trips/kilimanjaro-sky-escape.webp",
  "/images/trips/maasai-mara-villa-escape.jpg":
    "/images/trips/maasai-mara-villa-escape.webp",
  "/images/trips/mara-sky-escape.jpg": "/images/trips/mara-sky-escape.webp",
  "/images/trips/rapids-and-rush.jpg": "/images/trips/rapids-and-rush.webp",
  "/images/trips/samburu-overland.jpg": "/images/trips/samburu-overland.webp",
  "/images/trips/sky-safari-collection.jpg":
    "/images/trips/sky-safari-collection.webp",
  "/images/trips/skyhigh-paragliding.jpg":
    "/images/trips/skyhigh-paragliding.webp",
  "/images/trips/watamu-blue-bliss.jpg":
    "/images/trips/watamu-blue-bliss.webp",
};

export function optimizedImageUrl(source: string): string {
  if (!source) return source;

  try {
    const url = new URL(source, "https://linkups.local");
    const isLocalPath = source.startsWith("/");
    const isCurrentOrigin =
      typeof window !== "undefined" && url.origin === window.location.origin;
    const optimizedPath = optimizedLocalImages[url.pathname];

    if (optimizedPath && (isLocalPath || isCurrentOrigin)) {
      return `${optimizedPath}${url.search}${url.hash}`;
    }

    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("auto", "format");
      url.searchParams.set("q", "70");
      url.searchParams.set("w", "1100");
      return url.toString();
    }
  } catch {
    return source;
  }

  return source;
}

type SiteImageProps = ComponentProps<"img">;

export function SiteImage({
  src = "",
  loading = "lazy",
  decoding = "async",
  ...props
}: SiteImageProps) {
  return (
    <img
      {...props}
      src={optimizedImageUrl(src)}
      loading={loading}
      decoding={decoding}
    />
  );
}
