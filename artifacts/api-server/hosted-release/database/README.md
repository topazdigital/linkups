# MySQL setup

1. Create a new MySQL database and database user in DirectAdmin. Grant that user access to the database.
2. Import `schema.mysql` into the new database, then import `seed.mysql` to add the 13 supplied trip listings and their destinations.
3. For an existing database, check the schema before applying migrations: apply `migrations/001_adventure_trip_details.mysql` if the adventure detail columns are missing, `migrations/002_scheduled_events.mysql` if the `events` table is missing, and `migrations/003_site_content_pages_and_hero.mysql` if both `site_content.hero_images` and `site_content.hero_mode` are missing. Fresh databases include these fields and the initial policy page records in `schema.mysql`.
4. Configure the Node application's environment variables using `.env.example` as the variable-name guide. Set `MYSQL_HOST` to the database host visible to the Node app, commonly `localhost` on the same hosting account.
5. Set a unique admin email and a strong password in the server environment. The first successful sign-in creates the administrator record; no default password is included in the source.
6. Do not put real credentials in this repository or in the public web root.

The trip seed can be re-run: it refreshes the 13 matching trip slugs and retains unrelated records. It hides only the four known placeholder listings from the original sample seed; their records and booking history are not deleted. The generated trip images are included at `artifacts/linkups-adventures/public/images/trips/`.

Customer registration, booking history, destination editing, and website content all use this same database. Re-running `schema.mysql` after an update is safe for existing tables and creates any newly added tables without deleting existing rows. The initial Terms & Conditions, Privacy Policy, and Cancellation Policy records are inserted only when their page keys do not already exist, so existing edits are retained.

Scheduled events are separate from flexible trip packages. Create them in the admin workspace with an exact date, location, description, optional price label and image. Published future events appear in date order on the homepage; past events automatically leave the carousel and can still be managed in admin.
