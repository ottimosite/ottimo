# Public rendering v1

Ottimo's first generated-public-pages slice keeps the existing React + Vite + React Router architecture.

## Generated routes

The production build emits route-specific HTML for `/`, `/services`, and `/performance`.

Each page contains meaningful content, semantic navigation, an H1, a primary action, route-specific metadata and a canonical URL before JavaScript executes.

## Progressive enhancement

The generated HTML is the no-JavaScript baseline. The existing React application loads from the same Vite bundle and enhances the page when JavaScript is available.

Public content does not depend on audit data, authentication, tenant state or browser-only APIs during generation.

## Application boundary

`/app/*` remains a client-side authenticated application route. Netlify serves generated public files directly and uses the SPA fallback only for `/app/*`.

This slice deliberately does not migrate every public route. The generated-page pattern is proven on three representative routes before expansion.
