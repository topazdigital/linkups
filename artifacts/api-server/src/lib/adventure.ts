import type { RowDataPacket } from "mysql2/promise";

export interface AdventureRow extends RowDataPacket {
  id: number | string;
  slug: string;
  title: string;
  category: string;
  durationDays: number;
  durationNights: number;
  price: number | string;
  description: string | null;
  heroImageUrl: string | null;
  isFeatured: number | boolean;
  isPublished: number | boolean;
}

export function adventureResponse(row: AdventureRow) {
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    category: row.category,
    durationDays: Number(row.durationDays),
    durationNights: Number(row.durationNights),
    price: Number(row.price),
    description: row.description,
    heroImageUrl: row.heroImageUrl,
    isFeatured: Boolean(row.isFeatured),
    isPublished: Boolean(row.isPublished),
  };
}

export const adventureColumns = `
  id,
  slug,
  title,
  category,
  duration_days AS durationDays,
  duration_nights AS durationNights,
  price,
  description,
  hero_image_url AS heroImageUrl,
  is_featured AS isFeatured,
  is_published AS isPublished
`;
