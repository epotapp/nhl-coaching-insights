# Deployment — NHL Coaching Insights v0.4

The frontend is a static Vite application. It can be deployed to GitHub Pages, IONOS static hosting, Netlify, Cloudflare Pages, or any web server that serves the generated `dist` directory.

## GitHub Pages — automatic workflow

1. Create a GitHub repository and place the project contents at its root.
2. Commit and push to the `main` or `master` branch.
3. In GitHub, open **Settings → Pages**.
4. Set **Source** to **GitHub Actions**.
5. Open the **Actions** tab and run **Deploy NHL Coaching Insights to GitHub Pages**, or push another commit.
6. The workflow installs dependencies, derives `/<repository-name>/` as the Vite base path, builds the frontend, uploads `artifacts/mockup-sandbox/dist`, and publishes it.

Workflow file:

```text
.github/workflows/deploy-pages.yml
```

The workflow includes a `404.html` fallback, so a refreshed client-side route returns the application rather than a GitHub 404 page.

## Manual static build

With Node.js 20+ installed:

```powershell
corepack enable
pnpm install
pnpm build:frontend
```

For a project subdirectory, set `BASE_PATH` before building:

```powershell
$env:BASE_PATH="/your-repository-name/"
pnpm build:frontend
```

For a root domain:

```powershell
$env:BASE_PATH="/"
pnpm build:frontend
```

Upload the contents of:

```text
artifacts/mockup-sandbox/dist
```

Do not upload the source directory in place of `dist`.

## Local production preview

```powershell
$env:PORT="4173"
$env:BASE_PATH="/"
pnpm --filter @workspace/mockup-sandbox preview
```

Then open `http://localhost:4173`.

## Connecting the optional PC PostgreSQL API

The frontend works without the API. To use the local database, start the API as described in `POSTGRESQL_SETUP.md`, then build or run the frontend with:

```powershell
$env:VITE_NHL_API_BASE_URL="http://YOUR-PC-LAN-IP:3001/api"
```

A public GitHub Pages website cannot reach an API that is only bound to `localhost`. For access outside the PC, expose the API through HTTPS using a reverse proxy, VPN, or secure tunnel, configure CORS for the deployed site origin, and keep PostgreSQL itself private. Never expose PostgreSQL port 5432 directly to the public internet.

## Deployment verification

After deployment, verify:

- The login/onboarding flow opens at the repository URL.
- Dashboard images, supplied icons, Matplotlib charts, and video clips load.
- Refreshing the deployed URL does not produce a 404.
- Dark and light themes use identical geometry.
- The compact menu shows Version 0.4.0.
- The browser console contains no failed asset requests.
