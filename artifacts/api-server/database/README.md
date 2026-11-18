# MySQL setup

1. In DirectAdmin, create or confirm the LinkUps MySQL database and a user with access to it. The database shown in phpMyAdmin was `admin_linkups`; confirm that the app's `MYSQL_DATABASE` setting matches.
2. Configure `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD` in the DirectAdmin Node application's private environment. Keep these values out of GitHub and the public web root.
3. Build and upload the hosted release, then restart the LinkUps Node app. On startup, the app creates its migration ledger, initializes the baseline schema if needed, applies pending migrations, and seeds the initial adventure catalogue only when both catalogue tables are empty.
4. For an existing database, the baseline uses `CREATE TABLE IF NOT EXISTS`; it does not delete or rewrite existing rows. Pending numbered migrations are applied once and recorded in `linkups_schema_migrations`. A failed migration prevents the new server process from starting, so it will not serve code that expects an unapplied schema.
5. If MySQL settings are absent, the website can still start, but the database migrations are skipped and database-backed routes remain unavailable. The startup log states this explicitly.
6. Do not import `.migration-backup/database/schema.mysql` for this app; it is an older source file that selects a different database name. Manual phpMyAdmin setup is still possible: select the intended database and import this directory's `schema.mysql`; the app can seed an empty catalogue on its next startup.
7. Set a unique admin email and strong password in the server environment. The first successful sign-in creates the administrator record; no default password is included in the source.

## Schema changes

For every code change that adds a table or column, add a new, retry-safe migration under `migrations/` and update `schema.mysql` so fresh installs receive the same schema. Never edit an already-applied migration; add another numbered file instead. After the updated release is uploaded and the Node app restarts, the runner applies and records pending migrations automatically. Do not add destructive DDL without the user's explicit approval.

The trip seed is intentionally not re-run on later deployments: it can update seeded adventure records and overwrite admin edits. Initial seed data is added only when both `adventures` and `destinations` are empty. Changes to catalogue data after launch must use a separate reviewed migration or the admin workspace.

Customer registration, booking history, destination editing, and website content all use this same database. Initial Terms & Conditions, Privacy Policy, and Cancellation Policy records are inserted only when their page keys do not already exist, so existing edits are retained.

Scheduled events are separate from flexible trip packages. Create them in the admin workspace with an exact date, location, description, optional price label and image. Published future events appear in date order on the homepage; past events automatically leave the carousel and can still be managed in admin.
