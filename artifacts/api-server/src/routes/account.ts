import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2/promise";
import {
  GetCustomerDashboardResponse,
  UpdateCustomerProfileBody,
  UpdateCustomerProfileResponse,
} from "@workspace/api-zod";
import { executeSql, selectRows } from "../lib/mysql";
import { requireCustomer } from "../middleware/user-auth";

const router: IRouter = Router();

interface ProfileRow extends RowDataPacket {
  name: string;
  email: string;
  phone: string | null;
}

interface CustomerBookingRow extends RowDataPacket {
  id: number | string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  adventureTitle: string | null;
  travelDate: string | null;
  travellers: number | string;
  specialRequests: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
}

const customerBookingSelect = `
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

router.get(
  "/account/dashboard",
  requireCustomer,
  async (req, res): Promise<void> => {
    const identity = req.customerIdentity;
    if (!identity) {
      res.status(401).json({ error: "Customer sign-in is required." });
      return;
    }

    const profiles = await selectRows<ProfileRow>(
      `SELECT name, email, phone
       FROM users
       WHERE id = ? AND role = 'customer' AND is_active = TRUE
       LIMIT 1`,
      [identity.userId],
    );
    const profile = profiles[0];
    if (!profile) {
      res.status(404).json({ error: "Customer account not found." });
      return;
    }

    const bookings = await selectRows<CustomerBookingRow>(
      `${customerBookingSelect}
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC
       LIMIT 100`,
      [identity.userId],
    );

    res.json(
      GetCustomerDashboardResponse.parse({
        profile,
        bookings: bookings.map((booking) => ({
          id: Number(booking.id),
          reference: booking.reference,
          fullName: booking.fullName,
          email: booking.email,
          phone: booking.phone,
          adventureTitle: booking.adventureTitle,
          travelDate: booking.travelDate,
          travellers: Number(booking.travellers),
          specialRequests: booking.specialRequests,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: Number(booking.totalAmount),
          createdAt: booking.createdAt,
        })),
      }),
    );
  },
);

router.patch(
  "/account/profile",
  requireCustomer,
  async (req, res): Promise<void> => {
    const identity = req.customerIdentity;
    if (!identity) {
      res.status(401).json({ error: "Customer sign-in is required." });
      return;
    }

    const parsed = UpdateCustomerProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const name = parsed.data.name.trim();
    if (!name) {
      res.status(400).json({ error: "Name is required." });
      return;
    }
    const phone = parsed.data.phone?.trim() || null;

    await executeSql(
      `UPDATE users
       SET name = ?, phone = ?
       WHERE id = ? AND role = 'customer' AND is_active = TRUE`,
      [name, phone, identity.userId],
    );

    const profiles = await selectRows<ProfileRow>(
      `SELECT name, email, phone
       FROM users
       WHERE id = ? AND role = 'customer' AND is_active = TRUE
       LIMIT 1`,
      [identity.userId],
    );
    const profile = profiles[0];
    if (!profile) {
      res.status(404).json({ error: "Customer account not found." });
      return;
    }

    res.json(UpdateCustomerProfileResponse.parse(profile));
  },
);

export default router;
