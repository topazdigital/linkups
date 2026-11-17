---
name: LinkUps admin experience
description: User requirements for public account navigation, admin access control, and editing website content.
---

- Do not expose a dedicated “Admin” link in the public header; use a Login/Register entry instead.
- Admins sign in through the frontend login, then go to `/admin`. The admin workspace and its data/actions must be restricted to authenticated admin-role accounts.
- Customer self-registration and sign-in are enabled; successful customer sign-in goes to `/dashboard`.
- The admin workspace should allow editing the public website content, not just booking, enquiry, and adventure records.
- Existing adventures are date-flexible and travellers choose preferred dates; admin-posted fixed-date events are a separate content type. Never invent dates for flexible adventures.

**Why:** The user explicitly requested this access and content-management behavior for LinkUps.

**How to apply:** Preserve these rules when changing LinkUps navigation, authentication, database schema, admin APIs, content editor, or event listings. Keep fixed-date events separate from flexible-date trips.
