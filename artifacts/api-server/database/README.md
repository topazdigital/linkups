# Initial MySQL setup

1. Create a new MySQL database and database user in DirectAdmin. Grant that user access to the database.
2. Import `schema.mysql` into the new database, then import `seed.mysql` if you want the example catalogue to appear. Review the example prices and descriptions first.
3. Configure the Node application's environment variables using `.env.example` as the variable-name guide. Set `MYSQL_HOST` to the database host visible to the Node app, commonly `localhost` on the same hosting account.
4. Set a unique admin email and a strong password in the server environment. The first successful sign-in creates the administrator record; no default password is included in the source.
5. Do not put real credentials in this repository or in the public web root.

The scripts do not drop tables or overwrite catalogue entries with matching slugs. If the account already has these tables, inspect the schema before importing anything.
