---
name: "Nuxt"
category: "meta-framework"
github_url: "https://github.com/nuxt/nuxt"
docs_url: "https://nuxt.com"
implementation_language: "TypeScript"
status: "active"
ai_friendliness_score: 7
reusability_score: 8
maintainability_score: 8
capabilities:
  state_management: false
  rendering: false
  event_handling: false
---

# Nuxt

## Philosophy & Mental Model

Nuxt is **"The Intuitive Vue Framework"**—a full-stack meta-framework built on Vue. It's to Vue what Next.js is to React or SvelteKit is to Svelte.

**Mental model**: Vue handles UI components and reactivity. Nuxt handles everything around it: file-system routing, universal data fetching, server rendering, and a built-in server engine (Nitro) that turns the app into a full-stack deployable unit. A heavy layer of **auto-imports and convention-based directory structure** sits on top—components, composables, and Vue APIs are available without explicit `import` statements as long as they live in the expected folder.

**Core principles:**

1. **Convention-Based Directory Structure** - `pages/`, `layouts/`, `components/`, `composables/`, `server/` each have a defined role and are wired up automatically
2. **File-System Routing** - `pages/` directory structure generates the Vue Router config
3. **Universal Rendering** - Same component code runs on server and client; rendering mode (SSR, SSG, hybrid, SPA) is a per-route config choice, not a code-level fork
4. **Auto-Imports** - Vue APIs (`ref`, `computed`), Nuxt composables (`useFetch`, `useState`), and your own components/composables are available globally—no import statements
5. **Nitro Server Engine** - A universal server toolkit that powers `server/api/*` routes and can deploy the same app to Node, edge runtimes, serverless platforms, or static hosting from one codebase

**Key insight**: Nuxt leans further into "convention over configuration" than Next.js or SvelteKit—the **directory you put a file in** determines its behavior (`pages/` → route, `server/api/` → API endpoint, `composables/` → auto-imported function), and **auto-imports remove the import statement entirely**. This reduces boilerplate dramatically but means a file's behavior is determined by *where it lives*, not by anything visible inside the file itself.

Nuxt is for building production Vue apps with SSR, routing, and full-stack server capabilities.

## State Management

### Server State (Data-Fetching Composables)

**`useFetch`** - the primary way to call an API and have the result available on both server and client (deduped during SSR/hydration):

```vue
<script setup>
const { data: post, status, error } = await useFetch(`/api/posts/${route.params.slug}`)
</script>

<template>
  <h1>{{ post?.title }}</h1>
  <p v-if="status === 'pending'">Loading…</p>
</template>
```

**`useAsyncData`** - lower-level primitive when you need to wrap an arbitrary async function (multiple calls, transforms, custom caching keys):

```vue
<script setup>
const { data: dashboard } = await useAsyncData('dashboard', async () => {
  const [user, stats] = await Promise.all([
    $fetch('/api/user'),
    $fetch('/api/stats'),
  ])
  return { user, stats }
})
</script>
```

`$fetch` (powered by `ofetch`) is the universal fetch primitive both composables wrap—usable directly for one-off calls, especially in event handlers and server routes.

### Client State (`useState`)

Nuxt's SSR-safe replacement for `ref` when state needs to be **shared across components and survive hydration without leaking between requests**:

```vue
<script setup>
// Shared, SSR-safe—keyed by name so multiple components see the same value
const counter = useState('counter', () => 0)
</script>

<template>
  <button @click="counter++">Count: {{ counter }}</button>
</template>
```

`useState` exists specifically because a plain module-level `ref` would be **shared across server requests**—a classic SSR footgun. The composable scopes state to the current request on the server and to the app instance on the client.

### Global State (Pinia)

For larger apps, the official recommendation is **Pinia** (Vue's official store library, via `@pinia/nuxt`):

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] as CartItem[] }),
  getters: {
    total: (state) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0),
  },
  actions: {
    add(item: CartItem) { this.items.push(item) },
  },
})
```

```vue
<script setup>
const cart = useCartStore()
</script>

<template>
  <p>Total: {{ cart.total }}</p>
  <button @click="cart.add(item)">Add</button>
</template>
```

Auto-imported like everything else in Nuxt—no `import { useCartStore } from '~/stores/cart'` needed.

### Update Mechanism

**Direct mutation** through Vue's reactivity (refs/reactive objects), and **automatic refetch** of `useFetch`/`useAsyncData` results via `refresh()` or `refreshNuxtData()`:

```vue
<script setup>
const { data: todos, refresh } = await useFetch('/api/todos')

async function addTodo(title) {
  await $fetch('/api/todos', { method: 'POST', body: { title } })
  await refresh() // re-runs the fetch, updates `todos`
}
</script>
```

No automatic dependency tracking between mutations and fetches (unlike SvelteKit's load rerunning)—the developer explicitly calls `refresh`.

### Async Handling

**Parallel fetching** via `Promise.all` inside `useAsyncData`, or multiple independent `useFetch` calls (Nuxt dedupes and runs them concurrently). **Lazy variants** (`useLazyFetch`, `useLazyAsyncData`) don't block navigation—the component renders immediately and `data` resolves once the request completes:

```vue
<script setup>
const { data, status } = await useLazyFetch('/api/slow-report')
</script>

<template>
  <p v-if="status === 'pending'">Loading report…</p>
  <Report v-else :data="data" />
</template>
```

### Derived State

Standard Vue `computed`, auto-imported:

```vue
<script setup>
const { data: items } = await useFetch('/api/cart')

const subtotal = computed(() =>
  items.value.reduce((sum, i) => sum + i.price * i.qty, 0)
)
const tax = computed(() => subtotal.value * 0.08)
const total = computed(() => subtotal.value + tax.value)
</script>
```

## Rendering

### File-System Routing

```
pages/
  index.vue              → /
  about.vue              → /about
  blog/[slug].vue        → /blog/:slug
  blog/[...slug].vue     → /blog/* (catch-all)
```

Generates the Vue Router configuration automatically. Dynamic and nested routes follow bracket conventions; `<NuxtPage />` in the root layout renders the matched page.

### Layouts

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <NavBar />
    <slot />
    <AppFooter />
  </div>
</template>
```

```vue
<!-- pages/admin/dashboard.vue -->
<script setup>
definePageMeta({ layout: 'admin' })
</script>
```

Layouts are selected per-page via `definePageMeta`, not nested by directory structure (a contrast with SvelteKit/Next.js, where layouts cascade with the route tree).

### Components & Auto-Import

```vue
<!-- components/ProductCard.vue -->
<script setup lang="ts">
defineProps<{ name: string; price: number }>()
</script>

<template>
  <div class="card">
    <h3>{{ name }}</h3>
    <p>${{ price.toFixed(2) }}</p>
  </div>
</template>
```

```vue
<!-- pages/shop.vue — no import statement -->
<template>
  <ProductCard v-for="p in products" :key="p.id" v-bind="p" />
</template>
```

Any component in `components/` is globally available by filename (nested folders become name prefixes, e.g. `components/base/Button.vue` → `<BaseButton />`).

### Rendering Modes

Nuxt calls this **"universal rendering"**—the same component tree can be rendered multiple ways, chosen per-route or globally:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },           // Static at build time
    '/products/**': { swr: 3600 },      // Stale-while-revalidate
    '/admin/**': { ssr: false },        // Client-only (SPA)
    '/api/**': { cors: true },
  },
})
```

This "hybrid rendering" config is one of Nuxt's most distinctive features—mixing SSG, SSR, ISR-like SWR, and SPA modes across a single app from one central config file, rather than per-file exports.

### Conditional & List Rendering

Standard Vue template syntax:

```vue
<template>
  <p v-if="user">Welcome, {{ user.name }}!</p>
  <NuxtLink v-else to="/login">Login</NuxtLink>

  <ul>
    <li v-for="post in posts" :key="post.id">
      <NuxtLink :to="`/blog/${post.slug}`">{{ post.title }}</NuxtLink>
    </li>
  </ul>
</template>
```

### Client-Only Rendering

```vue
<template>
  <ClientOnly>
    <HeavyChart :data="chartData" />
    <template #fallback>
      <p>Loading chart…</p>
    </template>
  </ClientOnly>
</template>
```

Explicit escape hatch for components that can't (or shouldn't) run during SSR.

## Event Handling

### Standard Events

Vue's `v-on`/`@` directive syntax, unchanged from plain Vue:

```vue
<script setup>
const count = ref(0)
</script>

<template>
  <button @click="count++">Increment: {{ count }}</button>
</template>
```

### Forms & Mutations

No equivalent of SvelteKit actions or Next.js Server Actions—forms are handled with standard Vue event bindings plus `$fetch` against a `server/api/` route:

```vue
<script setup>
const email = ref('')
const error = ref(null)

async function onSubmit() {
  try {
    await $fetch('/api/subscribe', { method: 'POST', body: { email: email.value } })
    await navigateTo('/thanks')
  } catch (e) {
    error.value = e.data?.message ?? 'Something went wrong'
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input v-model="email" type="email" name="email" />
    <p v-if="error">{{ error }}</p>
    <button type="submit">Subscribe</button>
  </form>
</template>
```

This is more explicit than SvelteKit's `use:enhance` (no progressive-enhancement magic—you write the submit handler), but also means **no built-in no-JS fallback**: the form does nothing without client-side JavaScript unless you build that yourself.

### Component Events

```vue
<!-- ProductCard.vue -->
<script setup lang="ts">
const emit = defineEmits<{ addToCart: [id: string] }>()
</script>

<template>
  <button @click="emit('addToCart', product.id)">Add to cart</button>
</template>

<!-- Parent.vue -->
<template>
  <ProductCard :product="p" @add-to-cart="handleAdd" />
</template>
```

`defineEmits` with a TypeScript signature gives compile-time checking of emitted event names and payloads—standard Vue 3 `<script setup>` patterns carry over unchanged.

## Reuse Patterns

### Composables

```ts
// composables/useCart.ts
export function useCart() {
  const items = useState<CartItem[]>('cart-items', () => [])
  const total = computed(() => items.value.reduce((s, i) => s + i.price, 0))
  function add(item: CartItem) { items.value.push(item) }
  return { items, total, add }
}
```

```vue
<script setup>
const { items, total, add } = useCart() // auto-imported, no import statement
</script>
```

The Nuxt analogue of React hooks / Vue composables-as-a-pattern, elevated to a first-class, auto-imported convention.

### Server API Routes (Nitro)

```ts
// server/api/posts/[slug].get.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const post = await db.post.findUnique({ where: { slug } })
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return post
})
```

Accessed at `/api/posts/my-slug`. The `.get.ts` / `.post.ts` suffix maps to the HTTP method—an explicit-naming convention in the same spirit as SvelteKit's `+server.js` exports, though split across filenames rather than named exports.

### Middleware

**Route middleware** (navigation guards, auto-imported from `middleware/`):

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useState('user')
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})
```

```vue
<script setup>
definePageMeta({ middleware: ['auth'] })
</script>
```

**Server middleware** (`server/middleware/`) runs on every request, Nitro-side—for logging, auth-context population, etc.

### Plugins & Modules

Plugins (`plugins/`) inject functionality app-wide (e.g., registering a third-party library); modules (the Nuxt module ecosystem, `@nuxt/image`, `@nuxtjs/tailwindcss`, `@pinia/nuxt`) extend the framework itself at build/config time. The module ecosystem is one of Nuxt's strongest differentiators—most integrations are a one-line `modules: [...]` config addition.

## Developer Experience

### Learning Curve

**Low to Moderate** if you know Vue. The friction is almost entirely in learning **Nuxt's conventions**:
- Which directory does what (`pages/`, `server/api/`, `composables/`, `middleware/`)
- What's auto-imported vs. what needs an explicit import (third-party libraries, types)
- `useState` vs. plain `ref` (the SSR-sharing footgun)
- `useFetch` vs. `useAsyncData` vs. `$fetch`

None of these are hard individually, but there are several of them, and they're "tribal knowledge" rather than visible in any one file.

### TypeScript

**Native, strong support**. `nuxi typecheck`, auto-generated types for routes, runtime config, and Nitro server routes (`$fetch` is fully typed end-to-end against your `server/api` handlers via Nitro's typed routes). `<script setup lang="ts">` plus `defineProps<T>()`/`defineEmits<T>()` give compile-time prop and event contracts.

### Tooling

- **Nuxt CLI** (`nuxi`): scaffolding, dev server, typecheck, analyze
- **Nuxt DevTools**: built-in browser panel showing routes, components, composables, server routes, payload, timeline—unusually deep framework-level introspection
- **Nitro**: one build target compiles to dozens of deployment presets (Vercel, Netlify, Cloudflare, AWS Lambda, Node, static)
- **Vite-powered dev server**: fast HMR

### Boilerplate

**Low**, largely thanks to auto-imports:

```vue
<!-- pages/hello.vue -->
<script setup>
const { data } = await useFetch('/api/message')
</script>

<template>
  <h1>{{ data.message }}</h1>
</template>
```

```ts
// server/api/message.get.ts
export default defineEventHandler(() => ({ message: 'Hello World' }))
```

~8 lines for a full server-rendered page with data—comparable to SvelteKit, lighter than a typical Next.js App Router equivalent.

### Documentation

**Excellent**. nuxt.com has guides, an interactive "Nuxt UI" component playground, migration guides, and a large community module directory (the Nuxt Modules ecosystem).

### Component Reusability Assessment

**Quality: Good (8/10)**

**Strengths**: Vue SFCs are portable across any Vue 3 project (Nuxt or not). Composables are plain functions—reusable in any Vue app with minor adjustment (swap `useState` for `ref`/`provide`). Pinia stores are framework-agnostic within Vue. The module ecosystem means most cross-cutting concerns (auth, i18n, images, analytics) are drop-in rather than hand-rolled. `definePageMeta`/layouts/middleware patterns are clean and composable.

**Weaknesses**: Auto-imports are a Nuxt-specific convenience—components and composables written assuming global auto-import need explicit imports to run outside Nuxt. `useFetch`/`useAsyncData`/`useState`/server routes are Nuxt/Nitro-specific; porting to plain Vue means rewriting the data layer. Directory-convention coupling (a `pages/` file *is* a route) is harder to extract into a shared library than a plain component.

**Cross-Project Reuse**: Excellent within the Nuxt/Vue ecosystem—Nuxt Layers let you share entire directory structures (pages, components, composables, config) across projects as a kind of framework-level "extends." Vue components and composables are portable to non-Nuxt Vue apps with light adaptation. Server routes and SSR-state composables are the least portable layer.

**Design System Support**: Strong. Nuxt UI (the official component library), Vuetify, PrimeVue, and Tailwind all integrate cleanly. Scoped SFC styles plus the module system make theming and design-system distribution straightforward.

## Maintainability

**Quality: Good (8/10)**

**Strengths**: Convention-based structure means a new contributor (human or AI) can predict where to find or add a file once they know the conventions. Nitro's single-build/multi-deploy model removes a whole class of "does this work on platform X" maintenance burden. TypeScript support is deep and end-to-end (typed `$fetch` against server routes). Nuxt DevTools materially shortens the debugging loop by surfacing routes, payload, and composable state in one place. The module ecosystem reduces hand-rolled integration code that would otherwise need ongoing maintenance.

**Weaknesses**: Auto-imports mean `grep`/"find references" can't always tell you where a symbol comes from—you have to know the convention (or generate `.nuxt/types` and read the generated declarations). Heavy reliance on directory-location-determines-behavior makes some refactors (moving a file) behavior-changing in non-obvious ways. Nuxt 2 → 3 was a near-total rewrite (Vue 2 → 3, Webpack → Vite/Nitro)—a reminder that meta-framework-level migrations can be large even when the underlying library's migration (Vue 2 → 3) is itself well-trodden.

**Code Organization**: Directory conventions enforce a consistent shape across Nuxt projects—`pages/`, `components/`, `composables/`, `server/`, `middleware/`, `layouts/`. Nuxt Layers extend this to whole shared structures across repos.

**Testing**: `@nuxt/test-utils` provides a Nuxt-aware test environment for Vitest/Jest; Vue Test Utils for component-level tests; Playwright for E2E. Server routes (`defineEventHandler`) are plain functions and test in isolation reasonably easily; `useFetch`/`useAsyncData`-laden pages need the Nuxt test environment to run meaningfully.

**Debugging**: Nuxt DevTools is the standout—live inspection of routes, components, composable/auto-import sources, server routes, and the SSR payload in one panel. Vue DevTools work as expected for component/state inspection. Server vs. client log separation requires the same discipline as any SSR framework.

**Scalability**: Strong. File-system routing and Nuxt Layers scale to large route trees and multi-team codebases. Hybrid `routeRules` let different parts of a large app use different rendering strategies without architectural rewrites. Nitro's deployment-target flexibility avoids platform lock-in at scale.

**Breaking Changes**: Nuxt 2 → 3 was a major rewrite (new reactivity model, new server engine, new build tooling)—now stable and well past that transition. Current Nuxt 3.x releases are comparatively incremental, with clear migration notes for module/composable API changes.

## AI-Friendly Assessment

**Overall Score: 7/10**

### Strengths for AI-Assisted Development

**Strong, Consistent Conventions**: Once the directory map is known (`pages/` → routes, `server/api/` → endpoints, `composables/` → shared logic, `middleware/` → guards), an AI agent can predict where new code belongs and what a given file does from its path alone—similar in spirit to SvelteKit's and Next.js's file-system routing, but extended further (to data layer, middleware, and server routes).

**Typed End-to-End**: `$fetch` calls are type-checked against `server/api` handler return types via Nitro. `defineProps<T>()`/`defineEmits<T>()` give compile-time component contracts. This closes a class of "does this match the API shape" errors before runtime—exactly the kind of fast, unambiguous feedback loop that helps an agent self-correct.

**Explicit HTTP-Method Routing**: `posts/[slug].get.ts` / `posts.post.ts` map filename suffixes directly to HTTP verbs—an agent can generate or modify the right handler without parsing exported function names.

**SSR Footguns Made Explicit**: `useState` exists *specifically* to name and solve the "don't use a module-level ref in SSR" problem. Its existence as a documented, auto-imported primitive means an agent that knows the convention avoids a bug that's otherwise easy to introduce silently.

**Plain Vue Underneath**: Component-level code (`<script setup>`, `v-on`, `v-if`/`v-for`, `computed`, `defineEmits`) is identical to plain Vue 3—a large, stable, well-represented-in-training-data surface that an agent can reason about without Nuxt-specific knowledge.

### Weaknesses for AI-Assisted Development

**Auto-Imports Are Implicit by Design**: This is the single biggest AI-friction point. A component, composable, or Vue API can be used with no `import` statement anywhere in the file:

```vue
<script setup>
const cart = useCartStore()      // from stores/cart.ts — no import
const total = computed(...)       // from 'vue' — no import
const { data } = await useFetch() // Nuxt composable — no import
</script>
```

A human skimming this file (or an agent reading it in isolation) cannot tell *where* `useCartStore` is defined without already knowing Nuxt's auto-import scan paths, or generating and reading `.nuxt/imports.d.ts`. This directly works against "locality of behavior"—the file does not contain enough information to explain itself.

**Multiple Overlapping Data-Fetching Primitives**: `useFetch`, `useAsyncData`, `useLazyFetch`, `useLazyAsyncData`, and `$fetch` all exist, with overlapping use cases and subtly different caching/dedup/SSR behavior. An agent has to choose correctly among five APIs that look similar but aren't interchangeable.

**Directory-Location-Determines-Behavior**: Moving `components/ProductCard.vue` to `components/shop/ProductCard.vue` silently renames its global tag from `<ProductCard>` to `<ShopProductCard>`. The *file's location* is part of its public contract in a way that isn't visible by reading the file—an easy mistake for an agent doing a routine reorganization.

**No Built-In Form/Mutation Convention**: Unlike SvelteKit's actions or Next.js's Server Actions, Nuxt has no opinionated, named pattern for "submit a form, get validation errors back, progressively enhance." An agent has to assemble `$fetch` + error state + navigation by hand each time—more freedom, but more opportunities for inconsistency across a codebase.

**Two Layout Models to Track**: Layouts are chosen per-page via `definePageMeta({ layout: ... })` rather than cascading from directory nesting (as in SvelteKit/Next.js). An agent has to check each page's `definePageMeta` to know which layout applies—it isn't derivable from the route tree alone.

### Why 7/10?

Nuxt earns solid marks for **typed, convention-driven structure** (predictable file locations, end-to-end-typed `$fetch`, explicit HTTP-verb routing) and for **building on plain Vue**, whose component-level patterns are explicit and well-represented in training data.

It loses ground primarily to **auto-imports**—the framework's signature convenience is also its biggest AI-friendliness cost. Removing the import statement removes the one piece of the file that would otherwise answer "where does this come from?", forcing an agent to hold Nuxt's scan-path conventions in its head (or tool-call its way to `.nuxt/imports.d.ts`) rather than reading the answer locally. Layered on top of that: five overlapping data-fetching composables to choose between, location-as-contract for component names, and no opinionated mutation pattern to lean on.

**Key Insight**: Nuxt is a useful data point on the **"convention strength" vs. "locality of behavior" tradeoff**. Pushing more decisions into directory structure and auto-wiring (à la Nuxt) shrinks the *amount* of code an agent has to write, but it also shrinks the amount of *information present in any single file*—trading boilerplate for implicit, scan-path-dependent magic. SvelteKit's `+page.server.js` achieves a similar reduction in ambiguity through *explicit naming* rather than *removed imports*, which is the more AI-friendly direction to push: say more in the filename, not less in the file body.

---

Sources:
- [Nuxt Documentation](https://nuxt.com/docs)
- [Nuxt Data Fetching](https://nuxt.com/docs/getting-started/data-fetching)
- [Nuxt State Management](https://nuxt.com/docs/getting-started/state-management)
- [Nuxt Server (Nitro) Engine](https://nuxt.com/docs/guide/concepts/server-engine)
- [Nuxt Auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports)
- [Nuxt Routing](https://nuxt.com/docs/getting-started/routing)
