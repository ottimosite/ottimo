# Ottimo deployment

## Production

Ottimo is deployed as a Vite single-page application.

- Production branch: `master`
- Build command: `npm run build`
- Publish directory: `dist`
- Node.js: 22
- Hosting: Netlify

The repository remains the source of truth. Production deployments are created from `master`; feature branches and pull requests should use Netlify Deploy Previews.

## React Router fallback

Ottimo uses client-side routing. `netlify.toml` configures a rewrite from all paths to `/index.html`, allowing direct navigation and refreshes on routes such as `/services`, `/app/dashboard`, `/app/audits/new`, and `/app/audits/:id`.

The rewrite is not a redirect: the browser URL remains unchanged and React Router resolves the route in the application.

## Environment variables

The current demo does not require environment variables. When integrations are introduced, document non-secret variable names in `.env.example` and configure real values only in Netlify's environment settings. Never commit secrets.

## Production verification

After a production deployment, verify at minimum:

1. The home page loads over HTTPS.
2. A public nested route loads directly.
3. An application route loads directly.
4. Refreshing a nested route does not return a host-level 404.
5. Static assets load successfully.
6. The URL onboarding flow opens from the public site.
7. The audit demo can be opened without external credentials.
8. Browser console errors are investigated rather than ignored.
9. Mobile navigation remains keyboard and touch usable.
10. The production build still passes the repository quality gate.

## Pull requests

Use a feature branch for product work. Netlify should create a Deploy Preview for the pull request. Review the preview before merging to `master`.

Recommended flow:

```text
feature branch
    -> pull request
    -> GitHub quality gate
    -> Netlify Deploy Preview
    -> functional / responsive review
    -> merge to master
    -> Netlify production
```
