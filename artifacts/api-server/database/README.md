# MySQL setup

1. In DirectAdmin, create or confirm the MySQL database and a database user with access to it.
2. In phpMyAdmin, select the intended LinkUps database before importing. The screenshot supplied by the user showed `admin_linkups`; verify that this matches the Node app's `MYSQL_DATABASE`.
3. Import this directory's `schema.mysql` to create the app's tables. It uses `CREATE TABLE IF NOT EXISTS` and does not drop existing rows. For a fresh database, import `seed.mysql` afterward to load the adventure and destination catalogue.
4. Do not import `.migration-backup/database/schema.mysql` for this application; that is an older source file that selects a different database name.
5. For an existing database, inspect its tables and columns before applying migrations: apply `migrations/001_adventure_trip_details.mysql` if the adventure detail columns are missing, `migrations/002_scheduled_events.mysql` if the `events` table is missing, and `migrations/003_site_content_pages_and_hero.mysql` if both `site_content.hero_images` and `site_content.hero_mode` are missing. Fresh databases already include these fields and initial policy-page records.
6. Configure the Node application's environment using `.env.example` as the variable-name guide. Set `MYSQL_HOST` to the database host reachable by the Node app, commonly `localhost` on the same hosting account.
7. Set a unique admin email and strong password in the server environment. The first successful sign-in creates the administrator record; no default password is included in the source.
8. Never put real credentials in this repository or in the public web root.

## Schema changes

For every code change that adds a table or column, add an idempotent migration under `migrations/` and update `schema.mysql` so fresh installs receive the same schema. Test the change, then apply the migration to the intended production MySQL database as part of the same release and verify the table/column. Do not run destructive DDL without explicit approval. If production access is unavailable, provide the exact migration SQL and clearly report that it still needs to be imported; do not describe it as already pushed.

The trip seed can be re-run: it refreshes the 13 matching trip slugs and retains unrelated records. It hides only the four known placeholder listings from the original sample seed; their records and booking history are not deleted. The generated trip images are included at `artifacts/linkups-adventures/public/images/trips/`.

Customer registration, booking history, destination editing, and website content all use this same database. Re-running `schema.mysql` after an update is safe for existing tables and creates any newly added tables without deleting existing rows. The initial Terms & Conditions, Privacy Policy, and Cancellation Policy records are inserted only when their page keys do not already exist, so existing edits are retained.

Scheduled events are separate from flexible trip packages. Create them in the admin workspace with an exact date, location, description, optional price label and image. Published future events appear in date order on the homepage; past events automatically leave the carousel and can still be managed in admin.
