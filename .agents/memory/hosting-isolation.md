---
name: Hosting isolation
description: The user's hosting server runs other Node.js sites that must not be disrupted by LinkUps deployment.
---

The LinkUps deployment target is `linkupsadventures.co.ke`, with its public document root at `/domains/linkupsadventures.co.ke/public_html`. Keep changes confined to this domain; the user has multiple Node.js sites on the hosting server and does not want them disrupted. Before starting the Node app, identify the port assigned specifically to LinkUps by the hosting control panel; do not choose, stop, reconfigure, or reuse another site's process or port. If the assignment cannot be inspected, pause and ask rather than guessing. Keep runtime credentials in host environment settings, not public files, and do not expose the private app bundle or database files through the public document root.

The physical Node app root is `/home/admin/domains/linkupsadventures.co.ke/linkups-app`. DirectAdmin assigns port `5002`; PM2 runs it as user `admin` under the app name `linkups`. The app root is a built release bundle, not a Git checkout.

The user prefers to push LinkUps changes manually from Replit Shell and declined connecting GitHub as a Replit integration. Use the project secret securely for manual pushes; never put its value in chat or a Git URL.

**Why:** the user confirmed that `.co.ke` is the intended LinkUps domain and explicitly wants the other hosted sites left untouched.

**How to apply:** only configure or restart the Node application named `linkups`; use its assigned port and preserve its existing environment. Keep source checkouts outside the public document root, push manually from Replit Shell, and do not touch other app configurations.
