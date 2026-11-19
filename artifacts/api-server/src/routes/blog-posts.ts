import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2/promise";
import {
  CreateBlogPostBody,
  CreateBlogPostResponse,
  GetPublicBlogPostParams,
  GetPublicBlogPostResponse,
  ListAdminBlogPostsResponse,
  ListPublicBlogPostsResponse,
  UpdateBlogPostBody,
  UpdateBlogPostParams,
  UpdateBlogPostResponse,
} from "@workspace/api-zod";
import { executeSql, selectRows } from "../lib/mysql";
import { requireAdmin } from "../middleware/admin-auth";

const router: IRouter = Router();

interface BlogPostRow extends RowDataPacket {
  id: number | string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  isPublished: number | boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const blogPostSelect = `
  SELECT
    id,
    slug,
    title,
    category,
    excerpt,
    body_content AS content,
    cover_image_url AS coverImageUrl,
    is_published AS isPublished,
    DATE_FORMAT(published_at, '%Y-%m-%dT%H:%i:%s.000Z') AS publishedAt,
    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt,
    DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updatedAt
  FROM blog_posts
`;

function blogPostResponse(row: BlogPostRow) {
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.coverImageUrl,
    isPublished: Boolean(row.isPublished),
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findBlogPost(id: number): Promise<BlogPostRow | undefined> {
  const rows = await selectRows<BlogPostRow>(
    `${blogPostSelect} WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0];
}

router.get("/blog-posts", async (_req, res): Promise<void> => {
  const rows = await selectRows<BlogPostRow>(
    `${blogPostSelect}
     WHERE is_published = TRUE
     ORDER BY published_at DESC, id DESC`,
  );
  res.json(ListPublicBlogPostsResponse.parse(rows.map(blogPostResponse)));
});

router.get(
  "/blog-posts/:slug",
  async (req, res): Promise<void> => {
    const params = GetPublicBlogPostParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const rows = await selectRows<BlogPostRow>(
      `${blogPostSelect}
       WHERE slug = ? AND is_published = TRUE
       LIMIT 1`,
      [params.data.slug],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Published blog post not found." });
      return;
    }
    res.json(GetPublicBlogPostResponse.parse(blogPostResponse(rows[0])));
  },
);

router.get(
  "/admin/blog-posts",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await selectRows<BlogPostRow>(
      `${blogPostSelect}
       ORDER BY is_published DESC, updated_at DESC, id DESC`,
    );
    res.json(ListAdminBlogPostsResponse.parse(rows.map(blogPostResponse)));
  },
);

router.post(
  "/admin/blog-posts",
  requireAdmin,
  async (req, res): Promise<void> => {
    const body = CreateBlogPostBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const input = body.data;
    const result = await executeSql(
      `INSERT INTO blog_posts
         (slug, title, category, excerpt, body_content, cover_image_url,
          is_published, published_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, IF(?, CURRENT_TIMESTAMP, NULL), ?)`,
      [
        input.slug.trim().toLowerCase(),
        input.title.trim(),
        input.category.trim(),
        input.excerpt.trim(),
        input.content.trim(),
        input.coverImageUrl.trim(),
        input.isPublished,
        input.isPublished,
        req.adminIdentity?.userId ?? null,
      ],
    );
    const post = await findBlogPost(Number(result.insertId));
    if (!post) {
      res.status(500).json({ error: "The blog post could not be loaded after saving." });
      return;
    }
    res.status(201).json(CreateBlogPostResponse.parse(blogPostResponse(post)));
  },
);

router.patch(
  "/admin/blog-posts/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateBlogPostParams.safeParse(req.params);
    const body = UpdateBlogPostBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const input = body.data;
    await executeSql(
      `UPDATE blog_posts
       SET slug = ?,
           title = ?,
           category = ?,
           excerpt = ?,
           body_content = ?,
           cover_image_url = ?,
           is_published = ?,
           published_at = IF(?, COALESCE(published_at, CURRENT_TIMESTAMP), NULL),
           updated_by = ?
       WHERE id = ?`,
      [
        input.slug.trim().toLowerCase(),
        input.title.trim(),
        input.category.trim(),
        input.excerpt.trim(),
        input.content.trim(),
        input.coverImageUrl.trim(),
        input.isPublished,
        input.isPublished,
        req.adminIdentity?.userId ?? null,
        params.data.id,
      ],
    );
    const post = await findBlogPost(params.data.id);
    if (!post) {
      res.status(404).json({ error: "Blog post not found." });
      return;
    }
    res.json(UpdateBlogPostResponse.parse(blogPostResponse(post)));
  },
);

export default router;
