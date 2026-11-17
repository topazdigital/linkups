# MySQL setup

1. Create a new MySQL database and database user in DirectAdmin. Grant that user access to the database.
2. Import `schema.mysql` into the new database, then import `seed.mysql` to add the 13 supplied trip listings and their destinations.
3. If this is an existing database created before the trip-detail fields were added, check the `adventures` table and apply `migrations/001_adventure_trip_details.mysql` once if those columns are missing. Apply `migrations/002_scheduled_events.mysql` to add the admin-managed event calendar. Fresh databases already include the events table.
4. Configure the Node application's environment variables using `.env.example` as the variable-name guide. Set `MYSQL_HOST` to the database host visible to the Node app, commonly `localhost` on the same hosting account.
5. Set a unique admin email and a strong password in the server environment. The first successful sign-in creates the administrator record; no default password is included in the source.
6. Do not put real credentials in this repository or in the public web root.

The trip seed can be re-run: it refreshes the 13 matching trip slugs and retains unrelated records. It hides only the four known placeholder listings from the original sample seed; their records and booking history are not deleted. The generated trip images are included at `artifacts/linkups-adventures/public/images/trips/`.

Customer registration, booking history, destination editing, and website content all use this same database. Re-running `schema.mysql` after an update is safe for existing tables and creates any newly added tables without deleting existing rows.

Scheduled events are separate from flexible trip packages. Create them in the admin workspace with an exact date, location, description, optional price label and image. Published future events appear in date order on the homepage; past events automatically leave the carousel and can still be managed in admin.
