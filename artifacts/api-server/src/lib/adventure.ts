import type { RowDataPacket } from "mysql2/promise";

export interface AdventureRow extends RowDataPacket {
  id: number | string;
  destinationId: number | string | null;
  destinationName: string | null;
  slug: string;
  title: string;
  category: string;
  durationDays: number;
  durationNights: number;
  price: number | string;
  priceUsd: number | string | null;
  pricingNote: string | null;
  description: string | null;
  tagline: string | null;
  accommodation: string | null;
  highlights: string[] | string | null;
  itinerary: { day: string; title: string; details: string[] }[] | string | null;
  included: string[] | string | null;
  excluded: string[] | string | null;
  optionalActivities: string[] | string | null;
  idealFor: string[] | string | null;
  heroImageUrl: string | null;
  galleryImageUrls: string[] | string | null;
  isFeatured: number | boolean;
  isPublished: number | boolean;
}

function jsonArray<T>(value: T[] | string | null): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function adventureResponse(row: AdventureRow) {
  return {
    id: Number(row.id),
    destinationId: row.destinationId === null ? null : Number(row.destinationId),
    destinationName: row.destinationName,
    slug: row.slug,
    title: row.title,
    category: row.category,
    durationDays: Number(row.durationDays),
    durationNights: Number(row.durationNights),
    price: Number(row.price),
    priceUsd: row.priceUsd === null ? null : Number(row.priceUsd),
    pricingNote: row.pricingNote,
    description: row.description,
    tagline: row.tagline,
    accommodation: row.accommodation,
    highlights: jsonArray<string>(row.highlights),
    itinerary: jsonArray<{ day: string; title: string; details: string[] }>(
      row.itinerary,
    ),
    included: jsonArray<string>(row.included),
    excluded: jsonArray<string>(row.excluded),
    optionalActivities: jsonArray<string>(row.optionalActivities),
    idealFor: jsonArray<string>(row.idealFor),
    heroImageUrl: row.heroImageUrl,
    galleryImageUrls: jsonArray<string>(row.galleryImageUrls),
    isFeatured: Boolean(row.isFeatured),
    isPublished: Boolean(row.isPublished),
  };
}

export const adventureColumns = `
  a.id,
  a.destination_id AS destinationId,
  d.name AS destinationName,
  a.slug,
  a.title,
  a.category,
  a.duration_days AS durationDays,
  a.duration_nights AS durationNights,
  a.price,
  a.price_usd AS priceUsd,
  a.pricing_note AS pricingNote,
  a.description,
  a.tagline,
  a.accommodation,
  a.highlights,
  a.itinerary,
  a.included,
  a.excluded,
  a.optional_activities AS optionalActivities,
  a.ideal_for AS idealFor,
  a.hero_image_url AS heroImageUrl,
  a.gallery_image_urls AS galleryImageUrls,
  a.is_featured AS isFeatured,
  a.is_published AS isPublished
`;
