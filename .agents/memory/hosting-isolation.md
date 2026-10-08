---
name: Hosting isolation
description: The user's hosting server runs other Node.js sites that must not be disrupted by LinkUps deployment.
---

The user has multiple Node.js sites on the hosting server and asked that LinkUps deployment not affect them. Keep changes confined to the LinkUps domain's own document root; do not stop, reconfigure, or reuse another site's process or port.

**Why:** the user explicitly wants the other hosted sites left untouched.

**How to apply:** the current LinkUps build is static and needs no Node.js listener on that server. If a future version adds a backend, inspect server port/process assignments and use a separate port before configuring it.
