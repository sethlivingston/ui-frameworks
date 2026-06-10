---
name: "TanStack Start"
category: "full-framework"
github_url: "https://github.com/TanStack/router"
docs_url: "https://tanstack.com/start/latest"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8.5
compiler_feedback_score: 6.5
locality_score: 6
explicitness_score: 6.5
convention_strength_score: 6
token_efficiency_score: 6
familiarity_score: 4
stability_score: 5.5
tooling_score: 7
version: "1.168.x (v1.0 Release Candidate)"
npm_package: "@tanstack/react-start"
ai_tooling:
  mcp_server:
    available: true
    url: "https://github.com/TanStack/cli (published as @tanstack/cli; ships an MCP server alongside scaffolding/agent-skills tooling)"
    party: "first-party"
  guidelines: "TanStack Agent Skills (Claude Code skill packages covering the TanStack ecosystem, installable via @tanstack/cli) — Boost-style curated guidance, first-party"
  llms_txt: true
  style_guides: "TanStack Start LLMO guide (https://tanstack.com/start/latest/docs/framework/react/guide/llmo) — but note this is guidance for developers optimizing *their own* sites for LLM consumption, not an AI-facing style guide for writing TanStack Start code"
  observed_delta: "Asked the model to add a new mutation (a 'rename board' server function + form) to the official start-trellaux fixture, once cold and once after loading https://tanstack.com/llms.txt plus the server-functions and type-safety guide pages. Cold, the model produced a plausible-looking but subtly wrong shape: a hand-rolled fetch() to a /api/ route handler plus useState-based optimistic UI — functionally similar to what a Next.js or Remix developer would reach for, but bypassing createServerFn, the validator chain, and the boardQueries/useMutation integration this codebase actually uses, producing code that would work but look structurally foreign next to every other mutation in the file. With the docs loaded, the model produced the idiomatic createServerFn({ method: 'POST' }).validator(zodSchema).handler() shape, wired through queryOptions/useMutation with an onMutate optimistic-cache update matching the existing useUpdateBoardMutation pattern almost line-for-line. The delta is the same class as SolidStart's (per research/solidstart.md): without official context, the model defaults to a generic-React-meta-framework mental model rather than TanStack's router-integrated server-function-plus-query-cache architecture — the framework's actual differentiator is invisible to a model that hasn't seen its docs."
next_release:
  name: "TanStack Start v1.0 stable + React Server Components (non-breaking v1.x addition)"
  status: "rc"
  changes: "The framework is currently shipping as a 'v1.0 Release Candidate' (per the official announcement, https://tanstack.com/blog/announcing-tanstack-start-v1) — the team states it expects 'a few small RC iterations' before cutting stable 1.0, with 'no major API shifts' anticipated. Separately, React Server Components support is in active development as an experimental feature (the docs explicitly flag this: 'React Server Components are available as an experimental feature') and is planned to land as a non-breaking v1.x addition — visible in-flight in the package registry as @tanstack/react-start-rsc (currently 0.1.24, shipping alongside @tanstack/react-start 1.168.25 per the 2026-06-06 release batch on https://github.com/TanStack/router/releases)."
  anticipated_impact: "The RC->1.0 transition itself is low-risk per the team's own framing (mechanical, no major API shifts). RSC landing as 'non-breaking' is the more consequential item to watch — if true, it would let TanStack Start adopt the RSC model Next.js already ships without disrupting the createServerFn/query-cache architecture this review documents as the framework's actual differentiator; if RSC adoption later turns out to require restructuring data-loading idioms (as it did for the Next.js Pages->App Router transition), that would be a much larger convention shift than the 'non-breaking' framing currently promises."
  stability_penalty: true
typescript_support: "native"
license: "MIT"
runtime: "both"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "declarative"
state_model: "queries"
rendering_strategy: "virtual-dom"
maintainer: "TanStack (Tanner Linsley) / Community"
first_released: "2024"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
---

# TanStack Start

> **Framing note (read before the rest of this review):** TanStack Start is *not* "Next.js with more features." It is a thinner, more minimal full-stack layer **built on top of TanStack Router** — file-based routing plus a `createServerFn` primitive for server-only logic — with SSR, streaming, and (experimental, in-progress) React Server Components. Its own v1 announcement frames it as building "type-safe, high-performance React apps without the heavy abstractions" and "no lock-in or opaque magic" (`https://tanstack.com/blog/announcing-tanstack-start-v1`). Where Next.js's App Router bundles a large, opinionated runtime (RSC by default, a built-in cache layer, `next/image`, `next/font`, middleware conventions, etc.), Start deliberately ships less framework and leans on TanStack Router's type system plus TanStack Query's cache as the load-bearing layers — the bet is that **type-level guarantees**, not **runtime feature bulk**, are what make a full-stack React app maintainable. This review evaluates Start as that bet, not as a Next.js clone with a different brand on it.

## State Management

### Philosophy & Mental Model

- **Server state is modeled as cached queries, not framework-managed "data"** — Start has no loader/`useLoaderData`-style primitive of its own (contrast Remix/React Router, SvelteKit, Nuxt). Instead, the canonical pattern (visible throughout the official `start-trellaux` fixture) is: define a `createServerFn`, wrap it in a TanStack Query `queryOptions` object, and call `queryClient.ensureQueryData(...)` from the route's `loader`. **TanStack Query is the state layer; Start is the plumbing that gets server functions to the client and routes to the query cache.**
- **Client/local state is plain React** — `useState`, `useReducer`, context — nothing Start-specific exists at this layer, a deliberate "don't reinvent React" choice consistent with the "no opaque magic" framing.
- **The server boundary is a function wrapper, not a file convention or a directive string** — `createServerFn()` is an explicit, named, importable, chainable builder (`.validator(...).handler(...)`). This sits at a different point on the explicitness spectrum than both SvelteKit's `+page.server.js` (file-naming) and SolidStart's `"use server"` (string-literal directive inside a function body, which `research/solidstart.md` documents as a real source of confusing bundler errors) — Start's boundary marker is a value you can hold a reference to, pass around, and have the type checker follow.

### Core Primitives

```ts
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

export const getBoard = createServerFn({ method: 'GET' })
  .validator(z.string())
  .handler(async ({ data }) => {
    const board = boards.find((b) => b.id === data)
    invariant(board, 'missing board')
    return board
  })

export const createColumn = createServerFn()
  .validator(newColumnSchema)
  .handler(async ({ data }) => {
    const board = boards.find((b) => b.id === data.boardId)
    invariant(board, 'missing board')
    board.columns = [...board.columns, { ...data, id: crypto.randomUUID() }]
  })
```
(`src/db/board.ts`, official `start-trellaux` fixture — `https://github.com/TanStack/router/tree/main/examples/react/start-trellaux`)

- **`createServerFn(options).validator(schema).handler(fn)`** — the entire server-boundary API surface. `validator` accepts a Zod schema (or any function `(raw) => parsed`); `handler` receives `{ data }` containing the validated/parsed result, runs server-only, and is callable directly from client code as if it were a normal async function.
- **`queryOptions` + `useQuery`/`useMutation`/`useSuspenseQuery`** — straight TanStack Query, the same library documented in `research/tanstack-query.md`. Start adds no wrapper layer on top; the fixture's `boardQueries` object is plain `queryOptions(...)` calls wrapping `createServerFn` results.
- **`Route.useLoaderData()` / route `context`** — TanStack Router's own data-access primitives (the `queryClient` itself is threaded through router context, set up once in `router.tsx`).

### Update Mechanism

Mutations flow through `useMutation` (TanStack Query) wrapping a `createServerFn`, with manual `onMutate` cache updates for optimistic UI — there is no automatic "revalidate by key" magic (a contrast with SolidStart's `query`/`action` pair, which `research/solidstart.md` documents as auto-revalidating by matching string keys):

```ts
export function useUpdateBoardMutation() {
  return useMutation({ mutationFn: updateBoard })
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createItem,
    onMutate: async (variables) => {
      await queryClient.cancelQueries()
      queryClient.setQueryData(
        boardQueries.detail(variables.data.boardId).queryKey,
        (board) => board ? { ...board, items: [...board.items, variables.data] } : undefined,
      )
    },
  })
}
```
(`src/queries.ts`)

This is **more boilerplate per-mutation** than SolidStart's `action`+key-matching or Remix's automatic loader revalidation — but it is also **fully explicit and traceable**: every cache write is a visible `setQueryData` call you can step into, not an implicit string-key match a developer has to know about. The trade is named directly in this review's Explicitness evidence below.

### Read Pattern

```ts
export const Route = createFileRoute('/boards/$boardId')({
  component: Home,
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(boardQueries.detail(params.boardId))
  },
})

function Home() {
  const { boardId } = Route.useParams()
  return <Board boardId={boardId} />
}
```
(`src/routes/boards.$boardId.tsx`)

Reading inside `Board` happens via plain `useQuery(boardQueries.detail(boardId))` — standard TanStack Query, fully typed against the `createServerFn`'s declared return type with no manual type annotation.

### Reactivity & Granularity

Component-level — Start sits on plain React, so re-renders follow React's component model (props/state changes trigger re-renders; `memo`/`useMemo` are the available tools). TanStack Query's selector-based `useQuery` subscriptions limit re-renders to components that actually read the changed query data — the same fine-grained-at-the-query-level model documented in `research/tanstack-query.md`. No framework-level compiler-driven re-render optimization (contrast Solid/SolidStart's fine-grained signals, or React Compiler when enabled).

### Async Handling

`createServerFn` handlers are `async`/`await` all the way down — plain promises, no special async-component syntax. Streaming is supported via `ReadableStream` or async generators returned from server functions (`https://tanstack.com/start/latest/docs/framework/react/guide/streaming-data-from-server-functions`), with the streamed shape fully typed end-to-end. **Selective SSR** (`https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr`) lets you configure, per route, whether `loader`/`beforeLoad` and the route component itself run on the server — a real, named knob for the "should this route be server-rendered" question that other frameworks often leave as an all-or-nothing default.

### Derived State

Plain React (`useMemo`) or plain TanStack Query `select` options — nothing Start-specific. The official fixture computes derived UI state (drag-and-drop ordering, optimistic merge of in-flight mutations into the rendered board) inline in component bodies using `useMemo` and array methods.

### Developer Experience
- **Boilerplate:** Medium — `createServerFn`+`queryOptions`+`useMutation`+manual `onMutate` is more lines-per-mutation than SolidStart's `action`/`query` pair (see Token-efficiency evidence), but every line is an explicit, steppable call.
- **DevTools:** TanStack Router Devtools (route tree, match state, loader status) and TanStack Query Devtools (query cache inspection, mutation status) — both rendered directly in the fixture's root route and both genuinely mature, widely-used panels shared with the standalone libraries.
- **Debugging:** Server-vs-client execution is delineated by an explicit, named function wrapper (`createServerFn`) you can grep for — a structural advantage over string-directive or filename-convention boundaries when an agent needs to enumerate "everything that runs on the server."
- **Time travel:** Not built in; TanStack Query Devtools expose cache history/inspection but not true time-travel.

## Rendering

### Philosophy & Approach
Plain React rendering (virtual DOM, reconciliation, hooks) — Start adds **no rendering-layer abstraction of its own**. The framework-level additions are entirely about *getting data and routes to the component tree*: file-based routing (via TanStack Router), full-document SSR, streaming, and (experimental) RSC. This is the concrete sense in which Start is "thinner" than Next.js: Next.js's App Router changes React's own rendering model (Server Components as the default, client/server component splitting as a first-class concern); Start, in its current stable form, renders with ordinary client React components and layers SSR underneath, with RSC arriving later as an opt-in, explicitly-experimental addition.

### Update Strategy
Standard React: state/prop changes trigger re-renders, batched per React 18+ semantics. Route transitions are managed by TanStack Router (preloading, pending states, `pendingComponent`) but the actual re-render mechanics underneath are plain React.

### Reconciliation
React's virtual DOM diffing — unchanged from base React. No framework-level override.

### Templating & Syntax
JSX — plain React JSX, no Start-specific transform:

```tsx
export const Route = createFileRoute('/boards/$boardId')({
  component: Home,
  pendingComponent: () => <Loader />,
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(boardQueries.detail(params.boardId))
  },
})

function Home() {
  const { boardId } = Route.useParams()
  return <Board boardId={boardId} />
}
```
(`src/routes/boards.$boardId.tsx`, 18 lines total — the entire file)

### Component Model
Function components, identical to plain React — `Route.useParams()`/`Route.useLoaderData()` are the only Start/Router-specific additions, and they're typed against the route definition (no manual generic annotation needed; the type flows from `createFileRoute('/boards/$boardId')` through to `useParams()`'s returned shape).

### Performance Optimizations
- **Selective SSR** (named above) — explicit per-route control over what runs server-side.
- **Streaming SSR** — `Suspense`-integrated, out-of-order chunk delivery.
- **Route preloading** — hover/intent-based prefetch, inherited from TanStack Router.
- **Standard React tools** — `memo`, `useMemo`, `useCallback`, code-splitting via `lazy`/route-based splitting. Nothing framework-specific beyond what TanStack Query's cache already provides at the data layer.

### Developer Experience
- **Learning curve:** Medium — a developer needs (a) plain React, (b) TanStack Router's file-based-routing and type-registration model, (c) TanStack Query's cache/mutation model, and (d) `createServerFn`'s validator/handler chain. Each piece is independently well-documented and shared with a standalone library that has its own large user base — a genuine advantage over frameworks whose primitives exist *only* inside the meta-framework.
- **DevTools:** TanStack Router + TanStack Query Devtools, both mature, both rendered inline in the official fixture's root route.
- **Hot reload:** Vite-powered HMR (Start is a Vite plugin as of the alpha->beta transition — see Stability evidence) — fast, standard.

## Event Handling

### Philosophy & Approach
Plain React synthetic events — no framework-level event system. Forms are handled with native `<form onSubmit={...}>` plus `FormData`, wired to `createServerFn`-backed mutations — a pattern visually similar to Remix's `<Form>`/action model but **without** Remix's automatic no-JS progressive-enhancement fallback (the `onSubmit` handler always calls `event.preventDefault()` and dispatches through `useMutation`; there's no server-side `action` export that intercepts a native POST).

### Event Binding
Inline JSX props, exactly as in plain React:

```tsx
<form
  method="post"
  onSubmit={(event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const id = crypto.randomUUID()
    formData.set(ItemMutationFields.id.name, id)
    mutate({ data: itemSchema.parse(Object.fromEntries(formData.entries())) })
  }}
>
```
(`src/components/NewCard.tsx`, official `start-trellaux` fixture)

### Event Flow
Standard React synthetic-event bubbling/capturing, `preventDefault`/`stopPropagation` exactly per React's documented behavior — no Start-specific override.

### Event Object
React's `SyntheticEvent` wrapper — identical to plain React, fully typed (`React.FormEvent<HTMLFormElement>`, `React.DragEvent<HTMLLIElement>`, etc., visible throughout `Card.tsx`'s drag-and-drop handlers).

### Common Patterns
- **Form submission → Zod-validated server function**: the fixture's `NewCard`/`NewColumn` components parse `FormData` into a typed object, validate it client-side against the same Zod schema the server function's `.validator()` uses (`itemSchema.parse(...)`), then call `mutate({ data })`. The schema is shared, imported on both sides — a genuinely good "single source of truth for shape" pattern, though it does mean an agent must know the client-side `parse` call and the server-side `.validator()` reference the *same* schema object rather than two independently-maintained ones.
- **Drag-and-drop with native DOM events**: `Card.tsx` implements full drag-and-drop reordering via `onDragOver`/`onDragLeave`/`onDrop` and `dataTransfer`, entirely with native browser APIs and React's synthetic wrappers — no framework-provided DnD primitive.
- **Optimistic UI via manual `onMutate`**: see State Management above — explicit, but verbose relative to SolidStart's `useSubmission`.

### Performance Considerations
No framework-level event delegation beyond what React's synthetic event system already does. Handler identity matters in the usual React sense (re-creating inline handlers on every render is fine for correctness, a `useCallback` concern only at scale) — nothing Start-specific to reason about beyond ordinary React performance discipline.

### Developer Experience
- **Debugging:** Plain React DevTools work for component/event inspection; TanStack Query Devtools show mutation pending/error/success state directly.
- **Type safety:** End-to-end — `event.currentTarget`, `FormData` parsing, and the `mutate({ data })` call are all typed against the shared Zod schema and the `createServerFn`'s declared validator/handler signatures.

## Rubric Evidence

### Evidence: Type-system integration
**Categorical fact: native.** TanStack Start is written in TypeScript, and its two load-bearing primitives — `createFileRoute` (via TanStack Router's route-tree type registration) and `createServerFn` (via its `.validator().handler()` chain) — both carry full generic inference end-to-end, with no manual annotation required in the official fixture.

Sample type error — passing a value that doesn't match a `createServerFn`'s declared validator schema:

```ts
export const getBoard = createServerFn({ method: 'GET' })
  .validator(z.string())
  .handler(async ({ data }) => { /* data: string, inferred */ })

// usage:
getBoard({ data: 42 })   // number where the validator declares z.string()
```

TypeScript's reported error (the inference chain runs validator-schema -> `.validator()`'s generic -> the call-site `data` parameter type):
```
Argument of type '{ data: number; }' is not assignable to parameter of type '{ data: string; } | undefined'.
  Types of property 'data' are incompatible.
    Type 'number' is not assignable to type 'string'.
```

A second, router-level example — TanStack Router's signature feature is that **`<Link to="...">` and `useParams`/`useLoaderData` are typed against the actual route tree**, generated via `routeTree.gen.ts`. Passing a route path that doesn't exist in the tree, or destructuring a param the matched route doesn't declare, is a compile-time error rather than a runtime 404 or `undefined` — this is the single most-repeated claim across the framework's own docs and announcement post ("type-safe, file-based routing... no lock-in or opaque magic," `https://tanstack.com/blog/announcing-tanstack-start-v1`), and it is the concrete mechanism behind that claim: route identity is a type, not a string a developer has to get right by memory.

**Friction note**: the official type-safety guide page I tried to cite directly (`https://tanstack.com/router/v1/docs/framework/react/guide/type-safety`) returned a 404 (`{"isNotFound":true}`) at review time — a real, checkable instance of TanStack's fast-moving doc-versioning (v1 vs latest vs framework/react paths) producing dead links even from search-indexed URLs. I reconstructed the error transcript above from the documented `.validator()`/schema-inference mechanism (confirmed live on the current server-functions guide) rather than from a literal captured transcript, and I'm flagging that reconstruction explicitly per this review's documentation-friction protocol.

### Evidence: Compiler/build feedback quality
Deliberately-broken example, run against the pattern the official fixture itself uses — a Zod `.validator()` parse failure at the server-function call boundary:

```ts
export const createColumn = createServerFn()
  .validator(newColumnSchema)   // newColumnSchema requires { boardId: string, name: string, ... }
  .handler(async ({ data }) => { /* ... */ })

// calling site, with a typo'd/missing field:
mutate({ data: { boardId: '1', title: 'New column' } })  // 'title' instead of 'name' — passes TS if loosely typed, fails Zod at runtime
```

Two distinct feedback layers fire here, and they differ sharply in quality:
1. **TypeScript** (if the call-site object is checked against the inferred validator-input type) reports a precise, line-pointing structural mismatch — `Object literal may only specify known properties, and 'title' does not exist in type '{ boardId: string; name: string; ... }'`. This is the strong path, and it's the one Start's docs and announcement foreground.
2. **Zod at runtime** (the actual fixture pattern — client-side `schema.parse(Object.fromEntries(formData.entries()))` before calling `mutate`) throws a `ZodError` with a structured `issues` array (`{ path: ['name'], message: 'Required', code: 'invalid_type' }`) — actionable and field-precise, but it's a *runtime* exception surfaced in the browser console or an error boundary, not a compiler diagnostic. An agent relying on "the compiler will catch shape mismatches" needs to know that **`FormData`-sourced values are untyped at the TypeScript level** (every `formData.get(...)` returns `FormDataEntryValue | null`) — the type system's guarantees end at the `Object.fromEntries` boundary, and Zod is doing the actual validation work the type system can't reach into a runtime `FormData` object to perform.

This is a real, citable nuance: Start's "end-to-end type safety" claim is strongest at the `createServerFn` call boundary (function to function) and measurably weaker at the DOM-to-typed-object boundary (`FormData` to validated shape) — exactly the seam where most real mutations originate.

### Evidence: Locality of behavior
Traced: "add a new card to a column," using the **official `start-trellaux` fixture** (`https://github.com/TanStack/router/tree/main/examples/react/start-trellaux`) — a Trello-style CRUD board that is the closest thing to a canonical, maintainer-vetted, full-CRUD reference app in TanStack Start's own example set (no TodoMVC exists for Start; see Token-efficiency evidence for the search trail).

Touchpoints required to understand/change this one feature:
1. `src/components/NewCard.tsx` (89 lines) — the form UI: ref-based textarea, `FormData` extraction, client-side Zod parse, `mutate({ data })` call.
2. `src/queries.ts` (183 lines, but only the ~15-line `useCreateItemMutation` block is relevant) — the `useMutation` wrapper with its `onMutate` optimistic-cache-write logic.
3. `src/db/board.ts` (130 lines, ~10 relevant) — the `createItem` server function: `.validator(itemSchema).handler(...)` performing the actual mutation against the in-memory `boards` array.
4. `src/db/schema.ts` (40 lines) — the shared `itemSchema` Zod schema both the client-side parse and the server `.validator()` reference by import (an explicit, traceable shared reference — not a string-key match).
5. `src/types.ts` (24 lines) — `ItemMutationFields`, the field-name constants the form's hidden inputs and the schema both key off.

**Count: 5 files**, all connected by **explicit imports** (no string-key matching, no filename convention, no auto-import) — a developer or agent can `Cmd+click`/`go-to-definition` through the entire chain. This is comparable in raw count to SolidStart's traced feature (4 files + 1 string-key) and SvelteKit's load-function model, but with the SolidStart string-key touchpoint replaced by a typed, importable schema reference — trading "one fewer thing to track" for "every connection is a real, navigable reference."

### Evidence: Explicitness / data-flow traceability
Traced: clicking "Save Card" on the new-card form, end to end, from the official fixture.

1. `onSubmit` fires (native form submit, intercepted via `event.preventDefault()`) -> `FormData` extracted, parsed via `itemSchema.parse(...)` (explicit — a function call on an imported schema, fully steppable).
2. `mutate({ data })` calls `useCreateItemMutation`'s `mutationFn: createItem` (explicit — `createItem` is a named, imported `createServerFn` reference; an agent can jump directly to its definition).
3. `onMutate` fires *before* the network call resolves, writing optimistic data via `queryClient.setQueryData(boardQueries.detail(boardId).queryKey, ...)` (explicit — a visible, steppable cache-write call referencing a typed `queryKey` derived from a `queryOptions` factory function, not a bare string).
4. The server function's `.handler()` runs server-side, mutates the `boards` array, and returns (explicit — plain async/await, no ORM-magic in this fixture).
5. TanStack Query settles the mutation and reconciles the optimistic cache write with the real server response (implicit, but **named, single-purpose, and shared with the standalone TanStack Query library** — the same "well-documented magic learned once" category `research/tanstack-query.md` already covers).
6. React re-renders the subscribed components from the updated cache (implicit — ordinary React reactivity, the most thoroughly-documented "magic" in this entire corpus).

**Net assessment: 6 hops, 4 explicit / 2 implicit**, and — in contrast with SolidStart's traced equivalent (which found one *SolidStart-specific, unnamed, string-key* implicit hop that required cross-referencing two files to even notice) — **both implicit hops here are well-known, separately-documented mechanisms** (TanStack Query's cache reconciliation; React's render cycle) that an agent is highly likely to have already internalized from the standalone libraries. Start adds no *new* implicit behavior of its own to this trace — it is composing two extremely well-trodden libraries (React, TanStack Query) with one explicit boundary primitive (`createServerFn`). That composition-over-invention choice is the main reason this scores higher than SolidStart's 4-explicit/2-SolidStart-specific-implicit trace, even though the raw hop count is similar.

### Evidence: Convention strength
Canonical task probed: **"fetch and cache server data for a route."** Unlike SolidStart (where this review found four overlapping, partially-deprecated APIs), Start's docs and the official fixture converge on a **single, consistently-applied pattern**: `createServerFn` -> `queryOptions` -> `queryClient.ensureQueryData` in the route `loader` -> `useQuery`/`useSuspenseQuery` in the component. Every data-fetching site in `start-trellaux` (`boardQueries.list`, `boardQueries.detail`) follows this exact shape with no variation.

Where convention strength gets thinner: **the relationship between `createServerFn` and TanStack Query is a documented best-practice, not an enforced or generated one.** Nothing prevents calling a `createServerFn` directly inside a component with `useEffect` (the pre-Query, pre-Start-idiom React pattern an agent's general training is most likely to default to), or wrapping it in a bare `useState`/manual-fetch combo instead of `useQuery`. The framework doesn't generate, scaffold, or type-enforce the `queryOptions` wrapper step — it's tutorial-and-example convention, reinforced by the fact that the official fixtures all do it the same way, but not structurally guaranteed. This is the same "convention exists in examples but isn't load-bearing in the type system" gap that makes an agent's *prior* training (React + `useEffect` fetching) a real competing attractor — exactly what this review's `ai_tooling.observed_delta` entry found in practice.

**Friction note**: locating the canonical pattern required cross-referencing the overview docs (which describe the pieces separately), the server-functions guide (which shows `createServerFn` in isolation, without the `queryOptions` wrapper), and the official fixture's `queries.ts` (which is where the actual recommended composition becomes visible) — the "this is how you're supposed to combine these two libraries" guidance lives more in example code than in prose documentation.

### Evidence: Token efficiency / boilerplate density
**No canonical TodoMVC exists for TanStack Start** — confirmed by searching both `todomvc.com` (no TanStack/Start/Router entry in the framework list) and TanStack's own example set (`https://github.com/TanStack/router/tree/main/examples/react`, 19 `start-*` directories spanning auth providers, UI-library integrations, streaming demos, and one CRUD app — `start-trellaux` — but no todo-list app). Per this review's TodoMVC-first protocol, I'm citing the **closest available canonical reference**: `start-trellaux`, a Trello-style CRUD board that is built, maintained, and used as a live example by the TanStack team itself, exercising the same feature class (create/read/update/delete/reorder over a collection, with optimistic UI) as TodoMVC at slightly larger scope.

Line counts (`wc -l`, official fixture, excluding generated `routeTree.gen.ts` and CSS):

| File | Lines | Role |
|---|---|---|
| `src/components/Column.tsx` | 258 | Column UI: drag-and-drop target, card list, inline rename |
| `src/queries.ts` | 183 | All `queryOptions` + `useMutation` wrappers (8 mutations) |
| `src/routes/__root.tsx` | 156 | Root layout, head/meta, devtools wiring |
| `src/db/board.ts` | 130 | All 9 server functions (reads + writes) |
| `src/components/Card.tsx` | 124 | Card UI incl. full native drag-and-drop reordering |
| `src/components/Board.tsx` | 112 | Board layout, column list |
| `src/components/NewCard.tsx` | 89 | New-card form |
| `src/components/EditableText.tsx` | 85 | Shared inline-edit component |
| `src/router.tsx` | 58 | Router + QueryClient wiring |
| `src/components/NewColumn.tsx` | 72 | New-column form |
| `src/icons/icons.tsx` | 41 | Icon components |
| `src/db/schema.ts` | 40 | Zod schemas (shared client/server) |
| `src/utils/posts.tsx` | 35 | (unrelated demo utility carried over from start-basic template) |
| `src/routes/index.tsx` | 34 | Board-list landing route |
| `src/utils/seo.ts` | 33 | Meta-tag helper |
| *(11 smaller files, 5–25 lines each)* | ~211 | Icons, types, error boundaries, hooks, route glue |
| **Total (all `.ts`/`.tsx`, excl. generated)** | **1,669** | |

This is **substantially larger** than SolidStart's official TodoMVC fixture (358 lines, per `research/solidstart.md`) and Preact's TodoMVC port (335 lines) — but the comparison is **not apples-to-apples in scope**: `start-trellaux` implements a multi-board, multi-column, drag-and-drop-reorderable Trello clone with full optimistic UI for nine distinct mutations, a meaningfully larger feature surface than TodoMVC's single flat list and seven operations. Restricting to the *data layer alone* (the fairest narrow comparison): Start's `board.ts` + `queries.ts` = 313 lines for 9 read/write operations with manual optimistic-cache wiring, versus SolidStart's `api.ts` = 84 lines for 7 operations with automatic revalidation — a real, citable difference in per-operation token cost that traces directly to the explicit-`onMutate`-vs-automatic-key-revalidation design choice this review documents in State Management above. **The lack of a same-spec canonical reference (no TodoMVC) is itself the headline finding for this dimension**: it means no apples-to-apples cross-framework comparison is possible from official sources alone, which is a real ecosystem-maturity signal for a framework at v1.0-RC.

### Evidence: Familiarity composite
Four proxies:
- **`first_released`: 2024`** — TanStack Start's first public beta shipped in 2024 (announced alongside TanStack Router v1's broader full-stack ambitions); it is reaching v1.0-RC only now (2026), making it one of the youngest frameworks in this corpus — younger than SolidStart (2022 beta, 2024 1.0) and dramatically younger than Next.js, Nuxt, SvelteKit, or Remix.
- **GitHub activity**: the framework lives in the `TanStack/router` monorepo — **14,595 stars, 1,707 forks, 564 open issues, pushed 2026-06-08** (`https://github.com/TanStack/router`, queried live) — substantial and very actively maintained (commits/releases multiple times per day per the release feed), though the star count reflects the combined Router+Start project rather than Start alone, an attribution ambiguity worth naming.
- **Registry trend**: `@tanstack/react-start` — **14.3M downloads in the last week** (`https://api.npmjs.org/downloads/point/last-week/@tanstack/react-start`, queried live) against `@tanstack/react-router`'s 17.5M — i.e., Start's adoption is already running at roughly 80% of its own router's download volume, a strikingly fast convergence for a framework still in RC. Direction is unambiguously up; TanStack's broader ecosystem (Query, Table, Router) is one of the most actively-growing corners of the React world.
- **SO/community volume**: Stack Overflow's `tanstack-start` tag carries **11 questions**; `tanstack-router` carries **54**; the broader `tanstack` tag carries **192**; `tanstack-react-query` carries **407** (`https://api.stackexchange.com/2.3/tags?inname=tanstack`, queried live). The `tanstack-start`-specific number is genuinely tiny — smaller even than SolidStart's already-small `solid-start` count (20) — consistent with a framework that is, as of this review, barely a year into its public RC cycle.

Triangulation: very young (2024, RC-stage in 2026), small-but-rapidly-growing registry footprint riding on a well-established sibling library's momentum, strong GitHub activity (shared with Router), and the thinnest Q&A corpus of any full-framework reviewed in this corpus. An agent's pretraining is very unlikely to contain meaningful TanStack Start-specific exposure — though it likely *does* contain substantial exposure to TanStack Query and TanStack Router individually (both far more established), which partially offsets the gap for the parts of Start that are thin composition over those libraries (see Explicitness evidence). Net: **lower than SolidStart's already-low 4.5**, reflecting that Start is younger still and has an even thinner dedicated Q&A corpus, moderated slightly upward by the strength of its sibling libraries' familiarity.

### Evidence: Stability / convention durability
Cited directly from `next_release` (frontmatter): **TanStack Start is currently a "v1.0 Release Candidate"** (`https://tanstack.com/blog/announcing-tanstack-start-v1`), with the team stating it expects "a few small RC iterations" before stable 1.0, and explicitly "no major API shifts" anticipated for that final step. Categorized:

- **Recent, real breaking change already absorbed**: per community release notes and the alpha->beta transition, **TanStack Start became a Vite plugin** — registered in the Vite config rather than via the previous `app.config.ts` convention. This is exactly the kind of "how it's done today won't be true in 6 months" churn the stability dimension exists to catch — and it already happened once during Start's short public life, which is informative about the *rate* of foundational change for a framework this young, even if the team frames the remaining RC->1.0 step as small.
- **RSC landing as an in-progress, explicitly-experimental feature**: the docs state plainly, "React Server Components are available as an experimental feature," and the team frames its arrival as "a non-breaking v1.x addition." The in-progress nature is independently visible in the package registry: `@tanstack/react-start-rsc` is shipping at `0.1.24` alongside `@tanstack/react-start@1.168.25` in the same 2026-06-06 release batch (`https://github.com/TanStack/router/releases`) — a 0.x version number for a feature described as "non-breaking" is worth noting as a real signal of in-flux status, whatever the eventual integration promise.
- **Versioning cadence**: the `@tanstack/react-start` changelog shows multiple releases *per day* (three releases on 2026-06-06 alone) — a healthy sign of active maintenance, but also a concrete data point on how frequently the API surface is touched, even during an RC period framed as stable.

`next_release.stability_penalty: true` — set on the strength of (a) a real, already-absorbed foundational breaking change (the Vite-plugin migration) within Start's short public history, (b) RSC support landing as an actively-developed, 0.x-versioned, explicitly-experimental feature whose "non-breaking" framing has not yet been tested against a real integration, and (c) a release cadence (multiple per day) that, while a sign of health, also means "how it's done today" has a measurably higher chance of drifting within six months than for a framework with SvelteKit's or Next.js's release cadence and multi-year stable-convention track record. This is a more moderate penalty than SolidStart's (which stacked a build-layer rewrite on top of a live data-API rename) — Start's RC->1.0 step is explicitly framed as small, and the RSC work is explicitly additive — but it is a real, citable "this is mid-transition" signal, not a quiet one.

### Evidence: Ecosystem tooling facts
- **DevTools**: yes, and mature — **TanStack Router Devtools** (`@tanstack/react-router-devtools`, route tree/match-state/loader-status inspection) and **TanStack Query Devtools** (`@tanstack/react-query-devtools`, query-cache and mutation-state inspection), both rendered directly in the official fixture's `__root.tsx` and both shared with — and battle-tested by — the large standalone user bases of Router and Query independently. This is a genuine structural advantage: an agent or developer encountering Start's devtools is very likely to have already encountered (or have training exposure to) the *same* devtools from the standalone libraries.
- **Test utilities**: yes, but thinly documented for Start specifically — Vitest + `@testing-library/react` + `@testing-library/jest-dom`/`user-event` is the documented pattern for Router (`https://tanstack.com/router/latest/docs/framework/react/how-to/setup-testing`), and Playwright is the documented E2E path; however, **community discussion threads (e.g. `https://www.answeroverflow.com/m/1434169138326278344`, "Jest and Playwright for Tanstack Start") explicitly report friction and request dedicated Start-level testing documentation** (also tracked as an open docs-improvement discussion, `TanStack/router#5727`) — a real, citable instance of "the standalone library's tooling mostly transfers, but the meta-framework-specific seams are under-documented," structurally similar to (though less severe than) SolidStart's testing-documentation gap.
- **IDE/LSP support**: strong — native end-to-end TypeScript inference (per Type-system evidence) means VS Code's built-in TS/JSX tooling surfaces route-tree types, server-function signatures, and query-cache shapes without any Start-specific language server or plugin. The route tree is generated to `routeTree.gen.ts` (an inspectable artifact an agent can read directly to "see" the typed route graph — comparable to SvelteKit's generated `./$types`, and more inspectable than SolidStart's no-generation-step inference, which leaves nothing concrete to point a confused agent at).
- **Build tooling**: Vite-powered (Start is itself a Vite plugin as of the alpha->beta migration — see Stability evidence), with the same broad Vite-ecosystem deployment-target flexibility (Cloudflare Workers has an official integration guide, `https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/`) that other Vite-based meta-frameworks in this corpus enjoy.
- **First-party AI tooling** (tracked in `ai_tooling`/On the Horizon, not scored here, but worth flagging as adjacent infrastructure): an official MCP server and "Agent Skills" ship via `@tanstack/cli` — see below.

## On the Horizon

### Next release
- **Name/version:** TanStack Start v1.0 stable (from the current `1.0 Release Candidate`) + React Server Components as a non-breaking v1.x addition
- **Status:** rc (the framework itself); RSC support is independently tracked as experimental/in-progress (`@tanstack/react-start-rsc` at `0.1.24`)
- **What's changing:** The team frames the RC->1.0 step as small and mechanical ("a few small RC iterations," "no major API shifts" — `https://tanstack.com/blog/announcing-tanstack-start-v1`). Separately and on a longer timeline, RSC support — currently flagged "experimental" in the docs — is planned to land "as a non-breaking v1.x addition."
- **Anticipated impact:** If the RC->1.0 step is as small as promised, it should have minimal effect on the rubric evidence above. The RSC landing is the more consequential watch item: "non-breaking" is an optimistic framing for a change that, in Next.js's history, came bundled with a substantial shift in idiomatic data-fetching patterns (Pages Router -> App Router). If TanStack Start's RSC integration genuinely composes with the existing `createServerFn`/`queryOptions` architecture without displacing it, that would be a meaningfully different (and better) outcome than the precedent Next.js set — but it hasn't shipped yet, and the 0.x version number on the RSC package is a concrete signal that the integration is still being worked out in public.
- **Stability penalty:** Yes — see Stability evidence above: a real foundational breaking change (Vite-plugin migration) already absorbed within Start's short public history, an actively-developed and 0.x-versioned RSC feature whose "non-breaking" promise is untested, and a release cadence (multiple per day) that signals an API surface still very much in motion even during the "stable" RC window.

### AI-tooling investment
- **What exists**: TanStack ships an unusually deep first-party AI-tooling stack for a framework this young:
  - **Official MCP server** — published as part of `@tanstack/cli` (`https://github.com/TanStack/cli`), described as bringing "the full power of the TanStack CLI directly into your AI assistant," exposing keyless documentation search, full-text guides, project scaffolding, and "ecosystem discovery of 16+ libraries." First-party, not community.
  - **Agent Skills** — Claude Code skill packages covering "the complete TanStack ecosystem" with "comprehensive API documentation, code examples, TypeScript patterns, best practices, and common pitfalls," installable via the same CLI (`https://llmbase.ai/skills/tanstack-skills/tanstack-start/` indexes the published skill; the CLI repo references an `.agents` directory and "Agent Skills Installation").
  - **`llms.txt`** — confirmed live at `https://tanstack.com/llms.txt` (HTTP 200, returns a structured markdown index linking TanStack Start, Router, Query, and a dozen other libraries' docs).
  - **An LLMO guide** (`https://tanstack.com/start/latest/docs/framework/react/guide/llmo`) — worth flagging as a *different* kind of artifact than the others: it teaches developers how to optimize *their own* TanStack Start sites for LLM consumption (schema.org markup, JSON-LD endpoints, their own `llms.txt` files) — useful, first-party, but not itself an AI-facing style guide for *writing* TanStack Start code, so it's recorded in `ai_tooling.style_guides` with that caveat rather than counted as equivalent to a Boost-style coding-guidelines package.
- **Observed delta**: see `ai_tooling.observed_delta` in frontmatter for the full before/after — summary: asking the model to add a new mutation to the official `start-trellaux` fixture, cold vs. with `https://tanstack.com/llms.txt` plus the server-functions/type-safety guides loaded, produced the same *class* of delta `research/solidstart.md` documents for SolidStart's llms.txt: cold, the model defaulted to a generic-React-meta-framework shape (hand-rolled `fetch` + `useState`) that bypassed `createServerFn`/`queryOptions`/`useMutation` entirely; with context loaded, it produced the idiomatic chained-builder-plus-query-cache shape matching the existing codebase almost line-for-line. This reinforces a pattern now visible across at least two young, thin-runtime, type-safety-first frameworks in this corpus: **official context-loading changes which framework's mental model the agent reaches for, not just which import paths it writes** — a qualitatively larger effect than the "polish the details" delta seen for more broadly-trained-on frameworks like Preact.

---

## Anti-Patterns from Human-Era Thinking

- **"Convention by example" still leaves room for an agent's prior training to win.** The `createServerFn` -> `queryOptions` -> `useQuery` composition is consistently applied across the official fixture, but nothing in the type system or scaffolding *enforces* it — an agent (or a human fresh from a `useEffect`-fetching codebase) can write code that compiles, runs, and looks plausible while completely bypassing the framework's actual differentiator. This review's `ai_tooling.observed_delta` makes that concrete and citable: the gap between "the convention exists" and "the convention is the path of least resistance for an agent without context" is exactly where thin-runtime, composition-heavy frameworks are most exposed.
- **Manual optimistic-cache wiring (`onMutate` + `setQueryData`) is more explicit but measurably more verbose than automatic revalidation — and the corpus now has two contrasting data points to weigh that trade against.** SolidStart's `query`/`action` pair achieves a comparable optimistic-UI outcome in roughly a third of the per-operation code (see Token-efficiency evidence's data-layer comparison: 313 lines / 9 ops vs. 84 lines / 7 ops) at the cost of an implicit, string-key-matched revalidation hop this review's SolidStart companion piece flags as a real locality/explicitness cost. Start's choice trades token efficiency for traceability — a defensible trade, but one a next-gen framework should try to avoid having to make at all (see Transferable Patterns).
- **Dead documentation links from search-indexed URLs are a small but real "trust the docs" erosion.** The 404 encountered while trying to cite TanStack Router's own type-safety guide (a page search engines still index) is a minor but concrete instance of the version-proliferation problem fast-moving frameworks create for themselves — `v1` vs `latest` vs `framework/react` path segments multiplying the number of URLs that can silently rot.

## Transferable Patterns for Next-Gen Framework

- **A named, importable, chainable function wrapper is a genuinely better server-boundary marker than a file convention or a string directive — and this corpus now has three data points to compare.** `createServerFn()` (Start), `+page.server.js` (SvelteKit), and `"use server"` (SolidStart) all solve "which code never reaches the client," but only Start's version is a *value* — something you can hold a reference to, pass around, grep for as an import, and have the type checker trace through. `research/solidstart.md` documents a real bug class (`#1526`) that exists specifically because SolidStart's marker is invisible to tooling that reasons structurally before reading function bodies; Start's `createServerFn` has no equivalent failure mode because the boundary *is* a structural element (an exported binding), not lexically buried prose. A next-gen framework should prefer "boundary as a typed, named, importable value" over both "boundary as file location" and "boundary as string literal."
- **Shared, imported validation schemas (not string-key cache coordination) are the more traceable way to keep client and server in sync.** Start's `itemSchema` — imported on both the client-side `parse` call and the server-side `.validator()` — gives an agent a single, `go-to-definition`-able source of truth for "what shape does this data have on both sides of the network." Contrast SolidStart's `query(fn, "todos")` ↔ revalidation-by-string-key pattern (`research/solidstart.md`'s Explicitness evidence flags this as the one genuinely implicit, untraceable hop in its trace). A next-gen framework's data layer should make *every* cross-boundary relationship — validation, cache keys, revalidation triggers — a typed reference rather than a string both sides must independently remember.
- **Composing well-established standalone libraries (rather than inventing framework-specific equivalents) is a measurable familiarity hedge for young frameworks.** Start's choice to *be* TanStack Router + TanStack Query + a thin server-function primitive — rather than inventing its own loader/action/cache vocabulary — means an agent's substantial pretraining exposure to Query and Router individually partially carries over to Start, even though Start itself is barely a year into public RC. This review's Familiarity evidence and Explicitness evidence both independently land on the same observation: composition-over-invention is a legible strategy for "how does a framework stay learnable by agents while it's still young," and a next-gen framework's own primitives should be designed for exactly this kind of compositional reuse from day one — winning familiarity not by being old, but by being built from parts that are.

---

Sources:
- [TanStack Start Overview](https://tanstack.com/start/latest/docs/framework/react/overview)
- [TanStack Start v1 Release Candidate announcement](https://tanstack.com/blog/announcing-tanstack-start-v1)
- [Server Functions guide](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [Streaming Data from Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/streaming-data-from-server-functions)
- [Selective SSR guide](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr)
- [LLMO (LLM Optimization) guide](https://tanstack.com/start/latest/docs/framework/react/guide/llmo)
- [Official start-trellaux example fixture](https://github.com/TanStack/router/tree/main/examples/react/start-trellaux)
- [TanStack/router GitHub repository](https://github.com/TanStack/router)
- [TanStack/router releases feed](https://github.com/TanStack/router/releases)
- [TanStack CLI (scaffolding, official MCP server, Agent Skills)](https://github.com/TanStack/cli)
- [TanStack llms.txt](https://tanstack.com/llms.txt)
- [TanStack Agent Skills index (third-party mirror)](https://llmbase.ai/skills/tanstack-skills/tanstack-start/)
- [TanStack Router setup-testing guide](https://tanstack.com/router/latest/docs/framework/react/how-to/setup-testing)
- [Community thread: Jest/Playwright testing friction for TanStack Start](https://www.answeroverflow.com/m/1434169138326278344)
- [TanStack/router discussion #5727: dedicated testing documentation](https://github.com/TanStack/router/discussions/5727)
- [Cloudflare Workers TanStack Start framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)
- `research/solidstart.md` and `research/tanstack-query.md` (in-corpus cross-references for comparison points cited throughout this review)
