# LinkUps Adventures

Kenya adventure-travel website for browsing trips, requesting bookings, and managing customer and site content.

## Run & Operate

- `pnpm install` — install workspace dependencies
- `pnpm --filter @workspace/linkups-adventures run dev` — run the Vite website
- `pnpm --filter @workspace/api-server run dev` — run the Express API
- `pnpm run typecheck` — typecheck workspace packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and validation types
- API environment: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `SESSION_SECRET`
- Admin environment: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`

## Stack

- pnpm workspace, React + Vite, Wouter, TypeScript
- API: Express 5, with shared OpenAPI-generated client types
- Production data store: DirectAdmin-hosted MySQL through `mysql2`
- The API applies MySQL bootstrap and pending migrations at startup when `MYSQL_*` settings are configured; after uploading a release to DirectAdmin, restart the LinkUps Node app to run them.

## Where things live

- `artifacts/linkups-adventures/` — React/Vite website and public assets
- `artifacts/api-server/` — API routes, MySQL connection, production bundle, and SQL files
- `artifacts/api-server/database/schema.mysql` — baseline MySQL schema for new databases
- `artifacts/api-server/database/migrations/` — versioned MySQL changes applied on server startup
- `artifacts/api-server/database/seed.mysql` — one-time initial catalogue seed; not reapplied on later deployments
- `lib/api-spec/openapi.yaml` — API contract source
- `.migration-backup/` — preserved imported Next.js source; do not deploy it directly

## Architecture decisions

- The production database is external MySQL, not Replit's managed PostgreSQL. The DirectAdmin/phpMyAdmin database shown for LinkUps is `admin_linkups`; verify the configured `MYSQL_DATABASE` before running production SQL.
- Keep the hosted LinkUps service isolated from the user's other sites. Do not stop or reconfigure unrelated processes, ports, virtual hosts, or certificates.
- Keep database credentials in secure environment settings; never place them in source code or public files.
- The imported Next.js app is preserved in `.migration-backup/`; the runnable website is the Vite artifact.

## Product

The public site presents Kenyan adventures and destinations, accepts booking and enquiry requests, supports customer accounts, and provides an admin workspace for bookings and editable website content.

## User preferences

- When a code change requires a new MySQL table or column, add a new retry-safe migration and update `schema.mysql`; the DirectAdmin app applies pending migrations when the uploaded release is restarted. Never edit an already-applied migration. Verify migration code and report clearly if the server lacks MySQL settings or cannot be reached.
- If production access is unavailable, say so plainly and provide the exact SQL for the user to import; never claim that a migration was applied when it was not. Do not ask for credentials in chat.
- Preserve existing production rows. Do not use destructive schema changes without the user's explicit approval.

## Gotchas

- Use the MySQL schema and migrations under `artifacts/api-server/database/`; the Replit PostgreSQL `db push` command is not the production migration path for this app.
- Do not run `pnpm --filter db push`; it targets the unrelated PostgreSQL workspace, not DirectAdmin MySQL.
- The imported backup also contains an older `database/schema.mysql` that creates/uses `linkups_adventures`. For production, use the current schema under `artifacts/api-server/database/` and select the intended database in phpMyAdmin first.
- The current HTTPS endpoint was observed presenting a certificate for `mail.betcheza.co.ke`, which does not cover `linkupsadventures.co.ke`. Install a LinkUps-domain certificate in DirectAdmin and verify it before enabling an HTTP-to-HTTPS redirect.
- Do not force HTTPS while the certificate is invalid for the LinkUps hostname; visitors would be redirected to a browser certificate warning.
- Obtain the hosting-assigned port for LinkUps from DirectAdmin. Never guess a port or reuse one assigned to another site.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
