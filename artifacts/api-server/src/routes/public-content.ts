import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2/promise";
import {
  GetPublicSiteContentParams,
  GetPublicSiteContentResponse,
  ListPublicDestinationsResponse,
} from "@workspace/api-zod";
import { selectRows } from "../lib/mysql";

const router: IRouter = Router();

interface DestinationRow extends RowDataPacket {
  id: number | string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  imageUrl: string | null;
  isFeatured: number | boolean;
  isPublished: number | boolean;
}

interface SiteContentRow extends RowDataPacket {
  pageKey: string;
  pageTitle: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  seoDescription: string | null;
  bodyContent: string | null;
  heroImageUrl: string | null;
  isPublished: number | boolean;
  updatedAt: string;
}

router.get("/destinations", async (_req, res): Promise<void> => {
  const rows = await selectRows<DestinationRow>(
    `SELECT id, name, slug, summary, description,
            image_url AS imageUrl,
            is_featured AS isFeatured,
            is_published AS isPublished
     FROM destinations
     WHERE is_published = TRUE
     ORDER BY is_featured DESC, name ASC`,
  );
  res.json(
    ListPublicDestinationsResponse.parse(
      rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        slug: row.slug,
        summary: row.summary,
        description: row.description,
        imageUrl: row.imageUrl,
        isFeatured: Boolean(row.isFeatured),
        isPublished: Boolean(row.isPublished),
      })),
    ),
  );
});

router.get(
  "/site-content/:pageKey",
  async (req, res): Promise<void> => {
    const params = GetPublicSiteContentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const rows = await selectRows<SiteContentRow>(
      `SELECT page_key AS pageKey,
              page_title AS pageTitle,
              hero_title AS heroTitle,
              hero_subtitle AS heroSubtitle,
              seo_description AS seoDescription,
              body_content AS bodyContent,
              hero_image_url AS heroImageUrl,
              is_published AS isPublished,
              DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updatedAt
       FROM site_content
       WHERE page_key = ? AND is_published = TRUE
       LIMIT 1`,
      [params.data.pageKey],
    );
    const content = rows[0];
    if (!content) {
      res.status(404).json({ error: "Published page content not found." });
      return;
    }
    res.json(
      GetPublicSiteContentResponse.parse({
        ...content,
        isPublished: Boolean(content.isPublished),
      }),
    );
  },
);

export default router;
