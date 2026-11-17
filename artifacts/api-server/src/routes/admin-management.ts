import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2/promise";
import {
  CreateDestinationBody,
  CreateDestinationResponse,
  ListAdminDestinationsResponse,
  ListAdminSiteContentResponse,
  ListAdminUsersResponse,
  SaveAdminSiteContentBody,
  SaveAdminSiteContentResponse,
  UpdateAdminUserBody,
  UpdateAdminUserParams,
  UpdateAdminUserResponse,
  UpdateDestinationBody,
  UpdateDestinationParams,
  UpdateDestinationResponse,
} from "@workspace/api-zod";
import { executeSql, selectRows, type SqlParameter } from "../lib/mysql";
import { requireAdmin } from "../middleware/admin-auth";

const router: IRouter = Router();

interface AdminUserRow extends RowDataPacket {
  id: number | string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: number | boolean;
  createdAt: string;
}

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
  heroImages: string[] | string | null;
  heroMode: string;
  isPublished: number | boolean;
  updatedAt: string;
}

const adminUserSelect = `
  SELECT id, name, email, phone, role,
         is_active AS isActive,
         DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt
  FROM users
`;

const destinationSelect = `
  SELECT id, name, slug, summary, description,
         image_url AS imageUrl,
         is_featured AS isFeatured,
         is_published AS isPublished
  FROM destinations
`;

const siteContentSelect = `
  SELECT page_key AS pageKey,
         page_title AS pageTitle,
         hero_title AS heroTitle,
         hero_subtitle AS heroSubtitle,
         seo_description AS seoDescription,
         body_content AS bodyContent,
         hero_image_url AS heroImageUrl,
         hero_images AS heroImages,
         hero_mode AS heroMode,
         is_published AS isPublished,
         DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updatedAt
  FROM site_content
`;

function userResponse(row: AdminUserRow) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
  };
}

function destinationResponse(row: DestinationRow) {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    imageUrl: row.imageUrl,
    isFeatured: Boolean(row.isFeatured),
    isPublished: Boolean(row.isPublished),
  };
}

function siteContentResponse(row: SiteContentRow) {
  let heroImages: string[] = []
  if (Array.isArray(row.heroImages)) {
    heroImages = row.heroImages.filter((value): value is string => typeof value === 'string')
  } else if (typeof row.heroImages === 'string') {
    try {
      const parsed: unknown = JSON.parse(row.heroImages)
      if (Array.isArray(parsed)) {
        heroImages = parsed.filter((value): value is string => typeof value === 'string')
      }
    } catch {
      heroImages = []
    }
  }
  return {
    pageKey: row.pageKey,
    pageTitle: row.pageTitle,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    seoDescription: row.seoDescription,
    bodyContent: row.bodyContent,
    heroImageUrl: row.heroImageUrl,
    heroImages,
    heroMode: row.heroMode === 'slideshow' ? 'slideshow' : 'static',
    isPublished: Boolean(row.isPublished),
    updatedAt: row.updatedAt,
  };
}

router.get(
  "/admin/users",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await selectRows<AdminUserRow>(
      `${adminUserSelect}
       WHERE role = 'customer'
       ORDER BY created_at DESC
       LIMIT 500`,
    );
    res.json(ListAdminUsersResponse.parse(rows.map(userResponse)));
  },
);

router.patch(
  "/admin/users/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateAdminUserParams.safeParse(req.params);
    const body = UpdateAdminUserBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    await executeSql(
      `UPDATE users
       SET is_active = ?
       WHERE id = ? AND role = 'customer'`,
      [body.data.isActive, params.data.id],
    );
    const rows = await selectRows<AdminUserRow>(
      `${adminUserSelect}
       WHERE id = ? AND role = 'customer'
       LIMIT 1`,
      [params.data.id],
    );
    const user = rows[0];
    if (!user) {
      res.status(404).json({ error: "Customer account not found." });
      return;
    }
    res.json(UpdateAdminUserResponse.parse(userResponse(user)));
  },
);

router.get(
  "/admin/destinations",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await selectRows<DestinationRow>(
      `${destinationSelect}
       ORDER BY is_featured DESC, name ASC`,
    );
    res.json(
      ListAdminDestinationsResponse.parse(rows.map(destinationResponse)),
    );
  },
);

router.post(
  "/admin/destinations",
  requireAdmin,
  async (req, res): Promise<void> => {
    const body = CreateDestinationBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const input = body.data;
    const result = await executeSql(
      `INSERT INTO destinations
         (name, slug, summary, description, image_url, is_featured, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name.trim(),
        input.slug,
        input.summary?.trim() || null,
        input.description?.trim() || null,
        input.imageUrl?.trim() || null,
        input.isFeatured ?? false,
        input.isPublished,
      ],
    );
    const rows = await selectRows<DestinationRow>(
      `${destinationSelect} WHERE id = ? LIMIT 1`,
      [result.insertId],
    );
    res
      .status(201)
      .json(
        CreateDestinationResponse.parse(destinationResponse(rows[0])),
      );
  },
);

router.patch(
  "/admin/destinations/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateDestinationParams.safeParse(req.params);
    const body = UpdateDestinationBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const columns: Record<string, string> = {
      name: "name",
      slug: "slug",
      summary: "summary",
      description: "description",
      imageUrl: "image_url",
      isFeatured: "is_featured",
      isPublished: "is_published",
    };
    const assignments: string[] = [];
    const values: SqlParameter[] = [];
    for (const [key, value] of Object.entries(body.data)) {
      if (value === undefined) continue;
      const column = columns[key];
      if (!column) continue;
      assignments.push(`${column} = ?`);
      const normalizedValue =
        typeof value === "string" && key !== "slug"
          ? value.trim() || null
          : value;
      if (
        typeof normalizedValue === "string" ||
        typeof normalizedValue === "boolean" ||
        normalizedValue === null
      ) {
        values.push(normalizedValue);
      }
    }

    await executeSql(
      `UPDATE destinations SET ${assignments.join(", ")} WHERE id = ?`,
      [...values, params.data.id],
    );
    const rows = await selectRows<DestinationRow>(
      `${destinationSelect} WHERE id = ? LIMIT 1`,
      [params.data.id],
    );
    const destination = rows[0];
    if (!destination) {
      res.status(404).json({ error: "Destination not found." });
      return;
    }
    res.json(
      UpdateDestinationResponse.parse(destinationResponse(destination)),
    );
  },
);

router.get(
  "/admin/site-content",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await selectRows<SiteContentRow>(
      `${siteContentSelect} ORDER BY page_title ASC`,
    );
    res.json(
      ListAdminSiteContentResponse.parse(rows.map(siteContentResponse)),
    );
  },
);

router.put(
  "/admin/site-content",
  requireAdmin,
  async (req, res): Promise<void> => {
    const body = SaveAdminSiteContentBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const input = body.data;
    await executeSql(
      `INSERT INTO site_content
         (page_key, page_title, hero_title, hero_subtitle, seo_description,
          body_content, hero_image_url, hero_images, hero_mode, is_published, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         page_title = VALUES(page_title),
         hero_title = VALUES(hero_title),
         hero_subtitle = VALUES(hero_subtitle),
         seo_description = VALUES(seo_description),
         body_content = VALUES(body_content),
         hero_image_url = VALUES(hero_image_url),
         hero_images = VALUES(hero_images),
         hero_mode = VALUES(hero_mode),
         is_published = VALUES(is_published),
         updated_by = VALUES(updated_by)`,
      [
        input.pageKey,
        input.pageTitle.trim(),
        input.heroTitle?.trim() || null,
        input.heroSubtitle?.trim() || null,
        input.seoDescription?.trim() || null,
        input.bodyContent?.trim() || null,
        input.heroImageUrl?.trim() || null,
        JSON.stringify(input.heroImages ?? (input.heroImageUrl ? [input.heroImageUrl] : [])),
        input.heroMode ?? 'static',
        input.isPublished,
        req.adminIdentity?.userId ?? null,
      ],
    );
    const rows = await selectRows<SiteContentRow>(
      `${siteContentSelect} WHERE page_key = ? LIMIT 1`,
      [input.pageKey],
    );
    res.json(
      SaveAdminSiteContentResponse.parse(siteContentResponse(rows[0])),
    );
  },
);

export default router;
