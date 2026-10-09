---
name: Hosting isolation
description: The user's hosting server runs other Node.js sites that must not be disrupted by LinkUps deployment.
---

The user has multiple Node.js sites on the hosting server and asked that LinkUps deployment not affect them. Keep changes confined to the LinkUps domain's own hosting area. Before starting the Node app, identify the port assigned specifically to LinkUps by the hosting control panel; do not choose, stop, reconfigure, or reuse another site's process or port. If the assignments cannot be inspected, pause and ask rather than guessing. Keep runtime credentials in host environment settings, not public files.

**Why:** the user explicitly wants the other hosted sites left untouched and requested a fully functional Node-backed site.

**How to apply:** only configure the Node application for `linkupsadventures.com`; use the hosting-assigned `PORT` and test health/routes without touching other app configurations.
