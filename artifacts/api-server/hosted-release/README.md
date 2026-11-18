# LinkUps Adventures hosting bundle

This bundle runs the React website and its API in one Node.js process. It is built to use the `PORT` assigned by the hosting control panel; do not choose or reuse a port manually.

## Before starting

- Use this bundle only for the LinkUps domain.
- Configure the Node app's private root and its public web root according to DirectAdmin's Node.js application settings. Do not expose `dist/`, `database/`, `node_modules/`, `package.json`, or environment files to direct file download.
- Set `STATIC_DIR=public` and the database/admin values listed in `.env.example` in the hosting environment.
- Create a MySQL database/user in DirectAdmin and set the `MYSQL_*` environment values listed in `.env.example`.
- On server startup, the app initializes the baseline schema when needed, seeds an empty adventure catalogue once, and applies pending numbered migrations from `database/migrations/`.
- The migration runner records completed versions in `linkups_schema_migrations`; never edit an applied migration or rerun the seed to publish content changes.
- Install production dependencies with `npm install --omit=dev`, then use the control panel's assigned app port and its start command `npm start`.

The app continues to serve the website when MySQL settings are absent, but database-backed features remain unavailable. When settings are present, a failed database connection or migration stops startup and is reported in the server log.
