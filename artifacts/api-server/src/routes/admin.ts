import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2/promise";
import {
  CreateAdventureBody,
  CreateAdventureResponse,
  ListAdminAdventuresResponse,
  ListAdminBookingsResponse,
  ListAdminEnquiriesResponse,
  UpdateAdventureBody,
  UpdateAdventureParams,
  UpdateAdventureResponse,
  UpdateBookingBody,
  UpdateBookingParams,
  UpdateBookingResponse,
  UpdateEnquiryBody,
  UpdateEnquiryParams,
  UpdateEnquiryResponse,
} from "@workspace/api-zod";
import {
  adventureColumns,
  adventureResponse,
  type AdventureRow,
} from "../lib/adventure";
import { executeSql, selectRows, type SqlParameter } from "../lib/mysql";
import { requireAdmin } from "../middleware/admin-auth";

const router: IRouter = Router();

interface BookingRow extends RowDataPacket {
  id: number | string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  adventureTitle: string | null;
  travelDate: string | null;
  travellers: number;
  specialRequests: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
}

interface EnquiryRow extends RowDataPacket {
  id: number | string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const bookingSelect = `
  SELECT
    b.id,
    b.reference,
    b.full_name AS fullName,
    b.email,
    b.phone,
    a.title AS adventureTitle,
    DATE_FORMAT(b.travel_date, '%Y-%m-%d') AS travelDate,
    b.travellers,
    b.special_requests AS specialRequests,
    b.status,
    b.payment_status AS paymentStatus,
    b.total_amount AS totalAmount,
    DATE_FORMAT(b.created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt
  FROM bookings b
  LEFT JOIN adventures a ON a.id = b.adventure_id
`;

function bookingResponse(row: BookingRow) {
  return {
    id: Number(row.id),
    reference: row.reference,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    adventureTitle: row.adventureTitle,
    travelDate: row.travelDate,
    travellers: Number(row.travellers),
    specialRequests: row.specialRequests,
    status: row.status,
    paymentStatus: row.paymentStatus,
    totalAmount: Number(row.totalAmount),
    createdAt: row.createdAt,
  };
}

async function findBooking(id: number): Promise<BookingRow | undefined> {
  const rows = await selectRows<BookingRow>(
    `${bookingSelect}
     WHERE b.id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0];
}

async function findEnquiry(id: number): Promise<EnquiryRow | undefined> {
  const rows = await selectRows<EnquiryRow>(
    `SELECT
       id,
       name,
       email,
       phone,
       service,
       message,
       status,
       DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt
     FROM enquiries
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0];
}

router.get(
  "/admin/bookings",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await selectRows<BookingRow>(
      `${bookingSelect}
       ORDER BY b.created_at DESC
       LIMIT 500`,
    );
    res.json(ListAdminBookingsResponse.parse(rows.map(bookingResponse)));
  },
);

router.patch(
  "/admin/bookings/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateBookingParams.safeParse(req.params);
    const body = UpdateBookingBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    await executeSql("UPDATE bookings SET status = ? WHERE id = ?", [
      body.data.status,
      params.data.id,
    ]);
    const booking = await findBooking(params.data.id);
    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    res.json(UpdateBookingResponse.parse(bookingResponse(booking)));
  },
);

router.get(
  "/admin/enquiries",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await selectRows<EnquiryRow>(
      `SELECT
         id,
         name,
         email,
         phone,
         service,
         message,
         status,
         DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt
       FROM enquiries
       ORDER BY created_at DESC
       LIMIT 500`,
    );
    res.json(ListAdminEnquiriesResponse.parse(rows));
  },
);

router.patch(
  "/admin/enquiries/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateEnquiryParams.safeParse(req.params);
    const body = UpdateEnquiryBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    await executeSql("UPDATE enquiries SET status = ? WHERE id = ?", [
      body.data.status,
      params.data.id,
    ]);
    const enquiry = await findEnquiry(params.data.id);
    if (!enquiry) {
      res.status(404).json({ error: "Enquiry not found." });
      return;
    }
    res.json(UpdateEnquiryResponse.parse(enquiry));
  },
);

router.get(
  "/admin/adventures",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await selectRows<AdventureRow>(
      `SELECT ${adventureColumns}
       FROM adventures
       ORDER BY is_featured DESC, title ASC`,
    );
    res.json(
      ListAdminAdventuresResponse.parse(rows.map(adventureResponse)),
    );
  },
);

router.post(
  "/admin/adventures",
  requireAdmin,
  async (req, res): Promise<void> => {
    const body = CreateAdventureBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const input = body.data;
    const result = await executeSql(
      `INSERT INTO adventures
         (slug, title, category, duration_days, duration_nights, price,
          description, hero_image_url, is_featured, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.slug,
        input.title.trim(),
        input.category.trim(),
        input.durationDays,
        input.durationNights,
        input.price,
        input.description?.trim() || null,
        input.heroImageUrl?.trim() || null,
        input.isFeatured ?? false,
        input.isPublished,
      ],
    );
    const rows = await selectRows<AdventureRow>(
      `SELECT ${adventureColumns} FROM adventures WHERE id = ? LIMIT 1`,
      [result.insertId],
    );
    res
      .status(201)
      .json(
        CreateAdventureResponse.parse(adventureResponse(rows[0])),
      );
  },
);

router.patch(
  "/admin/adventures/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateAdventureParams.safeParse(req.params);
    const body = UpdateAdventureBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const columns: Record<string, string> = {
      slug: "slug",
      title: "title",
      category: "category",
      durationDays: "duration_days",
      durationNights: "duration_nights",
      price: "price",
      description: "description",
      heroImageUrl: "hero_image_url",
      isFeatured: "is_featured",
      isPublished: "is_published",
    };
    const assignments: string[] = [];
    const values: SqlParameter[] = [];

    for (const [key, rawValue] of Object.entries(body.data)) {
      if (rawValue === undefined) continue;
      const column = columns[key];
      if (!column) continue;
      assignments.push(`${column} = ?`);
      values.push(
        typeof rawValue === "string" && key !== "slug"
          ? rawValue.trim()
          : rawValue,
      );
    }

    if (assignments.length === 0) {
      res.status(400).json({ error: "Add at least one field to update." });
      return;
    }

    assignments.push("updated_at = CURRENT_TIMESTAMP");
    values.push(params.data.id);
    await executeSql(
      `UPDATE adventures
       SET ${assignments.join(", ")}
       WHERE id = ?`,
      values,
    );

    const rows = await selectRows<AdventureRow>(
      `SELECT ${adventureColumns} FROM adventures WHERE id = ? LIMIT 1`,
      [params.data.id],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Adventure not found." });
      return;
    }
    res.json(
      UpdateAdventureResponse.parse(adventureResponse(rows[0])),
    );
  },
);

export default router;
