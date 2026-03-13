# Sawdagar Workspace

This repository is organized as a multi-app workspace for the Sawdagar e-commerce platform.

## Apps

- `backend/` — Express + Prisma + MySQL API
- `website/` — customer-facing Next.js storefront
- `admin/` — admin and supplier Next.js panel
- `shared/` — shared JSON defaults used across apps

## Ports

- Website: `3000`
- Admin: `3001`
- Backend: `4000`

## Common Commands

Run these from the workspace root:

```bash
npm run dev:backend
npm run dev:website
npm run dev:admin
```

Build commands:

```bash
npm run build:website
npm run build:admin
```

Database commands:

```bash
npm run db:push
npm run db:seed
```

## Notes

- The active production code lives in `backend/`, `website/`, and `admin/`.
- Root-level legacy scaffold/config files from the old single-app setup have been reduced so the workspace is clearer to navigate.
