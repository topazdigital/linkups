import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2/promise";
import {
  CreateEventBody,
  CreateEventResponse,
  ListAdminEventsResponse,
  ListPublicEventsResponse,
  UpdateEventBody,
  UpdateEventParams,
  UpdateEventResponse,
} from "@workspace/api-zod";
import { executeSql, selectRows, type SqlParameter } from "../lib/mysql";
import { requireAdmin } from "../middleware/admin-auth";

const router: IRouter = Router();

interface EventRow extends RowDataPacket {
  id: number | string;
  slug: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  priceLabel: string | null;
  heroImageUrl: string | null;
  isPublished: number | boolean;
  createdAt: string;
  updatedAt: string;
}

const eventSelect = `
  SELECT
    id,
    slug,
    title,
    description,
    DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
    location,
    price_label AS priceLabel,
    hero_image_url AS heroImageUrl,
    is_published AS isPublished,
    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt,
    DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updatedAt
  FROM events
`;

function eventResponse(row: EventRow) {
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    eventDate: row.eventDate,
    location: row.location,
    priceLabel: row.priceLabel,
    heroImageUrl: row.heroImageUrl,
    isPublished: Boolean(row.isPublished),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findEvent(id: number): Promise<EventRow | undefined> {
  const rows = await selectRows<EventRow>(
    `${eventSelect}
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0];
}

function isValidEventDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

router.get("/events", async (_req, res): Promise<void> => {
  const rows = await selectRows<EventRow>(
    `${eventSelect}
     WHERE is_published = TRUE
       AND event_date >= CURRENT_DATE
     ORDER BY event_date ASC, title ASC`,
  );
  res.json(ListPublicEventsResponse.parse(rows.map(eventResponse)));
});

router.get(
  "/admin/events",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await selectRows<EventRow>(
      `${eventSelect}
       ORDER BY event_date >= CURRENT_DATE DESC, event_date ASC, title ASC`,
    );
    res.json(ListAdminEventsResponse.parse(rows.map(eventResponse)));
  },
);

router.post(
  "/admin/events",
  requireAdmin,
  async (req, res): Promise<void> => {
    const body = CreateEventBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const input = body.data;
    if (!isValidEventDate(input.eventDate)) {
      res.status(400).json({ error: "Choose a valid event date." });
      return;
    }
    if (
      !input.slug.trim() ||
      !input.title.trim() ||
      !input.description.trim() ||
      !input.location.trim()
    ) {
      res.status(400).json({
        error: "Event title, description, date, and location are required.",
      });
      return;
    }
    const result = await executeSql(
      `INSERT INTO events
         (slug, title, description, event_date, location, price_label,
          hero_image_url, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.slug.trim().toLowerCase(),
        input.title.trim(),
        input.description.trim(),
        input.eventDate,
        input.location.trim(),
        input.priceLabel?.trim() || null,
        input.heroImageUrl?.trim() || null,
        input.isPublished,
      ],
    );

    const event = await findEvent(Number(result.insertId));
    if (!event) {
      res.status(500).json({ error: "The event could not be loaded after saving." });
      return;
    }
    res.status(201).json(CreateEventResponse.parse(eventResponse(event)));
  },
);

router.patch(
  "/admin/events/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateEventParams.safeParse(req.params);
    const body = UpdateEventBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const update = body.data;
    if (
      update.eventDate !== undefined &&
      !isValidEventDate(update.eventDate)
    ) {
      res.status(400).json({ error: "Choose a valid event date." });
      return;
    }
    if (
      ["slug", "title", "description", "location"].some((key) => {
        const value = update[key as keyof typeof update];
        return typeof value === "string" && !value.trim();
      })
    ) {
      res.status(400).json({
        error: "Event title, description, date, and location cannot be blank.",
      });
      return;
    }

    const columns: Record<string, string> = {
      slug: "slug",
      title: "title",
      description: "description",
      eventDate: "event_date",
      location: "location",
      priceLabel: "price_label",
      heroImageUrl: "hero_image_url",
      isPublished: "is_published",
    };
    const nullableFields = new Set(["priceLabel", "heroImageUrl"]);
    const assignments: string[] = [];
    const values: SqlParameter[] = [];

    for (const [key, rawValue] of Object.entries(update)) {
      if (rawValue === undefined) continue;
      const column = columns[key];
      if (!column) continue;
      const value =
        typeof rawValue === "string" && key !== "eventDate"
          ? rawValue.trim()
          : rawValue;
      assignments.push(`${column} = ?`);
      values.push(
        nullableFields.has(key) && value === "" ? null : (value as SqlParameter),
      );
    }

    if (assignments.length > 0) {
      await executeSql(
        `UPDATE events
         SET ${assignments.join(", ")}
         WHERE id = ?`,
        [...values, params.data.id],
      );
    }

    const event = await findEvent(params.data.id);
    if (!event) {
      res.status(404).json({ error: "Event not found." });
      return;
    }
    res.json(UpdateEventResponse.parse(eventResponse(event)));
  },
);

export default router;
