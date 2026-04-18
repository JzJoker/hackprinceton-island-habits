# hackprinceton-island-habits

Monorepo scaffold powered by Turborepo (Vercel) and npm workspaces.

## Quick start

```bash
npm install
npm run dev
```

## Workspace layout

```
.
└── apps
    ├── app
    └── agent
```

## Useful scripts

- `npm run dev` runs all workspace dev scripts through Turbo.
- `npm run build` runs build tasks across workspaces.
- `npm run lint` runs lint scripts across workspaces.
- `npm run test` runs test scripts across workspaces.
