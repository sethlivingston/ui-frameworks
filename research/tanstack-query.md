---
name: "TanStack Query"
category: "state-library"
github_url: "https://github.com/TanStack/query"
docs_url: "https://tanstack.com/query/latest"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8.5
compiler_feedback_score: 7.5
locality_score: 8.5
explicitness_score: 7.5
convention_strength_score: 6.5
token_efficiency_score: 7.5
familiarity_score: 8.5
stability_score: 8
tooling_score: 8.5
version: "5.101.0"
npm_package: "@tanstack/react-query"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: true
  style_guides: null
  observed_delta: "TanStack publishes a project-wide llms.txt at tanstack.com/llms.txt (an index of all TanStack libraries with links, not Query-specific content or full doc text). Running the canonical fetch+mutate+invalidate exercise with this llms.txt in context vs. without: no measurable difference. The index format gives an AI a map of which docs pages exist but doesn't inline the actual useQuery/useMutation/invalidateQueries patterns, so it functions more as a navigation aid for an agent that can follow links than as in-context pattern guidance. No official MCP server, no Boost-style curated guidelines package, and no TanStack-Query-specific AI style guide were found."
next_release:
  name: null
  status: null
  changes: "v5 (current major, first released 2023) is in an active patch series — 5.101.0 shipped 2026-06-02, with weekly-to-biweekly patch releases throughout 2026 (5.100.9 through 5.101.0 across May-June 2026). No v6 for the React/core package is announced; a 'TanStack Query v6' name only exists for the Svelte adapter (Svelte 5 support), which still runs on the v5 core. No RFC, milestone, or roadmap discussion proposes a v6 for @tanstack/react-query."
  anticipated_impact: "None anticipated for the core useQuery/useMutation/QueryClient API. Patch releases are bug fixes, TypeScript inference refinements, and dependency bumps."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
typescript_support: "native"
license: "MIT"
runtime: "browser"
capabilities:
  state_management: true
  rendering: false
  event_handling: false
paradigm: "declarative"
state_model: "queries"
maintainer: "TanStack"
first_released: "2019"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full rewrite under the 9-dimension agentic-dev rubric. Previous file had null scores and the pre-rubric per-capability-area structure; entire body replaced. Version verified via `npm view @tanstack/react-query version` -> 5.101.0 (released 2026-06-02). Reviewed as used in its primary context: React + TypeScript (@tanstack/react-query), the framework adapter with by far the largest install base; Vue/Svelte/Solid/Angular adapters share the same query-core but were not separately re-verified. TanStack Query is a server-state/caching library, not a client-state library like Redux/Zustand/Jotai/MobX/XState already in this corpus -- it does not own rendering or event handling, and 'a representative feature' for locality/explicitness was chosen as a fetch + mutate + cache-invalidate cycle rather than a counter or todo-toggle, per the framework-researcher brief. TanStack Start (a separate, broader meta-framework using TanStack Router) is reviewed independently in tanstack-start.md and is not in scope here."
---

# TanStack Query

## State Management

### Philosophy & Mental Model

TanStack Query (formerly React Query) is built on a single, explicitly-named distinction: **server state is not client state**. Data that lives on a server is asynchronous, shared, potentially stale the moment it arrives, and not owned exclusively by the client holding it. The library's stated job is to make that kind of data feel synchronous and current without the developer hand-rolling caching, deduplication, retries, or staleness tracking.

Core mental-model points:
- **Cache-first, not fetch-first.** A `useQuery` call describes "what data, identified by what key, fetched how" — the library decides whether to serve cache, show cache-while-refetching, or fetch fresh, based on `staleTime`/`gcTime` configuration.
- **Stale-while-revalidate** is the default behavior: data is "stale" the instant it lands (`staleTime: 0` by default), so the next mount/focus/reconnect triggers a background refetch while the stale value remains visible.
- **Queries (reads) and mutations (writes) are distinct primitives** with different lifecycles — mutations don't get cached the way queries do; instead they typically end by invalidating queries.
- **The cache is keyed and shared.** Any number of components calling `useQuery({ queryKey: ['todos'], ... })` share one cache entry and one in-flight request.
- TanStack Query explicitly does **not** try to be a general client-state library — UI-only state (form inputs, modal open/closed) is left to `useState`/Zustand/Jotai/etc.

### Core Primitives

Three primitives, one orchestrator:

**1. `useQuery`** — read:
```typescript
const { data, isPending, isError, error, isFetching } = useQuery({
  queryKey: ['todos'],
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  staleTime: 5 * 60 * 1000, // optional: 5 min "fresh" window
})
```

**2. `useMutation`** — write:
```typescript
const mutation = useMutation({
  mutationFn: (newTodo: { text: string }) =>
    fetch('/api/todos', { method: 'POST', body: JSON.stringify(newTodo) }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
mutation.mutate({ text: 'Buy milk' })
```

**3. `QueryClient`** — the cache + orchestrator, provided once at the app root:
```typescript
const queryClient = new QueryClient()

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```
Programmatic access: `queryClient.invalidateQueries(...)`, `queryClient.setQueryData(...)`, `queryClient.getQueryData(...)`.

### Update Mechanism

State changes happen through three channels, all explicit at the call site:

1. **Mutation → invalidate** (the dominant pattern): a `useMutation` call's `onSuccess`/`onSettled` calls `queryClient.invalidateQueries({ queryKey: [...] })`, marking matching cache entries stale and triggering a background refetch for any mounted observer.
2. **Direct cache write**: `queryClient.setQueryData(['todos'], updater)` — synchronous, used for optimistic updates.
3. **Automatic background refetch**: triggered by stale-on-mount, window refocus, network reconnect, or `refetchInterval` polling — these are configuration, not imperative calls, and are the one part of the update model that is not driven by a line of application code.

### Read Pattern

```typescript
const { data, status, isFetching, error } = useQuery({
  queryKey: ['todos', filters],   // array key — params become part of the cache identity
  queryFn: () => fetchTodos(filters),
  enabled: !!filters,              // conditional fetching
})
```

`useSuspenseQuery` is the Suspense-integrated variant (throws a promise instead of returning `isPending`). `useQueries` runs a dynamic array of queries in parallel. `useInfiniteQuery` adds `fetchNextPage`/`hasNextPage` for pagination.

### Reactivity & Granularity

Granularity is **per query key**, not per field and not per component tree:
- Two components calling `useQuery({ queryKey: ['todos'] })` share one cache entry, one network request, and re-render together when it changes.
- The `select` option narrows the subscription: `useQuery({ queryKey: ['todos'], queryFn, select: (d) => d.filter(t => t.done) })` re-renders only when the *selected* slice changes (structural sharing compares the selected output, not the raw response).
- There is no signal-level or atom-level granularity — the unit of reactivity is the query result object.

### Async Handling

This is the library's reason for existing. Built in, with no middleware:
- **Retries with exponential backoff** (`retry`, `retryDelay`, default 3 retries on the client)
- **Request cancellation** via `AbortSignal` passed into `queryFn`
- **Request deduplication** — concurrent calls with the same key share one network request
- **Dependent/sequential queries** via `enabled: !!previousResult`
- **Parallel queries** via `useQueries`
- **Polling** via `refetchInterval`
- **Prefetching** via `queryClient.prefetchQuery(...)`, e.g. on link hover

### Derived State

Two patterns, both explicit:

```typescript
// 1. select — derive inside the subscription, re-render only on change to the derived value
const { data: doneCount } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (todos) => todos.filter(t => t.done).length,
})

// 2. compose multiple queries in the component (re-evaluated each render, wrap in useMemo if expensive)
const { data: todos } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
const enriched = useMemo(
  () => todos?.map(t => ({ ...t, user: users?.find(u => u.id === t.userId) })),
  [todos, users]
)
```

### Developer Experience

- **Boilerplate:** Low for reads (`queryKey` + `queryFn` is the whole API surface of a query); medium for mutations with optimistic updates, which require `onMutate`/`onError`/`onSettled` lifecycle hooks.
- **DevTools:** `@tanstack/react-query-devtools` — dedicated panel showing every query's key, status, data, and timing, plus manual refetch/invalidate/remove actions.
- **Debugging:** Cache state is inspectable at any time via DevTools or `queryClient.getQueryCache().getAll()`; query keys double as a search index across the codebase.
- **Time travel:** No — the library models *current* server state, not a history of client-state transitions.

---

## Rubric Evidence

### Evidence: Type-system integration

**Category: native.** TanStack Query is written in TypeScript (96.7% of the repo per GitHub's language breakdown) and ships its own types — no `@types/*` package needed.

Type inference flows from `queryFn`'s return type through to `data`:

```typescript
function fetchTodo(id: number): Promise<{ id: number; title: string; done: boolean }> {
  return fetch(`/api/todos/${id}`).then(r => r.json())
}

const { data } = useQuery({ queryKey: ['todo', id], queryFn: () => fetchTodo(id) })
// data: { id: number; title: string; done: boolean } | undefined
```

**Sample type error — calling `mutate` with the wrong variable shape:**

```typescript
const addTodo = useMutation({
  mutationFn: (newTodo: { text: string }) =>
    fetch('/api/todos', { method: 'POST', body: JSON.stringify(newTodo) }),
})

addTodo.mutate({ title: 'Buy milk' }) // wrong key: 'title' instead of 'text'
```

```
error TS2353: Object literal may only specify known properties, and 'title' does not
exist in type '{ text: string }'.
```

This is precise and points at the call site. The TanStack Query docs (https://tanstack.com/query/latest/docs/framework/react/typescript) also document a real, named gotcha: `data` is typed `T | undefined` until you check `status`/`isSuccess` — TypeScript narrows `data` to `T` only inside an `isSuccess` branch (a discriminated union on the result object), which is a documented and correct but non-obvious pattern for developers used to optional-chaining their way past `undefined`.

**Documented weak spot:** `queryClient.getQueriesData()` returns a heterogeneous array and does **not** infer types — the docs explicitly call this out as a case requiring manual generic annotation. This is a real, named gap rather than a hidden one.

Score: **8.5** — inference is strong end-to-end for the 95% case (`useQuery`/`useMutation`/`queryFn`/`select`), with one well-documented escape hatch (`getQueriesData`) and one non-obvious-but-correct pattern (status-gated narrowing of `data`).

### Evidence: Compiler/build feedback quality

**Deliberately broken example — wrong argument shape to `invalidateQueries`:**

```typescript
const queryClient = useQueryClient()

// Deliberate error: invalidateQueries takes a filters object, not a bare key array
queryClient.invalidateQueries(['todos'])
```

In TanStack Query v5, `invalidateQueries` requires `{ queryKey: [...] }` (the v4 bare-array signature was removed as part of the "single object signature" migration). Real `tsc` (5.x, strict) output:

```
error TS2345: Argument of type 'string[]' is not assignable to parameter of type
'InvalidateQueryFilters<readonly unknown[]>'.
  Type 'string[]' is missing the following properties from type
  'QueryFilters<readonly unknown[]>': ...
```

This points at the call and names the expected type, but the message itself does not say "wrap this in `{ queryKey: ... }`" — a developer unfamiliar with the v4→v5 single-object-signature change would need to consult the migration guide (https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5) to know the *fix*, even though the *location* of the error is exact.

**Second break — `useQuery` missing `queryFn`:**

```typescript
const { data } = useQuery({ queryKey: ['todos'] })
```

```
error TS2345: Argument of type '{ queryKey: string[] }' is not assignable to parameter
of type 'UseQueryOptions<...>'.
  Property 'queryFn' is missing in type '{ queryKey: string[]; }' but required in type
  '...'.
```

Single-line, immediately actionable, names the missing required property exactly.

**Runtime feedback (not just compile-time):** if `queryFn` throws or rejects, `useQuery` surfaces it as `error` + `isError: true` rather than an unhandled rejection — DevTools shows the error object and the retry count live.

Score: **7.5** — required-field errors (`queryFn` missing, wrong mutation variable shape) are excellent and self-explanatory; the v5 signature-shape errors (`invalidateQueries`, `setQueryData` filters) are precise about *where* but not always *what to change*, requiring a migration-guide lookup the first time.

### Evidence: Locality of behavior

**Feature traced:** the official `optimistic-updates-ui` example — fetch a todo list, add a todo via mutation, optimistically show it pending, invalidate and refetch on settle (`github.com/TanStack/query/tree/main/examples/react/optimistic-updates-ui`).

Touchpoints needed to understand or change this feature end-to-end:

| # | File/concept | Role |
|---|---|---|
| 1 | `src/pages/index.tsx` | Everything: `QueryClient` instance, `useTodos()` query hook, `useMutation` with `onSettled`, the form, the list render, pending/error states — all in one 117-line file |
| 2 | `QueryClientProvider` wrapper | One-time app-root setup, visible at the bottom of the same file |

Total touchpoints: **2**, and touchpoint 2 is a one-time setup concern, not something revisited per feature.

Everything that defines *this* feature — the query key, the fetch function, the mutation, the invalidation call, and the JSX that renders pending/error/success states — lives in one file, one component. There is no separate reducer, action-types file, selector module, or saga/middleware to open. The query key (`['todos']`) appears exactly twice in the file (once in `useTodos`, once in `invalidateQueries`), both visible in the same screen of code.

**Comparison:** this is comparable to Zustand's locality_score of 9 (single-file co-location of state + actions), and notably *better* than a hand-rolled `useState`+`useEffect` equivalent, which would scatter loading/error/data into three separate `useState` calls plus a `useEffect` with a cleanup-flag pattern.

No documentation friction: the example is directly linked from `github.com/TanStack/query/tree/main/examples/react` and runs standalone. Score: **8.5**.

### Evidence: Explicitness / data-flow traceability

**Action traced:** user submits the "add todo" form → optimistic pending item appears → server confirms → list refetches with the new item, using the official `optimistic-updates-ui` example.

1. **[explicit]** `<form onSubmit={(e) => { e.preventDefault(); addTodoMutation.mutate(text) }}>` — direct call to `mutate`, no indirection.
2. **[explicit]** `mutationFn: async (newTodo) => { ... fetch('/api/data', { method: 'POST', ... }) }` — the network call is inline in the mutation definition, fully visible.
3. **[explicit]** While pending, `addTodoMutation.isPending` and `addTodoMutation.variables` are read directly in JSX to render the optimistic placeholder (`{addTodoMutation.isPending && <li style={{opacity:0.5}}>{addTodoMutation.variables}</li>}`) — this is a *visible* mechanism, not hidden cache magic.
4. **[explicit]** `onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] })` — the link between "mutation finished" and "refetch the todos query" is one named call, in the same file, naming the same key the `useTodos` hook uses.
5. **[implicit]** TanStack Query's internal observer system notices `['todos']` was marked stale and that `useTodos()` has an active observer, and triggers the actual refetch — this dispatch is internal to the library (not visible at the call site, though documented behavior).
6. **[implicit]** React re-renders `Example` because the `useQuery(['todos'])` result object identity changed (structural sharing means only the parts that actually changed produce a new reference).

**Hop summary:** 4 explicit, 2 implicit. Both implicit hops are single-layer (cache-marks-stale → notify-observers, then React's normal render-on-state-change) and are the *same* two implicit hops present in nearly every reactive React library (Zustand's review documents the same pattern: 4 explicit / 1 implicit, plus React's own re-render as a second implicit step not separately counted there).

The one piece of genuinely **non-call-site** behavior is automatic background refetching driven by `staleTime`/window-focus/reconnect — these are *configuration*, not a traceable call in the user-action path, and are the most commonly cited source of "why did this refetch just happen?" surprise (see Convention Strength below for the docs' own framing of this as a frequently-misunderstood default).

Score: **7.5** — the mutate→invalidate→refetch chain for a single user action is highly traceable by reading one file, but the *automatic* refetch triggers (focus/reconnect/staleness) are real, common, and configuration-driven rather than call-site-visible, which is the dimension's main deduction.

### Evidence: Convention strength

**Canonical task: "fetch data on mount and display it, with loading/error states."**

Approaches found across official docs and the examples directory (`github.com/TanStack/query/tree/main/examples/react`):

1. **`useQuery` directly in the component** — the textbook pattern shown in the "Simple" example (`tanstack.com/query/latest/docs/framework/react/examples/simple`):
   ```typescript
   const { isPending, error, data } = useQuery({ queryKey: ['repoData'], queryFn: ... })
   ```

2. **Custom hook wrapping `useQuery`** — the "basic" example's `function usePosts() { return useQuery({...}) }` pattern, used to centralize a query definition for reuse across components.

3. **`queryOptions` factory** (v5 addition) — `const todoOptions = queryOptions({ queryKey: ['todos'], queryFn: fetchTodos })`, then `useQuery(todoOptions)` and `queryClient.prefetchQuery(todoOptions)` share one definition. Docs present this as the modern recommended pattern for sharing query definitions between hooks and imperative prefetch/SSR calls.

4. **`useSuspenseQuery` + `<Suspense>`** — for apps using Suspense for loading states instead of `isPending` checks; same `queryKey`/`queryFn` shape, different consumption.

5. **Prefetch in a route loader** (TanStack Router / Next.js App Router patterns, `nextjs-app-prefetching` example) — `queryClient.prefetchQuery(...)` called outside the component, before render, with the component then calling `useQuery` against the now-warm cache.

**Count: 5 recognizable patterns** for the same underlying task. Unlike Zustand's "fetch on mount" ambiguity (which the Zustand review flags as a genuine open question — "it depends," per a maintainer thread), TanStack Query's five patterns are not competing answers to the same question — they're the same `queryKey`/`queryFn` core, surfaced through different consumption mechanisms (hook directly, wrapped hook, shared options object, Suspense, prefetch). The docs are consistent that `queryKey` + `queryFn` is the one thing that doesn't change across all five.

**Documentation friction note:** the `queryOptions` factory pattern (#3) is presented in the TypeScript guide and in scattered example READMEs, but is not consistently used across the official examples directory itself — several examples (including `optimistic-updates-ui`, used for this review's locality/explicitness evidence) still use the older "custom hook wrapping `useQuery`" pattern (#2) rather than the newer factory. A reader comparing two official examples side by side would see two different idioms for "where does the query definition live" without an explicit doc page saying "use #3 going forward, #2 is legacy" — this took noticeably more cross-referencing than finding the equivalent answer in, say, the Zustand or Jotai docs.

Score: **6.5** — the *core* (`queryKey` + `queryFn`) is completely uniform across all five patterns, but the "where do I put this and how do components consume it" question has five live answers in the wild, including in TanStack's own examples directory, with no single example demonstrating all of them side-by-side or an explicit "this supersedes that" doc note.

### Evidence: Token efficiency / boilerplate density

**Source:** the official TanStack Query "optimistic-updates-ui" example — `github.com/TanStack/query/blob/main/examples/react/optimistic-updates-ui/src/pages/index.tsx`. This is the closest canonical reference to a TodoMVC-style spec in TanStack's own examples: it implements fetch (`useQuery`), add (`useMutation`), optimistic UI, error + retry UI, and cache invalidation — covering both the "query" and "mutation" halves of the library's API in one file. No full TodoMVC exists for TanStack Query on todomvc.com or in the TanStack examples repo (the examples directory has `basic` for queries-only and `optimistic-updates-cache`/`optimistic-updates-ui` for the mutation side, but nothing combining add+toggle+delete+filter the way a TodoMVC spec requires).

**Line count: 117 lines, ~325 words** (full file, including imports, types, the `Example` component, and the `App` wrapper with `QueryClientProvider` + DevTools).

Breakdown:
- Imports: 9 lines
- `QueryClient` instantiation: 1 line
- `Todos` type + `fetchTodos`: 9 lines
- `useTodos()` hook (1-line `useQuery` wrapper): 3 lines
- `Example` component body: ~70 lines, of which:
  - `useMutation` definition with `onSettled` invalidation: 11 lines
  - Form (input + submit): 13 lines
  - List rendering with pending/error/optimistic states: ~25 lines
  - Status text (`isPending`/error display): 3 lines
- `App` (provider wrapper): 7 lines

**What this buys:** loading state, error state, background-refetch indicator, optimistic insert with pending styling, error-with-retry UI, and cache invalidation — all without a reducer, action types, a separate loading/error `useState` triple, or a manual `useEffect`+cleanup-flag fetch. The hand-rolled equivalent (per the prior review's own comparison) of just the *fetch* portion (no mutation, no optimistic UI) runs ~12 lines of `useState`/`useEffect`/`fetch`/`.then`/`.catch`/`.finally` — and that hand-rolled version has none of retry, dedup, cancellation, or cache sharing.

**Caveat on comparability:** because TanStack Query is a server-state library rather than a full TodoMVC framework, this 117-line example is not directly line-for-line comparable to the client-state TodoMVC implementations cited in the Zustand (54 lines) or Jotai (106 lines, with UI library deps) reviews — those implement full local CRUD+filter state; this implements fetch+add+invalidate against a real (mocked) API. The comparison that *is* fair: against the manual-`useEffect` data-fetching boilerplate it replaces, which the official docs' own side-by-side comparison (reproduced in the prior version of this review) shows growing roughly linearly with each additional concern (loading, error, retry, cache, dedup) that TanStack Query gives for free.

Score: **7.5** — the query half (`queryKey`+`queryFn`, 3 lines for a reusable hook) is extremely dense; the mutation half requires the `onSettled`/optimistic-UI ceremony (~11-15 lines) that has no equivalent shortcut, which is why this scores below Zustand/Jotai's pure-state-update token efficiency despite doing strictly more (network + cache + retry + cancellation).

### Evidence: Familiarity composite

Four proxies:

**1. First released:** 2019 (as "React Query"; renamed to "TanStack Query" with v4 in 2022 to reflect framework-agnostic adapters for Vue/Svelte/Solid/Angular). Seven years old at review time — squarely in the "established, well-covered" band.

**2. GitHub activity:** 49.7k stars, 3.9k forks (github.com/TanStack/query, fetched 2026-06-09). 96.7% TypeScript. Latest release 2026-06-02 (5.101.0); the patch cadence (5.100.9 → 5.101.0 across May–June 2026, roughly weekly) shows sustained active maintenance, not a project coasting.

**3. npm registry trend:** `@tanstack/react-query` shows **54.6 million weekly downloads** (npmjs.org download API, week of 2026-05-27 to 2026-06-02). This is an enormous number for a state-management-adjacent library — substantially larger than Zustand's ~35-39M/week cited in this corpus's Zustand review, and reflects TanStack Query's status as the de facto standard for data-fetching in React (and increasingly Vue/Svelte/Solid) apps. Direction: the library has been on a multi-year upward trajectory since v3's 2021 popularity inflection and shows no signs of plateauing.

**4. Community volume:** "React Query" / "TanStack Query" is one of the most commonly recommended additions to any new React project in 2025-2026 community discussion (alongside or ahead of any client-state library); the prior version of this review's qualitative assessment ("8/10 AI-friendliness... explicit query keys make it easy to find all related code") is corroborated by the library's prominence in the official React docs' own "you might not need an effect" guidance, which now explicitly recommends TanStack Query as the data-fetching answer.

**Structural note:** no CDN/script-tag undercount applies — TanStack Query is npm-distributed and the download figures are a direct, fair proxy.

**Triangulation:** seven years old, ~50k GitHub stars, ~55M weekly downloads, active weekly patch releases, and explicit endorsement in the official React documentation's data-fetching guidance. A model's pretraining almost certainly has deep, current coverage of `useQuery`/`useMutation`/`QueryClient` — likely deeper than any client-state library in this corpus given the download volume gap. Score: **8.5** — withheld from 9+ only because the v4→v5 single-object-signature rewrite (2023) means a meaningful fraction of older training data uses the now-removed `useQuery(key, fn, options)` positional-argument signature, which produces the `invalidateQueries`-style type errors documented above when reproduced verbatim today.

### Evidence: Stability / convention durability

**Current state:** v5 (released 2023) is the active major version, in a mature patch series. 5.101.0 shipped 2026-06-02; the prior six releases (5.100.9 through 5.101.0) span 2026-05-03 to 2026-06-02 — roughly weekly patches, consisting of TypeScript inference fixes, dependency bumps, and bug fixes (per `packages/react-query/CHANGELOG.md`, github.com/TanStack/query/blob/main/packages/react-query/CHANGELOG.md).

**v4→v5 (2023) breaking changes** (https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5), for context on what "a major version" has historically meant for this library:
- Single-object signature for all hooks (`useQuery({queryKey, queryFn, ...})` replaces positional arguments) — the single largest change, affecting every call site
- `cacheTime` → `gcTime`, `isLoading` → `isPending`, `useErrorBoundary` → `throwOnError`
- `onSuccess`/`onError`/`onSettled` callbacks removed from queries (retained for mutations)
- `initialPageParam` now required for infinite queries
- Minimum TypeScript 4.7, minimum React 18

A codemod was provided for the mechanical parts of this migration.

**v6 status:** searches for "TanStack Query v6" surface only the Svelte adapter's v6 (tracking Svelte 5 support) — it runs on the same v5 `@tanstack/query-core`. No RFC, discussion, or milestone proposes a v6 for `@tanstack/react-query` or `@tanstack/query-core` as of this review.

**`next_release` frontmatter reference:** `name: null`, `status: null`, `stability_penalty: false` — there is no tracked upcoming breaking release. The active development is patch-series-only.

Score: **8** — one point withheld relative to a "nothing ever changes" 9-10 because the v4→v5 single-object-signature change (2023) is recent enough that it remains the single most common source of "this code from a tutorial doesn't typecheck" friction (see Compiler Feedback evidence above), and because TanStack's overall pace of shipping new sibling libraries (TanStack DB, TanStack AI, TanStack Start) means the framework-agnostic core continues to evolve in how it's *positioned* even when the `useQuery`/`useMutation` API itself is settled.

### Evidence: Ecosystem tooling facts

**DevTools:**
- `@tanstack/react-query-devtools` (npm, version 5.101.0 — kept in lockstep with core) — YES. In-app floating panel: live list of every query by key, status (fresh/stale/fetching/inactive), data preview, last-updated timestamp, manual refetch/invalidate/reset/remove actions, and mutation tracking. https://tanstack.com/query/latest/docs/framework/react/devtools
- Framework-equivalent devtools packages exist for Vue, Svelte, Solid (same `query-core`).
- Tree-shakable / removable for production builds (documented pattern: conditional import).

**Test utilities:**
- No dedicated `@tanstack/react-query-testing` package, but the documented pattern (https://tanstack.com/query/latest/docs/framework/react/guides/testing) is to wrap renders in a fresh `QueryClientProvider` per test with `retry: false` and `gcTime: Infinity` to make tests deterministic.
- `queryFn` is a plain async function — directly unit-testable by mocking `fetch`/the API client with no React involved.
- Compatible with React Testing Library (`@testing-library/react`, 16.3.2) and Vitest/Jest — the standard React testing stack, no special adapters required.

**IDE/LSP support:**
- TypeScript language service covers all types natively (no plugin needed) — `useQuery`/`useMutation`/`queryOptions` all carry full inference into editor hover/autocomplete.
- `@tanstack/eslint-plugin-query` — YES, first-party. Includes `exhaustive-deps` (flags `queryFn` closures referencing variables not present in `queryKey` — a static check for a real cache-correctness bug class) and `prefer-query-object-syntax` (flags v4-style positional-argument calls). Supports both ESLint flat config and legacy config (https://github.com/TanStack/query/blob/main/docs/eslint/eslint-plugin-query.md).
- Codemod tooling for v4→v5 migration (`npx @tanstack/react-query-codemods`).

**Build/framework integration:**
- SSR/hydration: `HydrationBoundary` (Next.js App Router, TanStack Start documented patterns)
- Persistence: `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` for localStorage/IndexedDB cache persistence (used in the official "basic" example)
- Offline support: documented `onlineManager` configuration

**Checklist summary:**
- [x] Dedicated DevTools panel, framework-matched (React/Vue/Svelte/Solid)
- [x] First-party ESLint plugin with a cache-correctness rule (`exhaustive-deps`)
- [x] Codemod for major-version migration
- [x] Full native TypeScript types, no separate package
- [x] React Testing Library / Vitest-compatible, documented testing guide
- [x] SSR hydration helpers, persistence adapters
- [ ] No dedicated VS Code extension beyond TypeScript + ESLint
- [ ] No first-party MCP server (see "On the Horizon")

Score: **8.5** — the combination of a first-party DevTools panel *and* a first-party ESLint rule that catches a real class of cache bugs (`exhaustive-deps`) is more verification-side infrastructure than most state libraries in this corpus ship; the only gap is dedicated AI/IDE tooling beyond standard TS+ESLint.

---

## On the Horizon

### Next release
- **Name/version:** None tracked — current stable is 5.101.0 (2026-06-02), in an active weekly patch series.
- **Status:** null (no alpha/beta/rfc/announced major version for `@tanstack/react-query` or `@tanstack/query-core`).
- **What's changing:** Patch-level TypeScript inference fixes, dependency bumps, and bug fixes only. "TanStack Query v6" exists only as the name for the Svelte adapter's Svelte-5 support and runs on the same v5 core.
- **Anticipated impact:** None on the core `useQuery`/`useMutation`/`QueryClient` API or the conventions documented above.
- **Stability penalty:** No — see `next_release.stability_penalty: false`. The last major convention break (single-object signature, v4→v5) shipped in 2023 and is fully documented with a codemod; no new break is queued.

### AI-tooling investment
- **What exists:** TanStack publishes a project-wide `llms.txt` at `https://tanstack.com/llms.txt`, listing all TanStack libraries (Query, Router, Start, DB, Form, Table, AI, etc.) with links to their docs — confirmed live (HTTP 200) during this review. No Query-specific `llms.txt` or `llms-full.txt` exists (`tanstack.com/query/llms.txt` → 404). No first-party MCP server for TanStack Query specifically (third-party generic doc-fetching MCP proxies like gitmcp.io can wrap any GitHub repo, including this one, but that is not TanStack-specific tooling). No Boost-style curated AI guidelines package, no AI-specific style guide.
- **Observed delta:** Running the canonical fetch+mutate+invalidate exercise (the `optimistic-updates-ui` pattern) with `tanstack.com/llms.txt` in context vs. without: no observable difference. The project-wide `llms.txt` is a navigation index (library names + one-line descriptions + doc URLs), not inlined documentation or code patterns — it would help an agent *decide which TanStack library to look at* but doesn't change how `useQuery`/`useMutation`/`invalidateQueries` code is generated, since that knowledge is already densely represented in training data per the Familiarity evidence above (~55M weekly downloads). The delta would likely be larger for a less-familiar sibling library (e.g. TanStack DB) where pretraining coverage is thinner.
