# Public-site performance budget

These are guardrails for Ottimo's public experience, not claims about current measured production performance.

## Initial budgets

- JavaScript transferred on the initial public route: **150 KB compressed**.
- CSS transferred on the initial public route: **100 KB compressed**.
- No new third-party runtime scripts without an explicit architecture decision.
- No new client-side dependency for presentation where native HTML/CSS is sufficient.
- Public routes must remain usable with reduced motion enabled.
- Production build and rendered-page QA remain required before public UI changes merge.

The budgets should be measured from the production build as the public site evolves. If a legitimate product requirement needs a budget increase, record the reason and the measured before/after impact in the relevant PR.
