# Ottimo deployment

## Vercel

Ottimo is a Vite + React SPA. Vercel should deploy the repository directly with:

- **Framework preset:** Vite
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Production branch:** `master`

`vercel.json` provides the SPA fallback required by React Router so direct navigation to routes such as `/app/dashboard` continues to resolve to the application entry point.

### Preview workflow

1. Push a feature/fix branch to GitHub.
2. Open or update a pull request against `master`.
3. Vercel creates/updates a preview deployment for that branch.
4. Use the preview URL for visual and functional QA.
5. Push additional commits to the same branch; Vercel updates the preview.
6. Merge the PR only after the GitHub quality checks and preview QA are satisfactory.
7. Vercel deploys `master` as the production deployment.

### Recommended Vercel settings

Keep preview and production environment variables separate. Do not commit secrets to the repository.

For the current MVP, Ottimo does not require Vercel-specific runtime environment variables.

## Local verification

```bash
npm ci
npm test
npm run lint
npm run build
npm run preview
```

The final command serves the production build locally and is useful for checking client-side routes before merging.
