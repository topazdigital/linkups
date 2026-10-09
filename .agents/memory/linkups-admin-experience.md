---
name: LinkUps admin experience
description: User requirements for public account navigation, admin access control, and editing website content.
---

- Do not expose a dedicated “Admin” link in the public header; use a Login/Register entry instead.
- Admins sign in through the frontend login, then go to `/admin`. The admin workspace and its data/actions must be restricted to authenticated admin-role accounts.
- The admin workspace should allow editing the public website content, not just booking, enquiry, and adventure records.

**Why:** The user explicitly requested this access and content-management behavior for LinkUps.

**How to apply:** Preserve these rules when changing LinkUps navigation, authentication, database schema, admin APIs, or the content editor. Clarify whether customer self-registration is included before implementing account flows.
