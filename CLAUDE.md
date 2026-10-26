# bdchatpro-frontend — CLAUDE.md

Next.js 14 (App Router) merchant dashboard. Tenants manage products, orders, messages, AI, and subscription here.

## App structure

```
app/
  layout.tsx              Root layout — wraps with AuthProvider + QueryClientProvider
  page.tsx                Landing / redirect
  auth/                   Login, register, verify email
  dashboard/              Protected merchant UI (all routes require auth + active tenant)
    products/             Product catalog
    orders/               Order management
    categories/           Category management
    messages/             Conversation view
    configure-ai/         AI profile setup
    configure-page/       Facebook page connection
    subscription/         Plan + billing
    team/                 Member management
    profile/              User profile
  accept-invite/          Accept tenant invite (public)
  api/                    Next.js API route proxies → backend
    images/[image]/       Proxy backend image URLs
    public/plans/         Public plan listing
    public/bank-transfer/ Bank transfer submission
    tenant/               All tenant API calls (auth forwarded via httpOnly cookie)
    user/                 User auth/profile calls
```

## Auth — how it works

Session lives in an `auth_token` httpOnly cookie set by the backend.  
Never read the JWT yourself. Use the helpers:

```ts
// Server components / API routes
import { getAuthToken, getAuthHeaders } from '@/lib/auth-utils';
const headers = await getAuthHeaders();   // { Authorization: 'Bearer ...', 'Content-Type': ... }

// Client components
import { useUserStore } from '@/lib/stores/userStore';
const { user, tenant, tenantContext } = useUserStore();
```

`tenantContext` carries `{ tenantId, slug, role, permissions[] }` — use it for permission-gated UI.

## Fetching data

- **Server state** (products, orders, etc.): TanStack Query (`useQuery`, `useMutation`).
- **Global client state** (current user, current tenant): Zustand stores in `lib/stores/`.
- Never call the backend directly from a client component. Always go through `app/api/` routes.

```ts
// Zustand stores
lib/stores/userStore.ts     // user, tenants, tenantContext
lib/stores/accountsStore.ts
lib/stores/contentStore.ts
```

## API proxy pattern (app/api/)

```ts
// Every route file follows this shape:
import { getAuthHeaders } from '@/lib/auth-utils';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(req: NextRequest) {
  const backendUrl = getBackendUrl();    // throws if BACKEND_URL not set
  const headers = await getAuthHeaders();
  const res = await fetch(`${backendUrl}/...`, { headers });
  return NextResponse.json(await res.json(), { status: res.status });
}
```

`getBackendUrl()` in `lib/backend-url.ts` — **never hardcode the backend URL**.

## UI components

```
components/ui/    Radix UI primitives (Avatar, Badge, Button, Card, etc.)
app/dashboard/    Feature-level components (modals, cards, etc. colocated with routes)
```

Use existing `components/ui/` primitives. Don't add a new UI library.  
Styling: Tailwind + `cn()` from `lib/utils.ts` (clsx + tailwind-merge).

## Feature gating

Check `tenantContext.permissions` against permission strings before rendering actions:
```ts
const { tenantContext } = useUserStore();
if (tenantContext?.permissions.includes('product:write')) { /* show button */ }
```

`app/dashboard/feature-gate-card.tsx` — use this component for plan-locked feature upsells.

## Environment variables

| Var | Required | Purpose |
|-----|----------|---------|
| `BACKEND_URL` | Yes | Backend API base URL (server-side only) |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL for OAuth callbacks |

## Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — bump version on every release.  
Versioning: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`.

---

## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

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

---

## Running locally

```bash
npm run dev     # :3001
npm run build
npm run lint
```
