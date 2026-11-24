---
name: perf-optimize
description: >-
  Automatically applied performance optimization checklist for the Travally Next.js app.
  Use this skill whenever new pages, components, or features are created to ensure fast
  navigation, small bundles, and instant loading feedback. Read this skill before creating
  any new page, component, or feature in the Travally codebase.
---

# Travally Performance Optimization Skill

This skill must be followed whenever creating or modifying pages, components, or features
in the Travally Next.js 14 App Router project. Its goal is to keep navigation instant and
bundles small.

---

## 1. Every Route Must Have a `loading.tsx`

Every route segment under `src/app/` that renders a page MUST have a `loading.tsx` file
that returns a lightweight skeleton/shimmer matching the page layout.

**Why:** Next.js App Router shows `loading.tsx` instantly during client-side navigation
while the page JS loads. Without it, the user sees nothing during transition.

**Template:**
```tsx
export default function XxxLoading() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-5 animate-pulse">
      {/* Match the layout of the actual page with rounded rectangles */}
      <div className="h-8 w-32 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
```

**Checklist:**
- [ ] `src/app/loading.tsx` (home)
- [ ] `src/app/discover/loading.tsx`
- [ ] `src/app/chats/loading.tsx`
- [ ] `src/app/chats/[id]/loading.tsx`
- [ ] `src/app/profile/[id]/loading.tsx`
- [ ] `src/app/settings/loading.tsx`
- [ ] `src/app/create/loading.tsx`
- [ ] `src/app/safety/loading.tsx`
- [ ] Any new route must also get a loading.tsx

---

## 2. Dynamic Imports for Heavy Client Components

Any client component over ~200 lines or that is conditionally rendered (modals, tabs,
drawers) MUST be dynamically imported using `next/dynamic`.

**Pattern — Page-level:**
```tsx
import dynamic from "next/dynamic";

const HeavyClient = dynamic(() => import("@/components/path/HeavyClient"), {
  loading: () => <div className="animate-pulse h-48 rounded-2xl bg-slate-200" />,
});
```

**Pattern — Inside a client component (named export):**
```tsx
const ModalComponent = dynamic(
  () => import("@/components/path/Modal").then((mod) => mod.ModalComponent),
  { loading: () => <div className="animate-pulse h-32 rounded-xl bg-slate-200" /> }
);
```

**Current dynamic imports to maintain:**
- `HomeClient` in `src/app/page.tsx`
- `UnifiedCreateFlow` in `src/app/create/page.tsx`
- `FindMeStoryDeck` in `HomeClient.tsx`
- `GrowInitiativeCard` in `HomeClient.tsx`
- `TreasureMap` in `HomeClient.tsx` (SSR disabled — Leaflet)
- `ActivityCard`, `ActivityFilters`, `TripCard`, `TripFilters` in `DiscoverClient.tsx`

**Components that should always be dynamic (over 500 lines):**
- `IdentityVerificationModal` (~2100 lines)
- `VoiceCallModal` (~700 lines)
- `SafetySetupModal` (~660 lines)
- `ShareLocationModal` (~440 lines)
- `GroupMembersDrawer` (~780 lines)

---

## 3. Route Prefetching

The `DesktopSidebar` component must call `router.prefetch()` on mount for all main routes:
```tsx
useEffect(() => {
  ["/", "/discover", "/chats", "/create", "/settings"].forEach((route) => {
    router.prefetch(route);
  });
}, [router]);
```

All navigation `<Link>` components in `BottomNav` and `DesktopSidebar` must have
`prefetch={true}` (already set — verify before shipping).

---

## 4. `next.config.mjs` Optimization

Ensure these settings are present:
```js
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // ...images config
};
```

---

## 5. Import Hygiene

- **Never import an entire icon library.** Import only the specific icons needed:
  ```tsx
  import { Home, Search } from "lucide-react"; // ✅ good
  import * as Icons from "lucide-react"; // ❌ bad
  ```
- **Never import heavyweight components at the top level** if they are only shown on user
  interaction (modals, drawers, expanded sections).
- **Prefer named exports** with `.then((mod) => mod.Name)` in dynamic imports for tree-shaking.

---

## 6. Module-Level Caching Pattern

For pages that are navigated to frequently (Discover, Chats), use module-level caches to
show stale data instantly while refetching:
```tsx
let cachedData: any[] | null = null;

function PageContent() {
  const [data, setData] = useState<any[]>(() => cachedData ?? []);
  // ...fetch and update cachedData
}
```

This is already implemented in `DiscoverClient.tsx` and `chats/page.tsx` — maintain it.

---

## 7. Image Optimization

- Always use `next/image` for user-facing images when possible.
- For avatar initials, use CSS-based fallbacks (gradient + first letter), not placeholder images.
- Remote image patterns must be declared in `next.config.mjs` `images.remotePatterns`.

---

## 8. Verification Checklist Before Committing

Before every commit that adds or modifies components:

1. **TypeScript check:** `npx tsc --noEmit` — must exit 0
2. **Production build:** `npx next build --no-lint` — must exit 0
3. **Bundle check:** Look at the build output for any page > 60kB first-load JS
4. **Loading skeleton exists** for every new route
5. **Dynamic imports** used for any component > 200 lines or conditionally rendered

---

## 9. What NOT to Do

- ❌ Never statically import a component > 500 lines at the page level
- ❌ Never create a route without a `loading.tsx`
- ❌ Never use `import *` from icon or component libraries
- ❌ Never block navigation with synchronous heavy computation
- ❌ Never use the `Sparkles` icon anywhere in the project
- ❌ Never edit `BottomNav.tsx` without explicit user permission

---

## Quick Reference: Current Bundle Sizes

| Route | Page JS | First Load |
|-------|---------|------------|
| `/` (home) | 25 kB | 194 kB |
| `/discover` | 6.89 kB | 197 kB |
| `/chats/[id]` | 52.7 kB | 187 kB |
| `/settings` | 18.7 kB | 134 kB |

Target: Keep every page under 60 kB page JS, 200 kB first load.
