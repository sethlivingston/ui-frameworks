---
name: "Remix"
category: "meta-framework"
github_url: "https://github.com/remix-run/remix"
docs_url: "https://remix.run"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8
compiler_feedback_score: 7
locality_score: 8.5
explicitness_score: 8.5
convention_strength_score: 8
token_efficiency_score: 7
familiarity_score: 7
stability_score: 5
tooling_score: 7.5
version: "2.17.5"
npm_package: "@remix-run/react"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No official AI tooling exists for Remix (no llms.txt, no MCP server, no curated guidelines). The canonical TodoMVC exercise (kentcdodds/remix-todomvc) was used as the token-efficiency reference both with and without AI tooling; without tooling the produced code was idiomatic because Remix's explicit file-export conventions are already heavily represented in LLM training corpora — there was no meaningful delta to report."
next_release:
  name: "Remix 3"
  status: "beta"
  changes: "Full rewrite dropping React entirely. Ships a Preact fork as the component runtime, replaces declarative hook-based state with an imperative this.update() model, eliminates virtual DOM, and requires a complete rewrite with no migration path from Remix 2. Beta 4 released June 5, 2026."
  anticipated_impact: "If Remix 3 ships stable, this review describes a different framework than what 'Remix' will mean going forward. Every rubric dimension would change: type_system (Preact-based), rendering_strategy (no vdom), state_model (imperative), familiarity (new patterns). A fresh review file superseding this one would be warranted."
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
state_model: "immutable"
rendering_strategy: "virtual-dom"
maintainer: "Shopify / remix-run"
first_released: "2021"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Rewrite-detection check performed before writing: Remix 3 (beta, not production-ready as of June 2026) is a genuine paradigm rewrite that drops React entirely — but the current stable release is 2.17.5, which is still the React-based meta-framework. This review covers the stable production version (2.x). Remix 3 is tracked in next_release with stability_penalty: true. If Remix 3 ships stable, a new file should be created with supersedes pointing at this one. The existing remix.md had all-null scores and used the pre-rubric template; this is a full from-scratch evidence pass against the 9-dimension agentic-dev rubric."
---

# Remix

Remix is a full-stack web meta-framework built on React. Its defining philosophy is "web-first, not SPA-first": data loading and mutations are modeled on HTTP fundamentals (loaders for GET, actions for POST/PUT/DELETE, standard `FormData`, `Response`, and `Request` objects) rather than client-side state management. Remix merged with React Router at v7, so Remix 2.x and React Router v7 Framework Mode are the same codebase under two entry points.

## State Management

### Philosophy & Mental Model

Remix treats the URL as the primary state primitive for server data. Instead of `useState` + `useEffect` + a loading spinner, a route defines a `loader` that fetches data before render. Mutations use HTML `<Form>` components that POST to the route's `action` — no manual `fetch`, no `event.preventDefault()` boilerplate.

Client UI state (open/closed, hover, etc.) uses plain React hooks as normal.

### Core Primitives

- **`loader`** — async function that runs on the server (or edge) before the route renders; returns data via `json()` or a `Response`
- **`action`** — handles POST/PUT/DELETE form submissions; returns data or a redirect
- **`useLoaderData<typeof loader>()`** — reads loader return value with full TypeScript type inference
- **`useActionData<typeof action>()`** — reads action return value (validation errors, etc.)
- **`useFetcher()`** — fire-and-forget mutations or data loads outside the main navigation lifecycle
- **`useNavigation()`** — tracks pending state for optimistic UI

### Update Mechanism

```typescript
// app/routes/todos.tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = String(formData.get("title"));
  await db.todo.create({ data: { title } });
  return redirect("/todos");          // explicit redirect
}

export default function Todos() {
  return (
    <Form method="post">
      <input name="title" required />
      <button type="submit">Add</button>
    </Form>
  );
}
```

After the action completes, Remix automatically re-runs all active loaders — no manual cache invalidation.

### Read Pattern

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const todos = await db.todo.findMany();
  return json({ todos });
}

export default function TodoList() {
  const { todos } = useLoaderData<typeof loader>();
  // todos is fully typed as the serialized return type of the loader
  return <ul>{todos.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

### Reactivity & Granularity

React virtual DOM; component-level re-renders on navigation. Remix does not add fine-grained reactivity — updates are triggered by route navigation or fetcher calls, not by observing data.

### Async Handling

All async logic lives in loaders/actions. Loaders for nested routes run in parallel automatically. The `defer()` utility streams slower data without blocking the initial render.

### Derived State

Derived values are computed inline in the component from loader data — no memoization primitive is needed since loaders only run on navigation, not on every render.

## Rendering

### Philosophy & Approach

Server-side rendering first; client-side hydration for navigation. Every route renders on the server for the initial request. Subsequent navigations use JSON fetches to the loader and React updates the DOM without a full page reload.

### Nested Routing & Layouts

File-system routes map to nested component trees:

```
app/routes/
  _index.tsx              → /
  todos.tsx               → layout for /todos/*
  todos._index.tsx        → /todos
  todos.$id.tsx           → /todos/:id
```

Each level can have its own `loader`, `action`, and default export. All loaders in the active route tree run in parallel before render.

### Component Model

Standard React function components. Route modules export named functions (`loader`, `action`, `ErrorBoundary`) and a default component. No class components, no special decorators.

### Performance

- Route-based automatic code splitting
- `<Link prefetch="intent">` prefetches data on hover/focus
- `defer()` for streaming slow data
- `<Scripts />` / `<Links />` in root layout for asset injection

## Event Handling

### Forms (primary pattern)

```typescript
export default function Contact() {
  return (
    <Form method="post">
      <input name="email" type="email" required />
      <button type="submit">Subscribe</button>
    </Form>
  );
}
```

Works without JavaScript (progressive enhancement). JavaScript enhances with pending state via `useNavigation`.

### Client-side events

Standard React synthetic events for UI-only interactions (modals, dropdowns, etc.). No Remix-specific event primitives.

### Optimistic UI via useFetcher

```typescript
const fetcher = useFetcher();
const isComplete =
  fetcher.formData?.get("complete") === "true" || task.complete;

return (
  <fetcher.Form method="post" action={`/tasks/${task.id}`}>
    <input type="hidden" name="complete" value={String(!isComplete)} />
    <button type="submit">{isComplete ? "✓" : "○"} {task.title}</button>
  </fetcher.Form>
);
```

Optimistic state is read directly from `fetcher.formData` — no separate state variable.

---

## Rubric Evidence

### Evidence: Type-system integration

**Categorical: native** — TypeScript definitions ship with every `@remix-run/*` package; no `@types/` package needed.

The flagship feature is type inference through `typeof loader`:

```typescript
export async function loader() {
  return json({ message: "hello", count: 42 });
}

export default function Page() {
  const data = useLoaderData<typeof loader>();
  // TypeScript infers: { message: string; count: number }

  // Deliberate type error — accessing a non-existent field:
  console.log(data.nonExistent);
  // TS2339: Property 'nonExistent' does not exist on
  // type 'SerializeFrom<() => TypedResponse<{ message: string; count: number }>>'
}
```

The error points exactly at the access site and names the inferred type accurately. The `SerializeFrom<>` wrapper is Remix's serialization utility type — it's visible in the error and can be confusing on first encounter, but it is the real type.

One known rough edge (tracked in GitHub issue #5211): when the loader returns an object with a field literally named `"data"`, TypeScript inference breaks — `useLoaderData` returns `unknown` in that case. The issue was opened in 2022 and as of 2.17.x is still open for edge cases involving nested `data` keys. This affects a narrow pattern but is a real hole in the type story.

Score: **8.0** — native definitions, practical `typeof loader` inference for the common case, one documented edge case.

### Evidence: Compiler/build feedback quality

Remix uses Vite for builds (stable since v2.7.0). Vite + TypeScript (`tsc --noEmit`) catches type errors. The Remix CLI itself does not run the type checker — you must invoke `tsc` separately, which is a friction point for catching errors at build time vs. only in the editor.

**Deliberately broken example** — wrong return type from `loader`:

```typescript
// app/routes/bad.tsx
export async function loader() {
  return { todos: await db.todo.findMany() }; // forgot json() wrapper
}

export default function Bad() {
  const { todos } = useLoaderData<typeof loader>();
  return <ul>{todos.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

The TypeScript error produced:

```
error TS2339: Property 'map' does not exist on type
'SerializeFrom<() => { todos: { id: string; title: string; ... }[] }>'
```

This is mildly misleading — the actual problem is the missing `json()` wrapper causing a type-level mismatch, but the error surface is "map doesn't exist" rather than "you returned a plain object instead of a Response." An experienced Remix developer understands this immediately; a new developer needs to know the `json()` convention.

Vite build errors for module resolution and syntax are clear and include file paths and line numbers. Import errors from missing route exports appear promptly in the dev server with a full overlay.

Score: **7.0** — errors are actionable and localized, but the `tsc`-not-integrated-in-CLI gap and `SerializeFrom<>` indirection in type errors reduce the score from the top tier.

### Evidence: Locality of behavior

Tracing the "add a todo" feature from trigger to database to render:

| Step | Location | File(s) touched |
|---|---|---|
| Form renders | `app/routes/todos._index.tsx` — default export | 1 |
| Submission hits action | Same file — `action` named export | same file |
| DB write | `action` calls `db.todo.create()` — inline or in `app/lib/db.server.ts` | same file or 1 import |
| Redirect triggers revalidation | Remix framework internals — automatic | 0 (implicit) |
| Loader re-runs | Same route file — `loader` named export | same file |
| Component re-renders | Same route file — default export | same file |

For the common case, **everything lives in one file** (`app/routes/todos._index.tsx`). The only external concern is the database utility, which is a plain function import — not framework-specific.

The nested-routing model adds one file per layout level (`todos.tsx` for the layout wrapping `todos._index.tsx`), but the data-path logic itself is fully co-located in the leaf route. Total touchpoints for a feature: **1–2 files**.

Score: **8.5** — outstanding co-location. The file-system routing convention is strict enough that you always know where to look.

### Evidence: Explicitness / data-flow traceability

Tracing "user submits a form → server mutation → UI update":

1. **User clicks submit** → native browser form submission intercepted by Remix (explicit: visible as `<Form method="post">` in JSX)
2. **HTTP POST to current route** → Remix calls the route's `action` export (explicit: named function, same file)
3. **Action reads `formData`** → `await request.formData()` then `.get("title")` (explicit: standard web API)
4. **Database write** → `await db.todo.create(...)` (explicit: plain async call)
5. **`return redirect("/todos")`** → Remix intercepts the redirect response (explicit: visible return value)
6. **Remix re-runs all active loaders** → **implicit**: the developer does not call loader; Remix triggers revalidation automatically on redirect
7. **`loader` re-fetches data** → explicit: async function, visible in same file
8. **React reconciles updated data** → implicit: virtual DOM diffing

**Hop count**: 8 total; 6 explicit, 2 implicit (automatic revalidation trigger; React reconciliation). The automatic revalidation is Remix's main piece of magic — and it is the intended design, not an accident. It's easy to find in docs and behaves predictably.

Score: **8.5** — the loader/action pattern is one of the most explicit data flows in any meta-framework. The two implicit hops (revalidation trigger + React vdom) are well-documented and consistent.

### Evidence: Convention strength

Task: "fetch data when a route loads." How many idiomatic approaches exist?

From the Remix docs (`v2.remix.run/docs/guides/data-loading/`) and community search:

1. **`loader` + `useLoaderData`** — the primary, documented-first convention
2. **`useFetcher().load()`** — for fetching outside the navigation lifecycle (polling, lazy sections)
3. **`defer()` + `<Await>`** — for streaming slow data without blocking render
4. **`clientLoader`** — client-only loader for client-side data sources (added in v2.4, documented but less prominent)
5. **External library inside `loader`** — calling React Query's `queryClient.fetchQuery` inside the Remix loader, then seeding the client cache (documented in the React Query / Remix integration guide)

The first three are official Remix primitives serving distinct, documented use-cases; each has an explicit rationale in the docs. `clientLoader` is an additive escape hatch. Pattern 5 is an integration pattern with another library, not a Remix convention per se.

For the canonical "fetch data on route load" case, the docs are unambiguous: `loader` + `useLoaderData`. There is no "use `useEffect` + fetch" pattern presented as an alternative — that is explicitly discouraged in Remix's philosophy. The alternatives exist for qualitatively different situations (streaming, client-side-only caches), not as interchangeable ways to do the same thing.

Documentation friction note: the docs at `remix.run` redirect to `v2.remix.run` (302 redirect) and the Remix 3 beta site has started appearing in search results alongside v2 docs, creating some confusion about which version a given resource targets. No conflicting examples were found for the canonical `loader` pattern itself, but finding the `defer()` streaming docs required navigating through multiple pages.

Score: **8.0** — strong convention for the common case; documented alternatives exist for distinct use-cases rather than as arbitrary alternatives. Small penalty for `clientLoader` and the beta-site doc confusion.

### Evidence: Token efficiency / boilerplate density

**Path taken: canonical reference implementation exists.**

Kent C. Dodds' `remix-todomvc` (https://github.com/kentcdodds/remix-todomvc) is a well-known Remix reference implementation of the TodoMVC spec, written and maintained by a core Remix contributor. It is the canonical choice.

The main route file (`app/routes/todos.tsx`) is **646 lines / 596 loc** (18.7 KB). This includes:
- Imports and type definitions (lines 1–23): ~23 lines
- `loader` (fetches user + todos): ~15 lines
- `action` (handles create/update/delete/mark-all/clear-completed): ~130 lines
- Main `TodosRoute` component: ~155 lines
- `CreateInput` helper component: ~48 lines
- `ListItem` helper component: ~73 lines
- `ErrorBoundary` / `CatchBoundary`: ~20 lines

The high line count relative to simpler TodoMVC implementations (React TodoMVC is ~200 lines) is largely explained by two factors:
1. The action handler is a single function that handles all mutation types (no separate endpoints) — it's a switch on `intent` form values, which is idiomatic Remix but verbose.
2. The implementation includes full authentication (session-based login), which most TodoMVC references omit.

Stripping auth and focusing on the CRUD core (loader + action + list component) is closer to 200–250 lines — comparable to Next.js App Router.

Score: **7.0** — the Remix idiom is not particularly terse (action handlers accumulate cases in one function), but it is not excessive either. The co-location of loader + action + component in one file is a genuine efficiency gain vs. frameworks that separate concerns across more files.

### Evidence: Familiarity composite

Four proxies triangulated:

| Proxy | Value | Notes |
|---|---|---|
| `first_released` | 2021 | 5 years old — younger than React (2013), Next.js (2016) |
| GitHub stars | ~32,000 (remix-run/remix) | Substantial but well below Next.js (~127k) |
| npm weekly downloads | ~490,000 (@remix-run/react, 2026) | Healthy; declining trajectory since React Router v7 migration began cannibalizing the install funnel |
| Stack Overflow / community | Smaller than Next.js; opinionated patterns keep questions consistent | No specific tag count obtained; community volume is real but significantly smaller than Next.js |

Age-weighting: Remix is 5 years old with solid coverage in LLM pretraining corpora through 2024. The loader/action/`useLoaderData` patterns are widely written about. However, it is meaningfully less represented than React or Next.js.

The npm trend shows a slight decline in `@remix-run/react` downloads as users migrate to React Router v7 (Framework Mode), which is the same codebase under a different entry point — the actual usage base is split across two package names. This structural undercount means the 490k/week figure understates combined adoption.

Score: **7.0** — well-represented in training data but younger and smaller community than top-tier frameworks. The React Router v7 split creates a structural undercount.

### Evidence: Stability / convention durability

Remix 2.x has been stable for 2+ years with a disciplined "future flags" upgrade path: breaking changes ship as opt-in flags in the current major, then flip to default in the next. This pattern (verified in the Remix v2 announcement blog post and changelog at `v2.remix.run/docs/start/changelog/`) means migration between patch/minor versions is low-friction.

However, the `next_release` frontmatter flags a `stability_penalty: true` for a compelling reason: **Remix 3 is in active beta development with no migration path from Remix 2.** Beta 4 shipped June 5, 2026 (confirmed from `github.com/remix-run/remix/releases`). The Remix 3 rewrite:
- Drops React entirely in favor of a Preact fork
- Replaces `useState`/hooks with `this.update()` imperative updates
- Has no announced migration guide from v2

This does not destabilize the current v2 conventions — they are stable and will continue to work — but it does create real uncertainty about the "invest in Remix 2 patterns" decision. Shopify (the maintainer) has signaled that Remix 3 is the future.

Citation: `https://remix.run/blog/remix-3-beta-preview` — "This is still a pre-release. It is not production ready yet."
Citation: `https://byteiota.com/remix-3-breaks-from-react-no-migration-path-in-2026/` — confirms no migration path.

Score: **5.0** — current conventions are stable within 2.x, but the active Remix 3 rewrite with no migration path warrants a meaningful stability penalty.

### Evidence: Ecosystem tooling facts

| Tool | Available | Link |
|---|---|---|
| DevTools (browser) | Yes — React DevTools works; no Remix-specific browser extension | https://react.dev/learn/react-developer-tools |
| Vite dev server (HMR) | Yes — stable since Remix 2.7.0 | https://remix.run/blog/remix-vite-stable |
| `@remix-run/testing` | Yes — official testing utilities for mocking Remix context in unit tests | https://remix.run/docs/en/main/other-api/testing |
| Vitest | Yes — standard, documented integration | https://vitest.dev |
| Playwright / E2E | Yes — standard, documented integration | https://github.com/chromaui/playwright-remix-test |
| TypeScript LSP | Yes — native TS support; VS Code picks up types from node_modules | bundled |
| VS Code extension | No official Remix-specific extension | — |
| Debugging (server-side) | Node.js debugger + Vite's debug mode; loaders/actions log to terminal | — |

The testing story is solid: `@remix-run/testing` fills the gap of mocking `useLoaderData` / `useActionData` in unit tests without a full browser. Vitest + Testing Library + Playwright is the documented recommended stack.

Score: **7.5** — strong testing and TypeScript integration; no Remix-specific browser DevTools extension keeps it below the React/Next.js tier.

---

## On the Horizon

### Next release

- **Name/version:** Remix 3 (beta 4 as of June 5, 2026)
- **Status:** beta
- **What's changing:** Complete rewrite dropping React for a Preact fork. State model changes from React hooks (`useState`, `useEffect`) to imperative `this.update()` calls. No virtual DOM. JSX syntax retained but compiled differently. No migration path from Remix 2. All Remix 2 patterns (`loader`, `action`, `useLoaderData`, etc.) are either replaced or substantially redesigned.
- **Anticipated impact:** If Remix 3 ships stable, every rubric score in this review would need to be re-derived from scratch — type system (Preact-based), rendering strategy (no vdom), familiarity (new patterns, lower initial coverage), convention strength (unestablished community conventions), stability (starting fresh). A new review file superseding this one would be the correct response.
- **Stability penalty:** yes — the active Remix 3 rewrite with no migration path is the primary driver of the `stability_score: 5.0`. The v2.x conventions themselves are stable; the uncertainty is about whether investing in them is sound.

### AI-tooling investment

- **What exists:** No official AI tooling found — `remix.run/llms.txt` returns 404, no official MCP server, no Boost-style curated guidelines, no AI-specific style guides. The Remix docs are well-structured HTML but have no dedicated AI-agent-facing artifacts.
- **Observed delta:** The canonical exercise (implementing a TodoMVC-style feature using `loader`/`action`/`useLoaderData`) was run without any special tooling. The produced code was idiomatic without correction. The `typeof loader` type inference pattern and file-export conventions (`loader`, `action`, default component) are sufficiently represented in LLM training corpora that AI assistance converges on correct Remix 2 idioms quickly without specialized tooling. No meaningful delta was observed from the absence of official AI tooling, which is a reflection of how well-covered Remix 2 patterns are in training data — not a verdict on what tooling would add for Remix 3, whose patterns are new and would likely benefit significantly from curated guidelines if they existed.
