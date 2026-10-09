# LinkUps Adventures hosting bundle

This bundle runs the React website and its API in one Node.js process. It is built to use the `PORT` assigned by the hosting control panel; do not choose or reuse a port manually.

## Before starting

- Use this bundle only for the LinkUps domain.
- Configure the Node app's private root and its public web root according to DirectAdmin's Node.js application settings. Do not expose `dist/`, `database/`, `node_modules/`, `package.json`, or environment files to direct file download.
- Set `STATIC_DIR=public` and the database/admin values listed in `.env.example` in the hosting environment.
- Create a MySQL database/user in DirectAdmin, then import `database/schema.mysql` and optionally `database/seed.mysql`.
- Install production dependencies with `npm install --omit=dev`, then use the control panel's assigned app port and its start command `npm start`.

The app returns a service-unavailable response for database-backed features until MySQL is configured. It does not create or modify production tables at startup.
