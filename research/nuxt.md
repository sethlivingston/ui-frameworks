---
name: "Nuxt"
category: "meta-framework"
github_url: "https://github.com/nuxt/nuxt"
docs_url: "https://nuxt.com"
implementation_language: "TypeScript"
status: "active"
type_system_score: 7
compiler_feedback_score: 6
locality_score: 5.5
explicitness_score: 5
convention_strength_score: 5.5
token_efficiency_score: 7.5
familiarity_score: 6.5
stability_score: 6
tooling_score: 8
version: "4.4.8"
type: "Vue Meta-Framework"
npm_package: "nuxt"
ai_tooling:
  mcp_server:
    available: true
    url: "https://github.com/antfu/nuxt-mcp"
    party: "community"
  guidelines: null
  llms_txt: true
  style_guides: null
  observed_delta: "nuxt.com publishes /llms.txt (~5K token doc index) and /llms-full.txt (full docs corpus) at https://nuxt.com/llms.txt. nuxt-mcp (by Anthony Fu, a Vue/Nuxt core team member, but distributed as a community package, not under the nuxt/ GitHub org) is a dev-time MCP server exposing a running app's routes, components, and auto-imports to an agent at http://localhost:3000/__mcp/sse. Ran the canonical todo-list exercise (see Token efficiency) twice: once with no supplemental tooling, once with nuxt.com/llms.txt loaded into context. Without tooling, the model produced a working implementation but called the data-fetching composable inside an event handler the same way it would call it in <script setup> top-level scope (a documented anti-pattern: useFetch/useAsyncData are designed for setup-time calls, not handler-time), and used Pinia for state that useState would cover more simply. With llms.txt loaded, the model correctly used $fetch (not useFetch) inside the addTodo handler and used useState for the shared todo list instead of reaching for Pinia. The delta is real but addresses a known multiple-overlapping-composables confusion (see Convention strength) rather than the auto-import locality problem, which neither pass resolved — the agent in both runs wrote `const todos = useState(...)` without an import statement, which is correct Nuxt code but not something either piece of tooling explained or needed to explain, since the tooling's framing already assumes auto-imports as ambient knowledge."
next_release:
  name: "Nuxt 5 (Nitro v3)"
  status: "announced"
  changes: "Nuxt 4.0 (July 2025) was deliberately scoped as a stability release containing the compatibilityVersion: 4 changes (new app/ directory structure, useAsyncData/useFetch dedup overhaul, shallow data reactivity by default, Vue 3.5). Nuxt 5 is the next major version and is positioned to carry the heavier infrastructure change: an upgrade to Nitro v3, the server engine that powers server/ routes, deployment presets, and the dev server. The official roadmap (nuxt.com/docs/4.x/community/roadmap) describes Nuxt 5 as scheduled but does not (as of this review) publish an RFC, alpha, or concrete breaking-change list beyond 'Nitro v3 and additional changes.'"
  anticipated_impact: "Nitro v3 is the substrate for every server/api/* route, every deployment preset (Vercel, Cloudflare, Node, static), and the dev server. A major version bump here is more likely to be a 'rebuild and redeploy' event than a component-code-level rewrite — Vue-level code (<script setup>, composables, components/) is unlikely to need changes. If Nitro v3 changes the defineEventHandler signature, request/response helpers, or deployment preset configuration, the 'Server API Routes (Nitro)' pattern in this review and the tooling/locality evidence around server/ would need re-verification. Vue 3.6 Vapor Mode (tracked in research/vue.md) is a separate, lower-coupling concern: Nuxt's SFC compilation goes through @vue/compiler-sfc, so Vapor adoption in Nuxt would likely be an opt-in compiler flag rather than a Nuxt-level breaking change."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
typescript_support: "native"
license: "MIT"
runtime: "both"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "reactive"
state_model: "reactive-properties"
rendering_strategy: "hydration"
maintainer: "NuxtLabs"
first_released: "2016"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full from-scratch rewrite under the 9-dimension agentic-dev rubric. The prior file (reviewed_date unset, all *_score null) used the legacy per-capability-area template; its prose was largely accurate and reused where still current (Nitro server routes, useState rationale, auto-import critique), but every score below is freshly evidenced. Verified current stable is 4.4.8 (npm dist-tags: latest=4.4.8, 3x=3.21.8, alpha=4.0.0-alpha.4, rc=4.0.0-rc.0) — Nuxt 3.x remains in maintenance via the 3x dist-tag. No canonical TodoMVC reference exists for current Nuxt (the official nuxt/todomvc and nuxt/example-todomvc repos are both archived Nuxt 2 + Vuex projects from 2021); token efficiency evidence is a fresh minimal implementation following nuxt.com/docs/4.x data-fetching and state-management guides."
---

# Nuxt

Nuxt is the official full-stack meta-framework for Vue — file-system routing, universal rendering (SSR/SSG/hybrid/SPA per route), a built-in server engine (Nitro) for API routes and deployment, and a pervasive auto-import layer that makes Vue APIs, your own components, and your own composables available with no `import` statements. It occupies the same architectural slot relative to Vue that Next.js occupies relative to React, or SvelteKit relative to Svelte — but Nuxt pushes "convention over configuration" further than either: **the directory a file lives in determines its behavior**, and the import statement — the one piece of a file that normally says "where does this come from?" — is largely absent by design.

Current stable is Nuxt 4.4.8 (npm `latest`, verified June 2026). Nuxt 4.0 shipped July 2025 as a deliberately stability-focused release (new `app/` directory layout, `compatibilityVersion: 4` data-fetching changes); Nuxt 3.x continues to receive maintenance via the `3x` npm dist-tag (currently 3.21.8).

## State Management

### Server State (Data-Fetching Composables)

`useFetch` is the primary SSR-safe data-fetching composable — runs once during universal rendering, dedupes between server and client:

```vue
<script setup lang="ts">
const route = useRoute()
const { data: post, status, error } = await useFetch(`/api/posts/${route.params.slug}`)
</script>

<template>
  <h1>{{ post?.title }}</h1>
  <p v-if="status === 'pending'">Loading…</p>
</template>
```

`useAsyncData` is the lower-level primitive for arbitrary async logic (multiple calls, transforms, custom cache keys):

```vue
<script setup lang="ts">
const { data: dashboard } = await useAsyncData('dashboard', async () => {
  const [user, stats] = await Promise.all([$fetch('/api/user'), $fetch('/api/stats')])
  return { user, stats }
})
</script>
```

`$fetch` (powered by `ofetch`) is the universal fetch primitive both composables wrap, and per the official data-fetching guide is the **recommended choice for client-side, event-driven calls** (button clicks, form submissions) — `useFetch`/`useAsyncData` are documented as setup-time, SSR-aware composables, not general-purpose fetch wrappers.

### Client State (`useState`)

Nuxt's SSR-safe replacement for a module-level `ref`, keyed by name so multiple components share the same value without leaking across server requests:

```vue
<script setup lang="ts">
const counter = useState('counter', () => 0)
</script>

<template>
  <button @click="counter++">Count: {{ counter }}</button>
</template>
```

`useState` exists specifically because a plain module-level `ref` is shared across **every concurrent server request** — a correctness bug, not just a style preference. The official state-management guide frames `useState` as the default and Pinia as the option for "more complex state management" — Nuxt is explicitly non-opinionated between the two ("feel free to choose the right solution for your needs").

### Global State (Pinia)

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
const cart = useCartStore() // auto-imported, no import statement
</script>
```

### Update Mechanism

Direct mutation through Vue's reactivity, plus explicit `refresh()` / `refreshNuxtData()` to re-run a fetch after a mutation:

```vue
<script setup>
const { data: todos, refresh } = await useFetch('/api/todos')

async function addTodo(title: string) {
  await $fetch('/api/todos', { method: 'POST', body: { title } })
  await refresh() // explicit re-fetch — no automatic dependency tracking between mutation and fetch
}
</script>
```

### Async Handling

`useLazyFetch` / `useLazyAsyncData` don't block navigation — the component renders immediately and `data` resolves once the request completes, with `status` cycling through `'idle' | 'pending' | 'success' | 'error'`.

### Derived State

Standard Vue `computed`, auto-imported — no Nuxt-specific derived-state primitive.

## Rendering

### File-System Routing

```
app/pages/
  index.vue              → /
  about.vue              → /about
  blog/[slug].vue        → /blog/:slug
  blog/[...slug].vue     → /blog/* (catch-all)
```

In Nuxt 4's default directory layout, `pages/`, `components/`, `composables/`, `layouts/`, `middleware/`, `plugins/`, and `app.vue` all live under `app/` (the `~` alias now points at `app/`). `server/` stays at the project root — Nitro processes it in a separate context with different globals, and the Nuxt 4 docs frame this separation as an explicit fix for IDE auto-complete bleeding between client and server globals.

### Layouts

```vue
<!-- app/layouts/default.vue -->
<template>
  <div><NavBar /><slot /><AppFooter /></div>
</template>
```

```vue
<!-- app/pages/admin/dashboard.vue -->
<script setup>
definePageMeta({ layout: 'admin' })
</script>
```

Layouts are selected per-page via `definePageMeta`, not nested by directory structure — a contrast with SvelteKit/Next.js, where layouts cascade with the route tree.

### Components & Auto-Import

```vue
<!-- app/components/ProductCard.vue -->
<script setup lang="ts">
defineProps<{ name: string; price: number }>()
</script>
<template>
  <div class="card"><h3>{{ name }}</h3><p>${{ price.toFixed(2) }}</p></div>
</template>
```

```vue
<!-- app/pages/shop.vue — no import statement -->
<template>
  <ProductCard v-for="p in products" :key="p.id" v-bind="p" />
</template>
```

Any component in `components/` is globally available by filename; nested folders become name prefixes (`components/base/Button.vue` → `<BaseButton />`).

### Rendering Modes

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/products/**': { swr: 3600 },
    '/admin/**': { ssr: false },
  },
})
```

A single config file mixes SSG, SSR, stale-while-revalidate, and SPA modes per route — Nuxt's "universal rendering" / hybrid rendering model.

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

No equivalent of SvelteKit actions or Next.js Server Actions — forms are standard Vue event bindings plus `$fetch` against a `server/api/` route. No built-in no-JS fallback.

### Server API Routes (Nitro)

```ts
// server/api/todos/[id].delete.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  await db.todo.delete({ where: { id } })
  return { ok: true }
})
```

The `.get.ts` / `.post.ts` / `.delete.ts` filename suffix maps directly to the HTTP method.

## Rubric Evidence

### Evidence: Type-system integration

**Categorical fact: `native`.** Nuxt is implemented in TypeScript and ships its own types. `<script setup lang="ts">` plus `defineProps<T>()` / `defineEmits<T>()` give compile-time prop/event contracts identical to plain Vue 3 (see `research/vue.md`). On top of that, Nuxt generates project-specific types into `.nuxt/types/` — typed `useRoute().params` per page, a typed `NuxtApp`, and (via Nitro) typed `$fetch` responses against `server/api` handler return types.

**Type checking requires `vue-tsc`** (same as plain Vue) via `nuxi typecheck`, which the docs describe as "runs `vue-tsc` to check types throughout your app" (`nuxt.com/docs/4.x/api/commands/typecheck`).

**Sample type error** — wrong prop type, identical mechanism to Vue:

```vue
<!-- app/components/ProductCard.vue -->
<script setup lang="ts">
defineProps<{ price: number }>()
</script>
```

```vue
<!-- app/pages/shop.vue -->
<template>
  <ProductCard :price="'9.99'" />
</template>
```

`vue-tsc` (via `nuxi typecheck`) output:
```
error TS2322: Type 'string' is not assignable to type 'number'.
  app/pages/shop.vue:3:18
  <ProductCard :price="'9.99'" />
                ^^^^^^
```

**Documentation friction / known regression**: as of Nuxt 4.3.0 (early 2026), multiple open issues (`nuxt/nuxt#34145`, `#34212`, `#34385`) report `nuxi typecheck` failing with `TS2304: Cannot find name` and `TS2339` errors specifically for **auto-imported** symbols (`ref`, `useState`, server-side ambient types in `server/types/`) and across Nuxt Layers. This is a meaningful gap: the auto-import system that makes Nuxt's runtime ergonomics low-friction is, at the time of this review, an active source of false-positive type-checker errors — exactly the surface where a developer (or agent) most needs the type checker to be trustworthy. This was found via direct GitHub issue search, not via the official docs, which do not surface this as a known limitation.

**Score rationale: 7.0.** Native TypeScript, strong end-to-end inference for routes/`$fetch`/props, identical SFC type-checking story to Vue (7.5) — but docked a full point below Vue for the auto-import-vs-typecheck friction actively reported against the current 4.3.x/4.4.x line, which is a Nuxt-specific regression layered on top of Vue's existing `vue-tsc`-as-separate-binary cost.

### Evidence: Compiler/build feedback quality

**Deliberately broken example 1 — `useState` called with a non-serializable value** (a documented constraint: "the data inside `useState` will be serialized to JSON... it is important that it does not contain anything that cannot be serialized, such as classes, functions or symbols"):

```ts
// app/composables/useTodos.ts
export const useTodos = () => useState('todos', () => ({
  items: [],
  formatDate: (d: Date) => d.toLocaleDateString(), // function — not serializable
}))
```

This is **not caught by TypeScript or `nuxi typecheck`** — the type signature is valid TS. It surfaces only as a runtime hydration mismatch warning in the browser console (`[Vue warn]: Hydration completed but contains mismatches`) or a silent loss of the function after SSR serialization, depending on what touches the value first. No build-time signal at all — this is a Nuxt-specific footgun layered on top of an otherwise type-correct program.

**Deliberately broken example 2 — wrong HTTP-method suffix on a server route**:

```ts
// server/api/todos.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { id: crypto.randomUUID(), ...body }
})
```

```vue
<script setup>
// calling with GET against a .post.ts-only route
const { data, error } = await useFetch('/api/todos')
</script>
```

Result: `error.value` is populated with a `405 Method Not Allowed` `FetchError` at runtime — Nitro's filename-based method routing means a mismatched verb is a 405, not a build error or type error. `$fetch`'s typed-route inference (when configured) does catch this *if* the typed client knows the route only accepts POST, but the default `useFetch('/api/todos')` call on a string literal without Nitro's experimental typed-routes feature enabled compiles cleanly and fails at request time.

**Dev server overlay**: Vite-powered dev server (default since Nuxt 3) gives fast HMR and standard Vite/esbuild error overlays for syntax errors, with file:line:column pointers — same quality as plain Vite+Vue.

**Score rationale: 6.0.** SFC-level compiler feedback (template type errors via `vue-tsc`, Vite overlays for syntax errors) is on par with plain Vue (7.0). But two categories of Nuxt-specific runtime footguns — `useState` serialization violations and Nitro method-routing mismatches — produce **no compile-time signal at all** and surface as runtime warnings or HTTP errors instead, which is a step down from Vue's baseline. Docked a point further than the type-system score because this dimension specifically measures "is the error actionable and where does it point," and both of these failure modes point at symptoms (hydration mismatch, 405) rather than the root cause (serialization rule, filename convention).

### Evidence: Locality of behavior

**Feature traced**: "Add a todo item" — the same feature traced in `research/vue.md` and `research/nextjs.md`, implemented Nuxt-style: a page that lists todos fetched from a Nitro API route, with an add form.

Touchpoints required to understand or change this feature:

1. `app/pages/index.vue` — the page: `useFetch('/api/todos')` for the initial list, `<form>` with `v-model` + `@submit.prevent`, `v-for` to render the list. **~25 lines.**
2. `server/api/todos/index.get.ts` — Nitro handler returning the todo list. **~5 lines.** Separate file required: Nitro routes are filesystem-mapped, cannot be co-located with the page.
3. `server/api/todos/index.post.ts` — Nitro handler for creating a todo. **~8 lines.** A second separate file — the GET and POST handlers for the *same resource* (`/api/todos`) live in two different files because Nitro maps HTTP method to filename suffix rather than to a named export in one file.
4. `app/composables/useTodos.ts` (optional but idiomatic per the official composables guide) — wraps `useState` + the add/refresh logic so multiple components can share the list. **~10 lines.** Whether this file is "required" depends on whether state needs to be shared — for a single-page todo app it's avoidable, but the official composables pattern treats this as the convention for anything beyond a single component.

**Count: 3-4 files** (2 mandatory: page + at least one Nitro route; typically 4 once the list is split into GET/POST handlers and a shared composable). This sits between Vue's plain SFC count (2 files for the same conceptual feature, per `research/vue.md`) and Next.js's App Router count (5 files, per `research/nextjs.md`) — Nuxt's Nitro-route-per-HTTP-verb convention produces the same "one file per verb" file proliferation as Next.js Route Handlers, but without the additional `'use client'`/`'use server'` boundary files, since Nuxt has no Server Component/Client Component split.

**No documentation friction**: the server API routes pattern is documented in one place (`nuxt.com/docs/guide/directory-structure/server`) with the filename-suffix convention stated up front.

**Score rationale: 5.5.** Better than Next.js App Router's boundary-driven 5-file split, but worse than plain Vue's 2-file event-driven model — Nuxt inherits Vue's component-level locality for the UI half of the feature, then adds Nitro's filename-per-verb convention for the server half, which is a real (if smaller) file-proliferation cost relative to a framework that could co-locate GET/POST as named exports in one route module (à la Remix or SvelteKit's single `+server.js`/`+page.server.js`).

### Evidence: Explicitness / data-flow traceability

**State change traced**: User submits the "add todo" form → todo appears in the list.

| Hop | Explicit or implicit | Description |
|---|---|---|
| 1. `@submit.prevent="addTodo"` | **Explicit** | Template binding, readable in the page file |
| 2. `await $fetch('/api/todos', { method: 'POST', body: {...} })` | **Explicit** | Direct call in `addTodo`, visible in the same file |
| 3. Request routed to `server/api/todos/index.post.ts` | **Implicit** | No visible link from the `$fetch` call to the handler file — the connection is the URL string matching Nitro's filesystem route map. An agent must know the Nitro filename convention to find the handler; grep for `/api/todos` finds the call site but not the handler unless it also knows to look in `server/api/todos/`. |
| 4. `defineEventHandler` runs, mutates the database, returns the new todo | **Explicit** | Inside the handler file itself |
| 5. `await refresh()` (or `refreshNuxtData()`) re-runs `useFetch('/api/todos')` | **Explicit** | Developer-written call — no automatic dependency tracking between the POST and the GET |
| 6. `todos` ref updates → Vue reactivity → `v-for` re-renders | **Implicit** | Vue's Proxy-based reactivity scheduler — same well-understood boundary as plain Vue |
| 7. `const todos = useTodos()` — *where does `useTodos` come from?* | **Implicit** | Auto-import: no `import` statement anywhere in the page file. The symbol resolves via Nuxt's scan of `app/composables/`, which is not visible from the file itself. |

**Tally: 4 explicit hops, 3 implicit hops** (URL-to-filesystem-route mapping, Vue's reactivity scheduler, and auto-import resolution).

**Comparison**: Plain Vue's equivalent trace (`research/vue.md`) has 5 explicit / 1 implicit. Nuxt adds two implicit hops on top of Vue's baseline — one inherent to any filesystem-routed server (the URL-to-handler mapping, which Next.js and SvelteKit also have), and one that is **specific to Nuxt's design choice**: auto-imports remove the one textual clue (`import { useTodos } from '~/composables/useTodos'`) that would otherwise make hop 7 explicit. This is the auto-import tradeoff the prior version of this review identified, now placed concretely in a hop count: it's not a vague "magic" complaint, it's one specific implicit hop that a single import line would resolve.

**Score rationale: 5.0.** Below Vue's 6.5 specifically because of the two added implicit hops. The filesystem-routing hop is shared with every file-based-routing meta-framework in this corpus and isn't penalized in isolation (Next.js and SvelteKit have the same hop); the auto-import hop is the differentiator, and it's avoidable by design choice — Nuxt could require imports and would not lose its directory-convention benefits, since `components/` auto-registration and `composables/` auto-import are separable features.

### Evidence: Convention strength

**Canonical task examined**: "fetch data when a component needs it" (the same task examined for Vue in `research/vue.md`, scoped to Nuxt's additional composables).

Approaches documented in `nuxt.com/docs/getting-started/data-fetching` and the broader Nuxt docs:

1. **`useFetch(url)`** — setup-time, SSR-deduped, the docs' default recommendation for "initial component data"
2. **`useAsyncData(key, fn)`** — for custom/multi-source/transformed fetches
3. **`useLazyFetch(url)`** / **`useLazyAsyncData(key, fn)`** — non-blocking variants of 1 and 2
4. **`$fetch(url)`** directly in `<script setup>` top-level — works, but the docs explicitly say `$fetch` "does not provide network calls de-duplication and navigation prevention," i.e. don't use it for initial page data
5. **`$fetch(url)`** inside an event handler — the docs' recommended pattern for this case, *same function name as #4*, different recommended context
6. **`useFetch`/`useAsyncData` with `server: false`** — client-only fetching, a fifth variant via option flag rather than a fifth function
7. Plain Vue's `onMounted` + `fetch`/`$fetch` — still works (Nuxt is still Vue), inherited from Vue's own multi-pattern landscape (`research/vue.md` counts 4 Vue-level approaches before Nuxt's composables are added)

**Count: at least 6 distinct named approaches**, two of which (`$fetch` in setup vs. `$fetch` in a handler) share an identical call signature with opposite recommendations depending on *where in the file* the call appears — the official decision matrix (`useFetch`/`useAsyncData` for "initial page data," `$fetch` for "client-side interactions and event-based operations") requires the developer to classify their own code's timing/location correctly, which is exactly the kind of distinction an agent pattern-matching on "I need to call this API" can get wrong silently (no error — `$fetch` in setup *works*, it just loses SSR dedup).

**Documentation friction note**: the decision matrix is reasonably clear once found (`nuxt.com/docs/getting-started/data-fetching`), but it sits below five composable descriptions on one long page; the "don't use `$fetch` for initial data" guidance is a single sentence easy to skim past, and the prior version of this review (written before this rewrite) independently flagged "five overlapping data-fetching primitives" as the single biggest convention-strength weakness — this rewrite confirms that count is, if anything, conservative once the setup-vs-handler `$fetch` distinction is counted as a seventh decision point.

**Score rationale: 5.5.** Slightly above Next.js's 3.5 (Nuxt has one official, mostly-coherent decision matrix; Next.js has eight approaches spanning two router generations with no single matrix) but below Vue's 6.0 (Vue's multiple approaches are largely interchangeable stylistic choices; Nuxt's are *not* interchangeable — picking the wrong one silently degrades SSR behavior rather than just looking different).

### Evidence: Token efficiency / boilerplate density

**TodoMVC-first protocol**: no canonical reference exists. Both official Nuxt TodoMVC repositories (`github.com/nuxt/todomvc` and `github.com/nuxt/example-todomvc`) are archived (Nuxt 2, Vuex, last touched ~2021) and do not reflect Nuxt 4's Composition API / `app/` directory / Nitro conventions — using them would misrepresent the current framework. **Fallback path taken**: a fresh minimal implementation following `nuxt.com/docs/4.x/getting-started/data-fetching` and `nuxt.com/docs/4.x/getting-started/state-management`, scoped to TodoMVC's core operations (list, add, toggle, delete) against a Nitro in-memory API.

**File breakdown**:

| File | Lines | Role |
|---|---|---|
| `app/pages/index.vue` | 28 | Page: `useFetch` for list, form for add, `v-for` with toggle/delete buttons |
| `server/api/todos/index.get.ts` | 4 | List todos |
| `server/api/todos/index.post.ts` | 6 | Create todo |
| `server/api/todos/[id].patch.ts` | 6 | Toggle completed |
| `server/api/todos/[id].delete.ts` | 5 | Delete todo |
| `server/utils/store.ts` | 6 | Shared in-memory array (module-level, server-side only — safe because Nitro server code is per-request in production but this dev-only store is illustrative) |
| **Total** | **55** | |

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const { data: todos, refresh } = await useFetch('/api/todos')
const newTitle = ref('')

async function addTodo() {
  if (!newTitle.value.trim()) return
  await $fetch('/api/todos', { method: 'POST', body: { title: newTitle.value } })
  newTitle.value = ''
  await refresh()
}
async function toggle(id: string, completed: boolean) {
  await $fetch(`/api/todos/${id}`, { method: 'PATCH', body: { completed: !completed } })
  await refresh()
}
async function remove(id: string) {
  await $fetch(`/api/todos/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <form @submit.prevent="addTodo">
    <input v-model="newTitle" placeholder="What needs doing?" />
    <button type="submit">Add</button>
  </form>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      <input type="checkbox" :checked="todo.completed" @change="toggle(todo.id, todo.completed)" />
      <span :class="{ done: todo.completed }">{{ todo.title }}</span>
      <button @click="remove(todo.id)">×</button>
    </li>
  </ul>
</template>
```

**Comparison**: Vue's plain TodoMVC (`research/vue.md`) is 232 lines total / 180 lines of component logic, but that includes routing (`/`, `/active`, `/completed` views) and an edit-in-place UI that this minimal version omits. For the *equivalent scope* (list/add/toggle/delete, no filter routes, no inline edit), Nuxt's 55 lines is markedly leaner — almost entirely because `useFetch` + Nitro routes replace what would otherwise be a hand-written fetch/state layer, and because the comparison strips out the filter-routing scaffolding that inflates the Vue count.

**Score rationale: 7.5.** The combination of `useFetch`'s SSR-aware ergonomics, auto-imports removing all import lines, and Nitro's terse `defineEventHandler` + filename-routing produces a genuinely low line count for a full-stack (client + server) feature. This is the flip side of the locality/explicitness costs documented above: the same conventions that cost hops and files also remove lines.

### Evidence: Familiarity composite

**1. `first_released`: 2016** (as Nuxt.js, originally a Vue SSR framework inspired by Next.js) — 10 years old, but the framework's identity has shifted significantly (Nuxt 2 → 3 was a near-total rewrite: Vue 2→3, Webpack→Vite/Nitro, Options API → Composition API as the primary idiom). Pretraining material from the Nuxt 2 era (2018-2020) reflects a substantially different API surface (Vuex stores, `asyncData`/`fetch` page hooks, `nuxt.config.js` options format) than current Nuxt 4.

**2. GitHub stars**: `nuxt/nuxt` has approximately 60.4k stars as of June 2026 — roughly 8x smaller than Next.js (`vercel/next.js`, ~130-140k) and slightly larger than Vue core's 53.8k (though Vue and Nuxt aren't directly comparable categories).

**3. npm weekly downloads (registry trend)**: `nuxt` package downloads were **859,310** for the week of 2025-05-25 and **1,705,293** for the week of 2026-05-25 (npm API, both queried directly) — roughly **2x year-over-year growth**. Direction: clearly up. In absolute terms this is far below `next` (27-39M/week) and `vue` (~12.5M/week), reflecting that Nuxt's installs are concentrated in app-shell projects rather than as a widely-transitive dependency.

**4. SO/community volume**: the Stack Overflow 2025 Developer Survey's published technology breakdowns do not report a separate Nuxt line item (Vue is reported, Nuxt is not broken out at the same granularity as React/Next.js/Angular/Svelte/SvelteKit) — itself a data point: Nuxt's community footprint, while real and growing, is not yet at the tier that gets its own row in the survey's headline tables, unlike SvelteKit which the corpus's other reviews note does appear.

**Triangulation**: Nuxt is old by name (2016) but young by current API surface (Nuxt 3's Composition-API-first identity dates to late 2022, Nuxt 4's `app/` directory to mid-2025) — the familiarity-relevant "age" is closer to 3-4 years than 10. GitHub activity and npm growth both show a healthy, growing-but-not-dominant project. The combination of (a) a meaningfully different API surface from the Nuxt 2 era that's well-represented in older training data, (b) a smaller absolute install base than Next.js or even bare Vue, and (c) no SO survey line item, place this below Vue (8.5) and well below Next.js (9.0).

**Score rationale: 6.5.** Real, growing, actively-developed — but the Nuxt-2-vs-Nuxt-3/4 API discontinuity is a genuine pretraining-mismatch risk (a model recalling `asyncData()` page hooks or Vuex `store/` modules will write incorrect Nuxt 4 code), and the absolute community-volume proxies (downloads, SO presence) are meaningfully smaller than the meta-framework category leaders.

### Evidence: Stability / convention durability

Cited from `next_release` (frontmatter above).

**`next_release.stability_penalty: false`.** Nuxt 4.0 (July 2025) was explicitly scoped by the Nuxt team as a *stability* release — the `compatibilityVersion: 4` opt-in flag let Nuxt 3.x projects adopt the new `app/` directory structure, data-fetching dedup changes, and shallow-by-default reactivity incrementally before 4.0 made them default. The 4.x line (current 4.4.8) has been incremental since: 4.1 → 4.2 → 4.3 → 4.4 releases are feature-additive (new composables, DevTools improvements) without the kind of sweeping convention change documented for Next.js 14→15→16's three different caching models.

**Nuxt 5 is on the roadmap** (`nuxt.com/docs/4.x/community/roadmap`) with **Nitro v3** named as the headline change, but as of this review has no RFC, alpha build, or breaking-change list published — only "scheduled." Per the methodology, an `announced`-status item with no published breaking-change list and no alpha does not trigger the stability penalty; it's tracked but not yet evidence of imminent disruption. The roadmap explicitly separates Nuxt 4 (stability-focused, shipped) from Nuxt 5 (infrastructure-focused, unscheduled-in-detail) — a deliberate phasing the Next.js team did not do across its 14/15/16 caching-model churn.

**Historical context that *does* weigh on the score**: Nuxt 2 → 3 (2020-2022) was a near-total rewrite — new reactivity model (Vue 2→3), new build tooling (Webpack→Vite), new server engine (Nitro replacing the Express-based connect middleware), and a new primary API style (Composition API replacing `asyncData`/`fetch` page-option hooks and Vuex). That migration is well in the past (Nuxt 2 reached end-of-maintenance), but it establishes that Nuxt's major-version boundaries have historically been larger than Vue's — Vue 3→3.6 (Vapor) is additive (per `research/vue.md`); Nuxt 2→3 was not.

**Score rationale: 6.0.** The current 4.x line is stable and incremental (supporting a higher score), but Nuxt 5 / Nitro v3 is a named, roadmapped major version with an unknown breaking-change surface for the `server/` half of every Nuxt app, and the framework's history (Nuxt 2→3) shows major versions here have historically been more disruptive than Vue's. Scored below Vue (7.5, additive Vapor Mode) and above Next.js (4.5, three caching-model rewrites in three consecutive majors) — Nuxt 5 is a known unknown rather than an actively-landing rewrite.

### Evidence: Ecosystem tooling facts

- **Nuxt DevTools**: YES (first-party, built into the dev server, toggle via the floating icon or `Shift+Alt+D`) — browser panel showing routes, components, composables/auto-imports with source locations, server routes (Nitro), payload, timeline, and a Vitest runner integration. `nuxt.com/docs` (Nuxt DevTools section). This is the single tool that most directly mitigates the auto-import locality cost: it can answer "where does `useTodos` come from?" even though the source file cannot.

- **Test utilities**: YES — `@nuxt/test-utils` (first-party) provides a Nuxt-aware test environment for Vitest, with `nuxt test` CLI command and a DevTools-integrated Vitest runner (`nuxt.com/docs/4.x/getting-started/testing`, `nuxt.com/docs/4.x/api/commands/test`). `@vue/test-utils` for component-level tests (shared with plain Vue). Playwright for E2E.

- **IDE / LSP support**: YES — "Vue - Official" VS Code extension (Volar) provides the same template type-inference as plain Vue, plus Nuxt-specific support for auto-imports (resolving `.nuxt/imports.d.ts`) and `definePageMeta`/`useFetch` typing. JetBrains WebStorm has built-in Vue/Nuxt support.

- **Type checking**: YES — `nuxi typecheck` wraps `vue-tsc`, generates `.nuxt/types/` (typed routes, typed `$fetch`, typed `useState` keys when used via composable wrappers) — see the type-system evidence above for the current auto-import-related regression in 4.3.x.

- **CLI / scaffolding**: YES — `nuxi` (the Nuxt CLI): `nuxi init`, `nuxi dev`, `nuxi build`, `nuxi typecheck`, `nuxi analyze`, `nuxi upgrade`.

- **Module ecosystem**: YES — `@nuxt/image`, `@nuxtjs/tailwindcss`, `@pinia/nuxt`, `@nuxt/content`, `@nuxt/ui` (official component library) and a large community module directory at `nuxt.com/modules`. Most cross-cutting integrations are a one-line `modules: [...]` config addition.

- **Deployment**: YES — Nitro compiles one build to dozens of presets (Vercel, Netlify, Cloudflare Workers/Pages, AWS Lambda, Node, static) from a single codebase, configured via `nitro.preset` or auto-detected.

**Score rationale: 8.0.** Nuxt DevTools is genuinely best-in-class framework-level introspection — arguably the strongest single devtool in this corpus for *answering the auto-import "where is this from" question* that the framework's own design otherwise obscures. First-party test utilities, typed routes, and the module ecosystem round out a mature toolchain. Held below Vue (8.5) and Next.js (9.0) only because the current `nuxi typecheck` regression (type-system evidence above) represents an active gap in the type-checking leg of the toolchain at the time of this review.

## On the Horizon

### Next release

- **Name/version:** Nuxt 5 (Nitro v3)
- **Status:** announced
- **What's changing:** Per `nuxt.com/docs/4.x/community/roadmap`, Nuxt 5 is the next major version, planned to bundle "an upgrade to Nitro v3 and additional changes" — the heavier infrastructure work deliberately deferred out of the stability-focused Nuxt 4.0. No RFC, alpha, or detailed breaking-change list is published as of this review.
- **Anticipated impact:** Primarily affects the `server/` half of Nuxt apps (Nitro route handlers, deployment presets, dev server internals) rather than Vue component code. If it lands, the "Server API Routes (Nitro)" pattern and the locality/tooling evidence citing Nitro conventions in this review should be re-verified against Nitro v3's API. Vue-level evidence (component model, `<script setup>`, `defineProps`/`defineEmits`) is governed by `research/vue.md` and Vue 3.6 Vapor Mode tracking, which is a largely independent axis.
- **Stability penalty:** No — `next_release.stability_penalty: false`. An `announced`-status item with no published breaking-change list, alpha, or RFC does not yet constitute evidence of imminent disruption, per the methodology. Tracked for the next pass.

### AI-tooling investment

- **What exists:** `nuxt.com/llms.txt` (~5K token structured doc index) and `nuxt.com/llms-full.txt` (full docs corpus, reported ~1M+ tokens) are published and documented at `nuxt.com/docs/4.x/guide/ai/llms-txt`. `nuxt-mcp` (`github.com/antfu/nuxt-mcp`) is a dev-time MCP server — by Anthony Fu, a Vue/Nuxt core team member, but distributed under his personal GitHub account rather than the `nuxt/` org, so classified `community` rather than `first-party` — that exposes a running Nuxt app's routes, components, composables, and auto-imports to MCP-compatible agents (Claude Code, Cursor, Windsurf) at `http://localhost:3000/__mcp/sse`, with automatic editor config registration. Separately, Nuxt UI v4 ships an official, stable MCP server providing live component/API info for the Nuxt UI library specifically (`ui.nuxt.com` AI section) — narrower in scope than a whole-framework MCP server. No Laravel-Boost-style curated guidelines package or AI-specific style guide was found from the Nuxt team.

- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter for the full transcript. Summary: running the canonical todo-list exercise with `nuxt.com/llms.txt` loaded corrected two convention-strength confusions documented above — the model used `$fetch` (not `useFetch`) inside the event handler, and `useState` (not Pinia) for shared list state. Neither pass — with or without `llms.txt` — produced an `import` statement for auto-imported symbols, because both the framework's docs and the agent's baseline behavior already treat auto-imports as ambient; the tooling addresses the *which-composable* convention-strength problem but does not touch the auto-import locality/explicitness problem, which is closer to a property of the file format itself than something a documentation index can patch.
