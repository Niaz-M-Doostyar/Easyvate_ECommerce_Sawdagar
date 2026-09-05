# Sawdagar VPS deployment

Pushes to `main` run builds for the API, storefront, and admin app. When the
production GitHub secrets are configured, the workflow connects to the VPS,
fast-forwards its clean checkout, builds all apps, reloads PM2, and verifies
the database-backed API readiness, storefront, and admin locally.

## Existing VPS: one-time migration before enabling CI/CD

This release removes environment files from Git tracking. Before the first
automated deployment, pause deployment and copy `backend/.env`,
`website/.env.local`, and `admin/.env.local` to a secure location outside the
repository. After confirming the backup, restore those three tracked paths to a
clean Git state, pull this release manually, and then copy the files back. They
will now remain untracked and must never be committed.

If existing product images live in `backend/uploads`, copy the original files
to the new absolute `UPLOADS_DIR` before restarting. The `.cache` directory is
optional because image variants can be generated again.

## One-time VPS preparation

1. Clone this repository into a dedicated directory owned by the deployment
   user and keep the tracked checkout clean.
2. Install Node.js 20+, npm, Git, and PM2 (`npm install --global pm2`). Run
   `pm2 startup` once as the deployment user, execute the command it prints,
   and then run `pm2 save` so the apps return after a VPS reboot.
3. Keep these untracked files on the VPS:
   - `backend/.env`
   - `website/.env.local`
   - `admin/.env.local`
4. Put uploads outside the Git checkout and set an absolute `UPLOADS_DIR` in
   `backend/.env`, for example `/srv/sawdagar/shared/uploads`.
5. Ensure nginx proxies the public site to port 3000, `/api` and `/uploads` to
   port 4000, and `/sawdagar-admin` to port 3001 without stripping that base
   path. Disable proxy caching for `/api` and honor its `Cache-Control: no-store`
   response. Set `client_max_body_size 55m` (or another deliberate limit above
   the largest supported multi-image request).

The deploy script intentionally does not run `prisma db push`. Database schema
changes must ship as reviewed Prisma migrations before `prisma migrate deploy`
is added to production automation.

## GitHub production secrets

- `VPS_HOST`: server hostname or IP
- `VPS_USER`: restricted deployment user
- `VPS_APP_DIR`: absolute repository directory on the VPS
- `VPS_SSH_KEY`: private SSH key for the deployment user
- `VPS_HOST_FINGERPRINT`: trusted SHA256 SSH host-key fingerprint

Optional secrets:

- `VPS_PORT`: SSH port (defaults to `22`)
- `VPS_SSH_PASSPHRASE`: passphrase when the deployment key is encrypted

The workflow skips only the SSH deployment when the five required values are
absent; build verification still runs and reports a warning. For deployment
without human intervention, do not add required reviewers to the GitHub
`production` environment.

## Credential safety

Environment files are deliberately ignored. Because environment files were
previously tracked in this repository, rotate database, JWT, SMTP, and other
credentials that may have existed in Git history before treating the deployment
as production-safe.
