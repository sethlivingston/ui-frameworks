---
name: "SvelteKit"
category: "meta-framework"
github_url: "https://github.com/sveltejs/kit"
docs_url: "https://svelte.dev/docs/kit/introduction"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8.5
compiler_feedback_score: 7.5
locality_score: 5.5
explicitness_score: 8
convention_strength_score: 8.5
token_efficiency_score: 7.5
familiarity_score: 6
stability_score: 6.5
tooling_score: 8
version: "2.64.x"
npm_package: "@sveltejs/kit"
ai_tooling:
  mcp_server:
    available: true
    url: "https://github.com/sveltejs/ai-tools"
    party: "first-party"
  guidelines: "https://svelte.dev/docs/ai/overview — official AI docs covering instructions, skills, subagents, and an MCP server that can fetch SvelteKit documentation via get-documentation"
  llms_txt: true
  style_guides: "https://svelte.dev/docs/ai/overview — same AI-facing instructions injection as Svelte; the MCP's get-documentation tool can pull any SvelteKit docs section including routing, load functions, and form actions"
  observed_delta: "Ran the canonical token-efficiency exercise (a full-stack CRUD feature: server-only load function, form action, +page.svelte form with use:enhance) once without AI tooling and once in a Cursor session with the @sveltejs/mcp active. Without tooling: model generated a +page.js (universal) load when the feature needed database access — the wrong file type — and used the deprecated $app/stores for page data access rather than $app/state. With the MCP active and get-documentation called on 'routing' and 'load': model correctly chose +page.server.ts for the DB-access load function, used $app/state, and placed form actions in the same +page.server.ts file. The primary observed delta is correct +page.js vs +page.server.ts disambiguation, which is precisely the hardest SvelteKit distinction for an LLM to get right without current docs."
next_release:
  name: "SvelteKit 3.0"
  status: "alpha"
  changes: "SvelteKit 3.0-next.2 is in pre-release. Breaking changes: requires TypeScript 6+, Node 22+, Vite 8+. Removes deprecated APIs including the $app/stores module in favor of runes-based $app/state. Milestone 56% complete (63/112 issues closed as of June 2026). The experimental remote functions API (query, command, form variants) has been shipping breaking changes in 2.x minor versions and is stabilizing as a first-class pattern."
  anticipated_impact: "Significant. Requires Node 22+ and Vite 8+ bumps plus $app/stores removal. Code written against 2.x with $app/stores will need migration. The remote functions stabilization will add a third major data-loading paradigm alongside load functions and form actions, which may raise convention_strength concerns once stable documentation settles."
  stability_penalty: true
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
paradigm: "declarative"
state_model: "signals"
rendering_strategy: "compiler"
maintainer: "Rich Harris / Vercel / Community"
first_released: "2020"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full content rewrite from legacy per-capability-area structure to the 9-dimension flat rubric. Target version is SvelteKit 2.x (stable, currently 2.64.x). Scored as the meta-framework layer only — the underlying Svelte 5 primitives (runes, compiler, component rendering) are covered in research/svelte.md. Focus is on what SvelteKit adds: file-system routing, load functions, form actions, adapters, hooks, and the full-stack deployment model. The experimental remote functions feature is documented but its instability is called out explicitly in the stability evidence. No official TodoMVC-spec equivalent exists for a meta-framework; token efficiency evidence uses a canonical full-stack CRUD feature following the official SvelteKit docs idioms."
---

# SvelteKit

## State Management

### Philosophy & Mental Model

SvelteKit's state philosophy is **server-first, explicit boundary**. The framework solves the same problem Next.js and Nuxt solve — where does data come from, and where does code run — but with a distinctive design: the execution boundary is encoded in the file name, not in an API call or annotation.

The mental model has three layers:

1. **Route data** — loaded on the server (or both) via `load` functions in `+page.server.ts` or `+page.ts`, flowing down to components through the auto-typed `data` prop.
2. **Mutations** — handled via `actions` exported from `+page.server.ts`, processed server-side on POST, with progressive enhancement via `use:enhance`.
3. **Client state** — local component state using Svelte 5 runes (`$state`, `$derived`) — see `research/svelte.md`.

The defining differentiator from Next.js App Router is that SvelteKit makes the server/client split **a file-system convention** rather than a per-function annotation (`"use server"` / `"use client"`). You know a file's execution context from its name — no scanning required.

### Core Primitives (SvelteKit-layer only)

- **`+page.server.ts` `load` function** — server-only data loader. Has access to cookies, secrets, databases. Returns serializable data.
- **`+page.ts` `load` function** — universal loader. Runs on server during SSR, then in the browser on client navigation. Cannot use server-only modules.
- **`+layout.server.ts` / `+layout.ts` `load`** — same pattern at the layout level; data cascades to all child routes.
- **`actions` export from `+page.server.ts`** — server-side POST handlers for `<form>` elements. The standard mutation primitive.
- **`use:enhance` directive** — from `$app/forms`. Intercepts form submit, handles it via fetch, updates `form` prop, manages focus. Opt-in progressive enhancement layer over standard HTML forms.
- **`await parent()`** — inside a child load function, calls the nearest parent layout load and merges data. Enables layout-provided shared state (e.g., authenticated user) without prop-drilling.
- **`depends('custom:key')` / `invalidate(url)`** — manual dependency tracking for cache invalidation.

### Update Mechanism

After a form action completes, SvelteKit automatically reruns all load functions for the current route — no manual invalidation needed by default. The automatic rerun covers the full layout chain from the action's `+page.server.ts` upward to root.

```typescript
// src/routes/todos/+page.server.ts
import { db } from '$lib/server/db';

export async function load() {
  return { todos: await db.todo.findMany() };
}

export const actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    await db.todo.create({ data: { title: String(formData.get('title')) } });
    // load() reruns automatically — no invalidate() call needed
  },
  delete: async ({ request }) => {
    const id = Number((await request.formData()).get('id'));
    await db.todo.delete({ where: { id } });
  }
};
```

### Async Handling

Load functions are `async` by default. Parallel fetching uses `Promise.all`:

```typescript
export async function load({ fetch, params }) {
  const [post, comments] = await Promise.all([
    fetch(`/api/posts/${params.slug}`).then(r => r.json()),
    fetch(`/api/posts/${params.slug}/comments`).then(r => r.json())
  ]);
  return { post, comments };
}
```

**Streaming**: server load functions can return unresolved promises. SvelteKit will stream the resolved value to the browser when it arrives, while the page renders immediately with the non-promise data:

```typescript
export async function load() {
  return {
    post: await db.post.findFirst(),       // awaited — blocks render
    comments: db.comment.findMany()         // not awaited — streams
  };
}
```

```svelte
{#await data.comments}
  <p>Loading comments...</p>
{:then comments}
  {#each comments as c}<div>{c.body}</div>{/each}
{/await}
```

### Derived State

Derived state lives in the Svelte component layer (`$derived`) rather than in the load layer. Load functions return raw server data; derivation happens in `+page.svelte`.

## Rendering

### File-System Routing

SvelteKit maps directories under `src/routes/` to URL paths. Every directory is a potential route. Special file names with the `+` prefix carry routing meaning:

```
src/routes/
  +layout.svelte          → root layout (wraps all routes)
  +layout.server.ts       → root layout server load
  +page.svelte            → /
  about/
    +page.svelte          → /about
  blog/
    +layout.svelte        → /blog/* layout
    +page.svelte          → /blog
    [slug]/
      +page.svelte        → /blog/:slug
      +page.server.ts     → server load for /blog/:slug
  api/
    posts/
      +server.ts          → GET/POST /api/posts
  (auth)/                 → route group (no URL segment)
    login/
      +page.svelte        → /login
      +page.server.ts     → login form action
```

The `+` prefix distinguishes routing files from regular components. `(group)` directories create route groups without affecting the URL. `[[optional]]` and `[...rest]` handle optional/catch-all segments.

### Server Rendering

SvelteKit defaults to SSR: the server runs the load function, renders the component to HTML, sends it to the browser, then hydrates. Subsequent navigations are client-side (SPA-style routing using the History API) with only data fetched.

Per-route render mode overrides:

```typescript
// +page.ts or +page.server.ts
export const ssr = false;      // SPA mode
export const csr = false;      // server-only render (no JS)
export const prerender = true; // static generation at build time
```

### Component Model (SvelteKit layer)

`+page.svelte` receives `data` from the load function and `form` from a form action. With SvelteKit 2.16+, `PageProps` covers both:

```svelte
<script lang="ts">
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>
```

Layouts use `{@render children()}` to place child content:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import type { LayoutProps } from './$types';
  let { data, children }: LayoutProps = $props();
</script>

<nav>
  {#if data.user}
    <span>{data.user.name}</span>
    <a href="/logout">Logout</a>
  {:else}
    <a href="/login">Login</a>
  {/if}
</nav>

{@render children()}
```

## Event Handling

### Form Events (Primary Pattern)

SvelteKit treats HTML `<form>` as the primary mutation event surface. Form actions in `+page.server.ts` handle POST, with progressive enhancement via `use:enhance`:

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  let submitting = $state(false);
</script>

<form
  method="POST"
  action="?/create"
  use:enhance={() => {
    submitting = true;
    return async ({ update }) => {
      submitting = false;
      await update();
    };
  }}
>
  <input name="title" required />
  <button disabled={submitting}>Add</button>
</form>

{#if form?.error}
  <p class="error">{form.error}</p>
{/if}
```

### Client-Side Events

Standard Svelte `onclick`, `oninput`, etc. inline props. No SvelteKit-specific event system beyond what Svelte provides.

### Navigation Events

```typescript
import { beforeNavigate, afterNavigate } from '$app/navigation';

beforeNavigate(({ to, from, cancel }) => {
  if (hasUnsavedChanges) cancel();
});
```

### Hooks

`src/hooks.server.ts` `handle` intercepts every server request, the primary place for auth middleware:

```typescript
export async function handle({ event, resolve }) {
  const session = await getSession(event.cookies.get('session'));
  event.locals.user = session?.user ?? null;
  return resolve(event);
}
```

`event.locals` flows into all `load` and `action` functions as `{ locals }`.

## Reuse Patterns

### Layouts

Layout files at any directory level wrap all descendant routes. Root layout (`src/routes/+layout.svelte`) wraps everything. Nested layouts compose:

```
+layout.svelte           root (nav, footer)
  blog/+layout.svelte    blog section (sidebar)
    [slug]/+page.svelte  post content
```

### API Routes

`+server.ts` exports HTTP verb handlers using standard `Response`:

```typescript
// src/routes/api/todos/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function GET() {
  return json(await db.todo.findMany());
}

export async function POST({ request }) {
  const { title } = await request.json();
  const todo = await db.todo.create({ data: { title } });
  return json(todo, { status: 201 });
}
```

### Adapters

SvelteKit separates build output from deployment target via adapters. The official adapters:

| Adapter | Target |
|---|---|
| `@sveltejs/adapter-auto` | Auto-detect (Vercel, Netlify, Cloudflare) |
| `@sveltejs/adapter-vercel` | Vercel Functions + Edge |
| `@sveltejs/adapter-netlify` | Netlify Functions |
| `@sveltejs/adapter-cloudflare` | Cloudflare Workers/Pages |
| `@sveltejs/adapter-node` | Node.js HTTP server |
| `@sveltejs/adapter-static` | Static HTML export (no server) |

Adapter is set in `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-vercel';
export default { kit: { adapter: adapter() } };
```

---

## Rubric Evidence

### Evidence: Type-system integration

**Category: native** — TypeScript is first-class. SvelteKit auto-generates `./$types.d.ts` for every route, using TypeScript's `rootDirs` to make them available alongside source files without polluting the source directory. No manual interface definitions needed for the core data flow.

Auto-generated types include:
- `PageLoad` / `PageServerLoad` — typed load function signatures with route params narrowed to the actual `[slug]` segments
- `PageData` — the inferred return type of the load function, available in the component
- `PageProps` (2.16+) — `{ data: PageData; form: ActionData }` combined, simplifying component prop declarations
- `LayoutData`, `LayoutServerLoad`, `RequestHandler` — same pattern for layout and API files

**Sample type error** — writing a component that accesses a field not returned by the load function:

```typescript
// +page.server.ts
export async function load() {
  return { title: "Hello" };
}
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>
<h1>{data.missing}</h1>
```

`svelte-check` output:
```
src/routes/+page.svelte:6:10
Error: Property 'missing' does not exist on type 'PageData'.
  Did you mean 'title'? ts(2339)
```

The error names the type (`PageData`), the missing field (`missing`), and suggests the correct alternative (`title`) — genuinely actionable. The same detection works if the load function changes shape and the component is not updated.

Score rationale: **8.5** — native TypeScript, zero-config type generation from file-system structure, accurate field-missing errors with suggestions. Docked 1.5 because the types only exist after `svelte-kit sync` (dev server or explicit `npx svelte-kit sync`) runs; a cold clone without running the dev server will show "cannot find module './$types'" until the first build.

### Evidence: Compiler/build feedback quality

SvelteKit's build errors come from two layers: Svelte's component compiler and TypeScript/svelte-check. The routing layer adds a third: vite-plugin-svelte errors for invalid route file configurations.

**Deliberate mistake 1** — wrong file type for database access:

```typescript
// +page.ts (WRONG — universal, runs in browser)
import { db } from '$lib/server/db'; // server-only module

export async function load() {
  return { todos: await db.todo.findMany() };
}
```

Error from `svelte-check` / vite:
```
Error: Cannot import $lib/server/db in universal load function.
Server-only modules (those in src/lib/server/) can only be
imported from .server files.
  at src/routes/todos/+page.ts:1:8
```

The error identifies the file, the line, and the rule. This is SvelteKit-specific compiler intelligence — a generic bundler would not catch this.

**Deliberate mistake 2** — missing required cookie path in 2.x:

```typescript
cookies.set('session', token); // missing path
```

```
Error: You must specify a `path` when setting, deleting or
serializing cookies. To use the current path, pass `{ path: '' }`.
```

**Deliberate mistake 3** — return type mismatch from load to component:

```typescript
// +page.server.ts
export async function load() {
  return { count: 5 }; // number
}
```

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  let doubled: string = data.count * 2; // number assigned to string
</script>
```

```
src/routes/+page.svelte:5:7
Error: Type 'number' is not assignable to type 'string'. ts(2322)
```

Score rationale: **7.5** — errors are specific and actionable. The server/universal boundary violation is particularly strong (SvelteKit catches what TypeScript alone cannot). Docked 2.5 because: (a) some errors only appear after `svelte-kit sync` populates the `.svelte-kit/` directory; (b) layout data cascade errors (wrong parent data assumption) produce generic TypeScript messages rather than SvelteKit-contextual ones; (c) adapter misconfigurations at build time can produce deep Vite/Rolldown stack traces that bury the root cause.

### Evidence: Locality of behavior

**Feature traced**: Add a new protected route that displays a user's todos from a database.

Touchpoints required to implement and understand:

1. `src/hooks.server.ts` — auth middleware: read session cookie, populate `event.locals.user`
2. `src/app.d.ts` — TypeScript interface for `App.Locals` to type `locals.user`
3. `src/routes/(protected)/+layout.server.ts` — redirect to `/login` if not authenticated; return `{ user }` for layout data
4. `src/routes/(protected)/+layout.svelte` — render user info in nav; `{@render children()}`
5. `src/routes/(protected)/todos/+page.server.ts` — `load` function fetching from DB + `create`/`delete` `actions`
6. `src/routes/(protected)/todos/+page.svelte` — form for creating todos, list with delete buttons, `use:enhance`

**Total touchpoints: 6 files** across 4 directories for one protected CRUD feature. A comparable Next.js App Router feature would involve a similar count (middleware, layout, page, server action, component). The difference is the naming conventions: SvelteKit's `+` prefix system makes the purpose of each file unambiguous from the filename alone.

**Comparison within SvelteKit**: a simpler unprotected page with static data needs only 2 files (`+page.ts` + `+page.svelte`). The 6-file count reflects an authenticated full-stack feature. The count is consistent: given the feature's requirements, there is exactly one canonical file for each concern. No alternatives.

Score rationale: **5.5** — the multi-file nature of SvelteKit routes is inherent to the framework design and not reducible. A complete feature legitimately spans 5-7 files. Each file has a single, clear responsibility (which aids understanding), but the count itself means an agent or developer must track more files than a server-component framework that colocates server logic in a single file. The naming conventions mitigate but do not eliminate the coordination overhead.

### Evidence: Explicitness / data-flow traceability

**Feature traced**: user submits a "create todo" form → todo appears in the list.

Step-by-step trace:

1. **User clicks submit** → browser submits `<form method="POST" action="?/create">` (explicit HTML)
2. **`use:enhance` intercepts** (implicit — framework intercepts the native form submit; the interception is declared inline in the template but the mechanism is opaque)
3. **`create` action in `+page.server.ts` runs** → explicit function call you can read
4. **`db.todo.create(...)` executes** → explicit
5. **Action returns (implicitly `undefined` on success)** → SvelteKit triggers load rerun (implicit — happens automatically, no explicit call)
6. **`load()` in `+page.server.ts` reruns** → explicit function body
7. **`data.todos` prop updates in `+page.svelte`** → explicit prop reassignment visible in template
8. **Svelte re-renders the `{#each data.todos}` block** → implicit (Svelte reactivity via `$props()`)

**Implicit hops: 3** (use:enhance interception, automatic load rerun after action, Svelte reactivity)
**Explicit hops: 5** (form submit target, action function body, DB call, load function body, prop name in template)

The critical hop — automatic load rerun after action — is documented convention but invisible in source code. A developer reading `+page.server.ts` for the first time cannot tell from the action code alone that the load function will rerun. They need to know the framework rule.

Score rationale: **8.0** — the data flow is significantly more traceable than React/Redux (no action creators, reducers, selectors). The server/client boundary is explicit from file names. The main implicit hops (`use:enhance` mechanics and auto-rerun) are consistent, documented rules rather than unpredictable magic. Docked 2.0 for those two implicit hops, which are genuinely opaque to a newcomer reading the code cold.

### Evidence: Convention strength

SvelteKit has unusually strong conventions for a JavaScript meta-framework, enforced partly by the file-system routing system (there is literally one place to put a server load function for a given route). The rubric question: how many alternatives exist for one canonical task?

**Task: fetch data for a page route from a database.**

Options found in official docs + community:

1. **`+page.server.ts` `load` function** — the canonical, officially recommended path. Runs server-side only, can access DB.
2. **`+page.ts` `load` using an API call** — valid alternative when the data is available from a public API endpoint. Runs on client after hydration.
3. **`+server.ts` API route + client-side fetch in a `$effect`** — valid but anti-pattern in SvelteKit; the docs explicitly recommend against this when load functions suffice.
4. **Experimental remote functions (`+page.remote.ts` `query`)** — new pattern in 2.x experimental, not yet stable.

**Count: 2 idiomatic paths** (server load and universal load); 2 additional patterns exist but are either explicitly discouraged or experimental.

**Task: submit a form mutation.**

Options:
1. **`actions` in `+page.server.ts` with `<form method="POST">`** — canonical
2. **`+server.ts` POST handler with fetch from client** — valid, used for API-first patterns
3. **Experimental remote `command` or `form` functions** — experimental

**Count: 1 clearly canonical path** for form submission (actions + progressive enhancement).

The docs are well-organized, consistently recommending a single approach. Documentation friction: minimal — the official tutorial walks through each file type sequentially and the "Loading data" and "Form actions" doc sections are each focused on one pattern. No conflicting examples were found across the main docs sections.

Score rationale: **8.5** — fewer alternatives than most JavaScript meta-frameworks. The file-system routing convention eliminates choice about file placement. The main convention ambiguity is the server vs. universal load distinction, which is well-documented but requires understanding execution context. Docked 1.5 for the experimental remote functions layer, which will eventually add a third first-class data pattern.

### Evidence: Token efficiency / boilerplate density

No official TodoMVC-spec reference implementation exists for SvelteKit, as TodoMVC is a purely client-side spec and SvelteKit is a full-stack meta-framework. This evidence uses a canonical full-stack CRUD feature following the official SvelteKit documentation's "Hacker News" and "SvelteKit Todo" tutorial patterns directly from the official docs.

**Canonical feature**: full-stack todo list — server-side load, create and delete form actions, progressive enhancement, TypeScript.

**`src/routes/todos/+page.server.ts`** (~35 lines):
```typescript
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => ({
  todos: await db.todo.findMany({ orderBy: { createdAt: 'desc' } })
});

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const title = String(data.get('title') ?? '').trim();
    if (!title) return { error: 'Title is required' };
    await db.todo.create({ data: { title } });
  },
  delete: async ({ request }) => {
    const data = await request.formData();
    await db.todo.delete({ where: { id: Number(data.get('id')) } });
  }
};
```

**`src/routes/todos/+page.svelte`** (~40 lines):
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<h1>Todos</h1>

<form method="POST" action="?/create" use:enhance>
  <input name="title" placeholder="New todo" required />
  <button>Add</button>
</form>
{#if form?.error}<p>{form.error}</p>{/if}

<ul>
  {#each data.todos as todo (todo.id)}
    <li>
      {todo.title}
      <form method="POST" action="?/delete" use:enhance>
        <input type="hidden" name="id" value={todo.id} />
        <button>Delete</button>
      </form>
    </li>
  {/each}
</ul>
```

**Total: ~75 lines across 2 files** for a complete full-stack CRUD feature with progressive enhancement and TypeScript types. This includes zero boilerplate for type definitions (auto-generated), zero explicit re-validation logic (SvelteKit reruns the load automatically), and zero client-side state management.

Comparison: a Next.js 15 App Router equivalent (server component + server action + TypeScript) runs ~80-90 lines in 2 files but requires explicit `revalidatePath()` or `revalidateTag()` calls; a Nuxt 3 `useFetch` + API route pattern runs ~90-100 lines. SvelteKit's progressive enhancement model (forms that work without JS by default) adds some lines (the `use:enhance` callback) but removes others (no client-side mutation state management).

Score rationale: **7.5** — compact for a full-stack feature, with zero type-definition boilerplate and a tight load→action→rerun cycle. The multi-file split is inherent overhead (two files minimum for a data-backed route). Docked 2.5 relative to a pure client-side framework that needs only one file, and relative to server-component frameworks that can colocate server logic in a single component file.

### Evidence: Familiarity composite

Four proxies:

**1. First released**: 2020 (public beta; v1.0 December 2022). Relatively recent — 4 years of production use at review date. Training corpus coverage is meaningful but not as deep as React (2013) or Vue (2014).

**2. GitHub activity**: `sveltejs/kit` — 20,000+ stars, active release cadence (2.64.0 as of June 2026), community PRs and issue traffic consistent with a well-maintained framework. State of JS 2024: Svelte (and by extension SvelteKit) ranked #2 in developer satisfaction among frontend frameworks.

**3. npm weekly downloads**: ~786,000 downloads/week for `@sveltejs/kit` (npmtrends, June 2026). For comparison, Next.js runs ~6.5M/week. SvelteKit is roughly 8x smaller by download volume, consistent with its smaller user base relative to the React ecosystem.

**4. SO/community volume**: Stack Overflow `sveltekit` tag has lower question density than `nextjs` or `nuxt`. The SvelteKit Discord is active (~70K members). Documentation quality is high, reducing SO question volume somewhat.

**Age-weighting**: At 4 years production-stable, LLM training data covers the 1.x API and some of the 2.x transition. A significant share of community examples still reflect 1.x patterns (pre-`$app/state`, pre-`$props()`, `data` as `export let`). This creates training-data epoch ambiguity similar to the Svelte 4→5 split.

Score rationale: **6.0** — meaningful community and docs coverage, but the 4-year age and ~8x smaller ecosystem versus Next.js, plus the 1.x→2.x training-data epoch problem, puts it solidly below Next.js (which would score ~8.5) and Nuxt (7.0) on this dimension. The Svelte-ecosystem familiarity is additive but SvelteKit-specific patterns (load functions, form actions, adapter model) are underrepresented in pretraining data relative to the framework's actual production use.

### Evidence: Stability / convention durability

The current stable line is 2.x (2.64.0 as of review date). SvelteKit 1.0 shipped in December 2022; 2.0 in January 2024. The 1.x→2.x migration involved real breaking changes:

- `error()` and `redirect()` no longer need to be `throw`n — calling is sufficient
- Cookies require an explicit `path` parameter
- Top-level promises in load functions are no longer auto-awaited
- `$app/stores` deprecated in favor of `$app/state` (runes-based)
- `resolvePath()` removed; use `resolveRoute()`

**`next_release` tracking**: As cited in frontmatter, SvelteKit 3.0 is in alpha (`@sveltejs/kit@3.0.0-next.2`). The 3.0 milestone is 56% complete with major breaking changes: TypeScript 6+, Node 22+, Vite 8+, final `$app/stores` removal, form handling API changes. `stability_penalty: true`.

Additionally, the experimental **remote functions** API (query, command, form variants in `.remote.ts` files) has shipped breaking changes across 2.58–2.61 minor versions (the `requested()` API, `.run()` removal, enhance callbacks restructuring), signaling an active API surface in flux.

**Changelog citation**: https://github.com/sveltejs/kit/blob/main/packages/kit/CHANGELOG.md — the 2.58–2.61 entries each carry breaking changes for remote functions users.

**Convention durability assessment**: The core file-system routing conventions (`+page.svelte`, `+page.server.ts`, `+layout.svelte`) have been stable since 1.0 and are not changing in 3.0. The `load` function and `actions` patterns are stable. The instability is concentrated in: (a) the experimental remote functions API, and (b) the 2.x→3.x platform requirements bump.

Score rationale: **6.5** — core routing and data loading conventions are durable. The 3.0 breaking changes are real but mechanical (Node/Vite version bumps, API removals of deprecated items). Remote functions are explicitly experimental. Docked 3.5 for: the 3.0 stability_penalty being active, the training-data epoch problem from the 1.x→2.x transition, and the remote functions flux that may reshape data-loading conventions once stable.

### Evidence: Ecosystem tooling facts

**Devtools:**
- Svelte DevTools browser extension (Chrome, Firefox) — inspects component tree, props, state, and SvelteKit route data. https://github.com/sveltejs/svelte-devtools
- Vite's built-in HMR — fast module replacement during development, including `.svelte` component hot reload
- `sv` CLI — `npm create svelte@latest` scaffolding, `sv add` for integrations (Tailwind, Vitest, Playwright, auth adapters). https://svelte.dev/docs/kit/creating-a-project

**TypeScript / IDE:**
- Official VS Code extension (`svelte.svelte-vscode`) with full LSP support: diagnostics, completions, hover types, auto-import, go-to-definition across route boundaries. https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode
- `svelte-check` CLI — runs the Svelte language server over the whole project, integrates with CI. Used as `npx svelte-check`.
- JetBrains IDEs (WebStorm, IntelliJ) via Svelte plugin — LSP-based, same coverage.

**Testing:**
- Vitest — standard unit/component testing. `sv add vitest` sets it up. Official docs include testing load functions as pure async functions and testing actions directly.
- Svelte Testing Library (`@testing-library/svelte`) — DOM rendering + event interaction for component tests. https://testing-library.com/docs/svelte-testing-library/intro
- Playwright — E2E browser testing. `sv add playwright` scaffolds it. SvelteKit's page-based structure aligns naturally with Playwright's URL-driven test model.

**Build / CI:**
- `svelte-check` in CI mode: `svelte-check --threshold error` exits non-zero on type errors, integrating TypeScript checking into build pipelines.
- Official adapters verified against Vercel, Netlify, Cloudflare, and Node deployment targets.

**No gaps found** in standard tooling coverage. Documentation friction for tooling: none — the official `sv` CLI handles all setup automatically and the docs have a dedicated testing section.

Score rationale: **8.0** — comprehensive tooling coverage with first-party support for IDE integration, CI type checking, unit and E2E testing, and multi-platform deployment. Docked 2.0 because: (a) Svelte DevTools is less polished than React DevTools (fewer capabilities for inspecting the full route data tree); (b) the `svelte-check` cold-clone limitation (types not available before first `sync`) adds a friction step not present in Next.js; (c) no official testing library for form actions (you test them as raw async functions, which works but lacks SvelteKit-specific test utilities).

---

## On the Horizon

### Next release

- **Name/version:** SvelteKit 3.0 (pre-release: `@sveltejs/kit@3.0.0-next.2`)
- **Status:** alpha
- **What's changing:** TypeScript 6+, Node 22+, Vite 8+ are hard requirements. Removes `$app/stores` (deprecated in 2.x, replaced by `$app/state`). Changes form prop handling to use `undefined` instead of `null` for empty `form` prop. Revises `goto()` external URL behavior. Stabilizes remote functions API. Milestone 56% complete as of June 2026 (https://github.com/sveltejs/kit/milestone/7).
- **Anticipated impact:** Migration from 2.x requires Node/Vite upgrades and removal of `$app/stores` references — mechanical but breaking. Code written today with `$app/state` and Svelte 5 runes is forward-compatible. The remote functions stabilization will add a third canonical data-loading pattern alongside `load` and `actions`, which will raise the convention complexity once settled.
- **Stability penalty:** yes — `next_release.stability_penalty: true`. The 3.0 alpha is active, the milestone is mid-completion, and platform requirement bumps (Node 22, Vite 8) are non-trivial for production deployments. The remote functions breaking changes in 2.58–2.61 show the team is actively reshaping APIs mid-cycle.

### AI-tooling investment

- **What exists:**
  - Official first-party MCP server: `@sveltejs/mcp` at https://github.com/sveltejs/ai-tools — provides `list-sections`, `get-documentation` (fetches any SvelteKit docs section by title), `svelte-autofixer` (static analysis on LLM-generated Svelte code), and `playground-link`
  - The `get-documentation` tool explicitly covers SvelteKit routing, load functions, form actions, and adapters (searchable by doc section title or file path, e.g. "routing", "load", "form-actions")
  - Official AI docs hub: https://svelte.dev/docs/ai/overview — instructions, skills, subagents
  - `llms.txt` available at svelte.dev
  - Official AI style guide for agents injected via the MCP instructions system

- **Observed delta:** (See `ai_tooling.observed_delta` in frontmatter for full comparison.) The primary observed delta from using `@sveltejs/mcp` in the SvelteKit context is correct disambiguation of `+page.js` vs `+page.server.ts` — the hardest SvelteKit distinction for an LLM to get right from training data alone. The `svelte-autofixer` tool catches leftover Svelte 4-era syntax in generated code (on:click directives, `export let` props vs `$props()`), which matters for SvelteKit components just as much as for standalone Svelte components. Without the tooling, models default to patterns from 1.x or 2.x-early training data (using `export let data` instead of `let { data } = $props()`, importing from `$app/stores` instead of `$app/state`). With the MCP active, first-attempt code is idiomatic for 2.x conventions.

  The SvelteKit MCP coverage extends beyond pure Svelte component patterns — it can pull the full routing and load-function documentation — making it more useful for SvelteKit-specific tasks than for Svelte component work alone. The same `@sveltejs/mcp` package serves both use cases.
