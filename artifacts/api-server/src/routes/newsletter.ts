import { Router, type IRouter } from "express";
import {
  CreateNewsletterSubscriptionBody,
  CreateNewsletterSubscriptionResponse,
} from "@workspace/api-zod";
import { executeSql } from "../lib/mysql";

const router: IRouter = Router();
const consentTextVersion = "newsletter-opt-in-v1";

router.post(
  "/newsletter-subscriptions",
  async (req, res): Promise<void> => {
    const parsed = CreateNewsletterSubscriptionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    if (!parsed.data.consent) {
      res
        .status(400)
        .json({ error: "Please agree to receive newsletter emails." });
      return;
    }

    const email = parsed.data.email.trim().toLowerCase();
    await executeSql(
      `INSERT INTO newsletter_subscribers
         (email, consented_at, consent_text_version, is_active)
       VALUES (?, CURRENT_TIMESTAMP, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         consented_at = CURRENT_TIMESTAMP,
         consent_text_version = VALUES(consent_text_version),
         is_active = TRUE,
         updated_at = CURRENT_TIMESTAMP`,
      [email, consentTextVersion],
    );

    res.status(201).json(
      CreateNewsletterSubscriptionResponse.parse({ status: "subscribed" }),
    );
  },
);

export default router;
