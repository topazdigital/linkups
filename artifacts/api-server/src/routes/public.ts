import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2/promise";
import {
  CreateBookingBody,
  CreateBookingResponse,
  CreateEnquiryBody,
  CreateEnquiryResponse,
  ListPublicAdventuresResponse,
} from "@workspace/api-zod";
import { adventureColumns, adventureResponse, type AdventureRow } from "../lib/adventure";
import { executeSql, selectRows } from "../lib/mysql";

const router: IRouter = Router();

interface PriceRow extends RowDataPacket {
  id: number | string;
  price: number | string;
}

router.get("/adventures", async (_req, res): Promise<void> => {
  const rows = await selectRows<AdventureRow>(
    `SELECT ${adventureColumns}
     FROM adventures
     WHERE is_published = TRUE
     ORDER BY is_featured DESC, title ASC`,
  );
  res.json(
    ListPublicAdventuresResponse.parse(rows.map(adventureResponse)),
  );
});

router.post("/enquiries", async (req, res): Promise<void> => {
  const parsed = CreateEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const name = parsed.data.name.trim();
  const message = parsed.data.message.trim();
  if (!name || !message) {
    res.status(400).json({ error: "Name and message are required." });
    return;
  }

  const result = await executeSql(
    `INSERT INTO enquiries (name, email, phone, service, message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      name,
      parsed.data.email.trim().toLowerCase(),
      parsed.data.phone?.trim() || null,
      parsed.data.service?.trim() || null,
      message,
    ],
  );

  res
    .status(201)
    .json(
      CreateEnquiryResponse.parse({ id: result.insertId, status: "new" }),
    );
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  const adventureSlug = input.adventureSlug?.trim() || null;
  let adventureId: number | string | null = null;
  let unitPrice = 0;

  if (adventureSlug) {
    const adventures = await selectRows<PriceRow>(
      `SELECT id, price
       FROM adventures
       WHERE slug = ? AND is_published = TRUE
       LIMIT 1`,
      [adventureSlug],
    );
    if (adventures.length === 0) {
      res.status(400).json({ error: "That adventure is not available." });
      return;
    }
    adventureId = adventures[0].id;
    unitPrice = Number(adventures[0].price);
  }

  const reference = `LA-${randomBytes(5).toString("hex").toUpperCase()}`;
  const totalAmount = Math.round(unitPrice * input.travellers * 100) / 100;
  const travelDate =
    input.travelDate instanceof Date
      ? input.travelDate.toISOString().slice(0, 10)
      : null;

  await executeSql(
    `INSERT INTO bookings
       (reference, adventure_id, full_name, email, phone, travel_date,
        travellers, special_requests, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reference,
      adventureId,
      input.fullName.trim(),
      input.email.trim().toLowerCase(),
      input.phone.trim(),
      travelDate,
      input.travellers,
      input.specialRequests?.trim() || null,
      totalAmount,
    ],
  );

  res.status(201).json(
    CreateBookingResponse.parse({
      reference,
      status: "new",
      totalAmount,
    }),
  );
});

export default router;
