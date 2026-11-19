---
name: LinkUps admin experience
description: User requirements for public account navigation, admin access control, and editing website content.
---

- Keep sign-in and registration out of the public header. On mobile, use a fixed bottom navigation bar; “My account” sends signed-out visitors to `/login` and signed-in users to their account area.
- Admins sign in through the frontend login, then go to `/admin`. The admin workspace and its data/actions must be restricted to authenticated admin-role accounts.
- Customer self-registration and sign-in are enabled; successful customer sign-in goes to `/dashboard`.
- The admin workspace should allow editing the public website content, not just booking, enquiry, and adventure records.
- Blog articles should be created and edited in the admin with their content and images; do not manage article images as generic site-image overrides.
- Existing adventures are date-flexible and travellers choose preferred dates; admin-posted fixed-date events are a separate content type. Never invent dates for flexible adventures.
- Do not disclose the website hosting provider or infrastructure location in public website content.

**Why:** The user explicitly requested role-protected admin access, customer sign-in, the mobile account-navigation model, editable site content, admin-authored blog articles with their own images, and private hosting details.

**How to apply:** Preserve these rules when changing LinkUps navigation, authentication, database schema, admin APIs, content editor, policies, or event listings. Keep account links out of the public header, make the mobile account tab route signed-out visitors to login, author blog content and its images together in admin rather than using generic per-article image overrides, keep fixed-date events separate from flexible-date trips, and do not name the hosting provider or location publicly.
