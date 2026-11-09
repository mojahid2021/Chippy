# Changelog — bdchatpro-frontend

All notable changes to the merchant dashboard are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

---

## [Unreleased]

### Changed
- Full visual redesign: light rickshaw-paint palette (bottle green, shapla pink, marigold) and Anek Bangla typeface
- All hardcoded Tailwind colours replaced by semantic tokens in `app/globals.css`; the app is now light-only
- New landing page, sign-in screen, dashboard shell, and dashboard overview
- Removed unverified marketing stats and static "online" status indicators

---

## [1.0.0] — 2026-10-27

### Added
- Next.js 14 App Router merchant dashboard
- Auth via `auth_token` httpOnly cookie; helpers in `lib/auth-utils.ts`
- `getBackendUrl()` in `lib/backend-url.ts` — throws on missing `BACKEND_URL` env var
- Zustand stores: `userStore` (user + tenant context), `accountsStore`, `contentStore`
- TanStack Query for all server state (products, orders, messages, categories)
- Dashboard pages: products, orders, categories, messages, configure-ai, configure-page, subscription, team, profile
- API proxy routes under `app/api/` — all backend calls go through here; client never calls backend directly
- Radix UI component library in `components/ui/`
- `feature-gate-card.tsx` for plan-locked feature upsells
- Permission-gated UI using `tenantContext.permissions[]` from `userStore`
- `accept-invite/` public route for tenant invite acceptance
- Public plan listing at `app/api/public/plans/`
- Bank transfer submission at `app/api/public/bank-transfer/[subscriptionId]/`
- Image proxy at `app/api/images/[image]/`

---

[Unreleased]: https://github.com/your-org/bdchatpro/compare/frontend-v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/bdchatpro/releases/tag/frontend-v1.0.0
