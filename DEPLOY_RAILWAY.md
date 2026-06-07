# Railway deployment instructions

1. Create a new Railway project (`railway init`) or use the Railway dashboard.
2. Add a MySQL plugin in Railway (Provision a MySQL database).
3. In Railway, copy the provided database credentials and set the project's environment variables:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `PORT` (set to 5000)
- `NODE_ENV`=production
- `JWT_SECRET` and `JWT_EXPIRES_IN`

1. Set the project build command: `npm run build` (in `backend` folder) and start command: `npm start`.
   - Railway will detect monorepo; set the root directory to `backend` in the service settings.

2. Deploy. Railway will provide a DATABASE URL and host — use those values in the environment variables.

3. Replace any `localhost` values locally by using the env vars (already implemented in `backend/src/config/db.ts`).
