---
name: "SolidStart"
category: "meta-framework"
github_url: "https://github.com/solidjs/solid-start"
docs_url: "https://docs.solidjs.com/solid-start"
implementation_language: "TypeScript"
status: "active"
type_system_score: 7.5
compiler_feedback_score: 5
locality_score: 6
explicitness_score: 6
convention_strength_score: 4.5
token_efficiency_score: 6
familiarity_score: 4.5
stability_score: 4.5
tooling_score: 6.5
version: "1.3.2 (2.0.0-alpha.2 in development)"
npm_package: "@solidjs/start"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: true
  style_guides: null
  observed_delta: "Generated the canonical 'add + toggle + derived remaining-count' TodoMVC slice (the same feature traced under Locality/Token-efficiency below) twice: once cold, once after loading https://docs.solidjs.com/llms-solid-full.txt plus the solid-router data-APIs llms.txt page into context first. Cold, the model defaulted to a SPA-shaped pattern — createSignal + createResource + a manual refetch() in the click handler — which compiles and runs but skips SolidStart's server-function/action/query model entirely (i.e. it wrote a Solid SPA, not a SolidStart app — the meta-framework's actual value proposition). With the llms.txt loaded, the model produced the idiomatic action()+query()+createAsync()+useSubmission() shape on the first pass, including the 'use server' directive placement and the optimistic-UI useSubmissions() pattern the official fixture uses. The delta was substantial — it didn't just fix import paths (as with Preact's llms.txt delta), it changed which *architecture* the model reached for, closing a gap that's otherwise invisible until you compare the SPA-shaped output against the framework's own canonical reference."
next_release:
  name: "SolidStart 2.0 (alpha, 'DeVinxi')"
  status: "alpha"
  changes: "Replaces the Vinxi build-orchestration layer (itself a wrapper combining Vite + Nitro + router-config glue) with a direct, pure-Vite-based internal architecture nicknamed 'DeVinxi.' Per the team's own framing, 'Vite/Nitro saw value in what Vinxi brought to the table and together they superseded its necessity in ~75%' — the remaining work is closing that last 25% gap natively. Currently at 2.0.0-alpha.2 (2026-02-20); 1.x continues shipping in parallel (1.3.2, 2026-02-24)."
  anticipated_impact: "Primarily an internals/build-layer simplification — removes an entire dependency (Vinxi) that has been a recurring source of confusing, framework-internals-shaped error messages (see Compiler-feedback evidence: 'env is not exported by __vite-browser-external'-style errors that point at bundler plumbing rather than the user's actual mistake). If DeVinxi succeeds in collapsing that indirection, it should directly improve Compiler-feedback-quality and Stability for anyone building on 2.0 — but it is explicitly a rewrite of the build pipeline underneath a stable-feature-surface app, not a paradigm change to routing/data/actions, which is why this review treats it as roadmap context rather than a reason to defer scoring."
  stability_penalty: true
typescript_support: "native"
license: "MIT"
runtime: "both"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "reactive"
state_model: "signals"
rendering_strategy: "fine-grained"
maintainer: "SolidJS core team / Ryan Carniato (community)"
first_released: "2022"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
---

# SolidStart

> **Framing note:** SolidStart is "the Solid app framework" — to Solid what Next.js is to React, Nuxt is to Vue, and SvelteKit is to Svelte. Its headline distinguishing claim, stated on its own landing page (`https://start.solidjs.com/`), is **"Fine-Grained Reactivity goes fullstack"**: it extends Solid's no-virtual-DOM, no-component-re-render reactive model across the server/client boundary via **server functions** (`"use server"` — a primitive SolidStart pioneered in early 2022, ahead of React Server Components landing in Next.js) and a small set of router-integrated data primitives (`query`/`action`/`createAsync`/`useSubmission`). That extension-of-fine-grained-reactivity-to-the-server story, and the build-tooling churn underneath it (Vinxi → "DeVinxi," tracked in `next_release`), are the two threads that run through this review.

## State Management

### Philosophy & Mental Model

- **Server state is the primary state model** — SolidStart pushes the developer toward treating the server as the source of truth and the client as a thin, optimistically-updated reflection of it, via three router-level primitives layered on Solid's signal system:
  - **`query`** (formerly `cache`, now the documented-canonical name as of Solid Router 0.15+) wraps a server-callable async function with request-deduplication and cache-key identity.
  - **`action`** wraps a server-callable mutation, integrates with native `<form>` submission, and exposes pending/optimistic state via `useSubmission`/`useSubmissions`.
  - **`createAsync`/`createAsyncStore`** consume a `query` result as a Solid resource that participates in `<Suspense>` — the bridge between "a promise that resolves on the server" and "a signal the rendering system tracks."
- **Client/local state is plain Solid** — `createSignal`, `createStore`, `createMemo` work exactly as documented in `research/solid.md`; SolidStart adds nothing new at the local-state layer.
- **The server boundary is a *directive*, not a file-naming convention** — this is SolidStart's most consequential design choice relative to its meta-framework peers. Where SvelteKit uses `+page.server.js` (filename-level, statically obvious from the file system) and Next.js uses `"use client"`/Server Components (file- or directory-scoped), SolidStart's `"use server"` is a **string-literal directive inside a function body** that the compiler extracts into a separate server-only chunk. The function can live in the same file, alongside client code, indistinguishable at a glance from any other async function until you read its first line.

### Core Primitives

```ts
import { query, action } from "@solidjs/router";
import { createAsync, useSubmission } from "@solidjs/router";

// query — server-callable, deduplicated, cacheable read
export const getTodos = query(async () => {
  "use server";
  return await db.getTodos();
}, "todos");

// action — server-callable mutation with built-in pending/optimistic state
export const addTodo = action(async (formData: FormData) => {
  "use server";
  await db.addTodo(formData.get("title") as string);
});
```

- **`query(fn, key)`** — the documented-current name for what was `cache` (deprecated in Solid Router 0.15.0; the ecosystem is mid-migration, see Convention-strength evidence).
- **`action(fn)`** — wraps a mutation; supports `.with(...)` for partial application (binding an id before the form submits) and integrates with native `<form action={addTodo} method="post">`.
- **`createAsync(fn)` / `createAsyncStore(fn)`** — wrap a `query` call as a Suspense-integrated resource; `createAsyncStore` additionally gives store-shaped (fine-grained nested) reactivity over the result.
- **`useSubmission(action, filterFn?)` / `useSubmissions(action, filterFn?)`** — expose the in-flight state of action calls (pending, input, result) for building optimistic UI — a genuinely distinctive primitive; see the official TodoMVC fixture's `addingTodo`/`removingTodo`/`togglingAll` usage below.
- Underneath all of this: Solid's own `createSignal`/`createStore`/`createMemo`/`createResource` — fully available, fully documented, and (per the convention-strength evidence below) sometimes recommended as alternatives to the router-level primitives for the same job.

### Update Mechanism

Mutations flow through `action` + native form submission; the router automatically revalidates affected `query` entries by cache key after a successful action — no manual `refresh()` call (a contrast with Nuxt's explicit `refreshNuxtData()`):

```tsx
<form action={addTodo} method="post">
  <input name="title" class="new-todo" />
</form>
```

```ts
export const addTodo = action(async (formData: FormData) => {
  "use server";
  const title = formData.get("title") as string;
  await storage.setItem("todos:data", [...todos, { id: nextId, title, completed: false }]);
  // No explicit "refetch getTodos" call — the router revalidates by query key automatically
});
```

This is a genuine ergonomic win (less boilerplate than Nuxt's explicit-refresh model) — but it's also an **implicit hop**: the connection between "this action ran" and "this query re-fetches" exists because both reference the same string key (`"todos"`), not because of any visible call in either function. See Explicitness evidence for the full trace.

### Read Pattern

```tsx
export const route = {
  preload() { getTodos(); },
} satisfies RouteDefinition;

export default function TodoApp(props: RouteSectionProps) {
  const todos = createAsyncStore(() => getTodos(), { initialValue: [], deferStream: true });
  return <For each={todos()}>{todo => <li>{todo.title}</li>}</For>;
}
```

`route.preload()` runs the query ahead of navigation (hover-triggered preloading is a documented pattern); `createAsyncStore` then subscribes the component to the resolved/streaming value with full Suspense integration. Reading is a function call (`todos()`), exactly like any other Solid signal — the "is this reactive?" question has one consistent answer across local and server state.

### Async Handling

SolidStart explicitly **does not** support `async`/`await` directly inside components (no async components, unlike Vue's `<script setup>` top-level await or Svelte 5's planned async boundaries) — the documented rationale is that `await` syntax causes request waterfalls, whereas `createAsync` composes with `<Suspense>` to stream independently:

```tsx
function Page() {
  const user = createAsync(() => getUser());
  const posts = createAsync(() => getPosts()); // runs concurrently, not after `user` resolves
  return (
    <Suspense fallback={<Spinner />}>
      <h1>{user()?.name}</h1>
      <For each={posts()}>{post => <Post post={post} />}</For>
    </Suspense>
  );
}
```

This is a real, well-reasoned design constraint — but it's also a constraint an agent must *know about* rather than discover by trying the obvious thing (`await getUser()` in a component body fails in a way that isn't immediately self-explanatory; see Compiler-feedback evidence).

### Derived State

Standard Solid `createMemo`, unchanged — the official TodoMVC fixture computes the remaining-count footer this way, combining server data with in-flight optimistic submissions in a single derived expression:

```ts
const remainingCount = createMemo(
  () =>
    todos().length +
    addingTodo.length -
    todos().filter(todo => todo.completed).length -
    removingTodo.length,
);
```

Note this memo reaches across three different state sources (server-loaded `todos`, in-flight `addingTodo` submissions, in-flight `removingTodo` submissions) to compute one display value — a compact illustration of how much SolidStart's optimistic-UI model asks a single derived expression to know about.

### Developer Experience
- **Boilerplate:** Low-to-medium — `query`+`action`+`createAsync` collapse a lot of manual loading/error/optimistic-state wiring into named primitives (see Token-efficiency evidence for a concrete count against the official fixture).
- **DevTools:** Solid DevTools browser extension (signal/component inspection); no SolidStart-specific devtools panel (contrast Nuxt DevTools' route/payload/composable introspection).
- **Debugging:** Server vs. client execution requires tracing which functions carry `"use server"` — not visible in any file listing, only inside function bodies (a real locality cost, see below).
- **Time travel:** Not built in; no ecosystem-standard middleware for it in the SolidStart context.

## Rendering

### Philosophy & Approach
SolidStart inherits Solid's **fine-grained, no-virtual-DOM, compiler-driven** rendering wholesale (see `research/solid.md` for the full mechanism) and adds **streaming SSR with Suspense** as the default rendering mode, plus per-route control over SSR/SPA/static rendering. There is no separate "SolidStart rendering model" distinct from Solid's — the meta-framework layer is entirely about routing, data, and the server boundary.

### Update Strategy
Identical to Solid: signal writes trigger direct DOM updates through compiled fine-grained subscriptions; components run once and never re-render. SolidStart's only addition is that **resources** (`createAsync`/`createAsyncStore`) participate in `<Suspense>` to coordinate streaming — the resource resolving is itself a signal-shaped event that triggers the same fine-grained update path.

### Reconciliation
No diffing — same as Solid. SSR streaming uses out-of-order chunk delivery coordinated by `<Suspense>` boundaries; the client "resumes" (hydrates) by re-attaching the compiled subscriptions to server-rendered DOM nodes rather than re-rendering from scratch.

### Templating & Syntax
JSX, compiled by Solid's compiler — identical syntax to plain Solid (see `research/solid.md` for the full templating story). SolidStart adds router-aware JSX components (`<A>`, `<FileRoutes>`) and form-binding props (`action={addTodo}` directly on a native `<form>`).

```tsx
export default function TodoApp(props: RouteSectionProps) {
  const todos = createAsyncStore(() => getTodos());
  return (
    <section class="todoapp">
      <For each={todos()}>
        {todo => <li classList={{ completed: todo.completed }}>{todo.title}</li>}
      </For>
    </section>
  );
}
```

### Component Model
Function components, identical to Solid — props are plain objects, no special SolidStart component shape exists. Route components additionally receive `RouteSectionProps` (location, params, children) and may export a `route: RouteDefinition` object (`preload`, `matchFilters`) that the router consumes before rendering.

### Performance Optimizations
- **Streaming SSR + `<Suspense>`** — out-of-order streaming means slow data doesn't block fast data from reaching the client; `deferStream: true` (used in the official fixture) explicitly defers a resource's contribution to the initial HTML stream.
- **Route preloading** — `route.preload()` plus router-level hover-preload reduce perceived navigation latency.
- **No memoization story beyond Solid's own** — `createMemo` is the only tool; there's no SolidStart-level `memo()`/compiler-driven auto-memoization to layer on top (consistent with Solid's "fine-grained reactivity makes memoization mostly unnecessary" position).

### Developer Experience
- **Learning curve:** Medium-to-hard. A developer needs (a) Solid's signal model, (b) the router's data-API trio (`query`/`action`/`createAsync`), (c) the directive-based server-boundary model, and (d) the build-tooling layer (Vite + Nitro + Vinxi/"DeVinxi") well enough to debug its error messages — a taller stack than SvelteKit's "if you know Svelte, you mostly know SvelteKit."
- **DevTools:** Solid DevTools extension; no SolidStart-specific panel.
- **Hot reload:** Vite-powered HMR, generally fast; some documented friction around layout-shift-during-dev bugs tied to Vinxi version pinning (`solidjs/solid-start#1429`).

## Event Handling

### Philosophy & Approach
Native DOM events, identical to plain Solid — no synthetic event layer (see `research/solid.md`). SolidStart's only addition is **native `<form>` submission as the primary mutation-event channel**: `action`-bound forms work via standard HTTP POST (progressive-enhancement-compatible, in the spirit of SvelteKit's form actions and Remix's actions) rather than requiring a JS `onSubmit` handler that calls `fetch`.

### Event Binding
Inline JSX props (`onClick`, `onInput`, `onDblClick`), exactly as in plain Solid, plus `formAction`/`action` props that bind a form submission to a server `action`:

```tsx
<button formAction={toggleTodo.with(todo.id)} class="toggle" disabled={pending()}>
  {completed() ? <CompleteIcon /> : <IncompleteIcon />}
</button>
```

`.with(todo.id)` partially applies the action with an id captured from the render closure — a clean, explicit way to parameterize a server mutation from a list item without manually serializing the id into hidden form fields.

### Event Flow
Standard native bubbling/capturing — `e.preventDefault()`/`e.stopPropagation()` work exactly per the DOM spec, identical to plain Solid. Form submissions additionally flow through the router's action-dispatch layer, which is where `useSubmission` state originates.

### Event Object
Real, unwrapped DOM events (`Event`, `SubmitEvent`, `FocusEvent`) — no synthetic wrapper, identical to Solid's "skip the synthetic layer" choice:

```tsx
<form
  action={addTodo}
  method="post"
  onSubmit={e => {
    if (!inputRef.value.trim()) e.preventDefault();
    setTimeout(() => (inputRef.value = ""));
  }}
>
```

### Common Patterns
- **Optimistic UI from in-flight submissions**: `useSubmissions(addTodo)` returns the list of currently-pending `addTodo` calls, rendered as provisional list items before the server confirms — a genuinely distinctive, well-designed pattern visible throughout the official TodoMVC fixture (`addingTodo`/`removingTodo`/`togglingAll`).
- **Custom directives**: `use:setFocus` (a Solid directive, declared via `declare module "solid-js" { namespace JSX { interface Directives {...} } }`) — powerful, but adds a TypeScript-module-augmentation step an agent must recognize as intentional rather than a stray type error.
- **Preventing default on forms that should sometimes submit natively**: the official fixture's `onSubmit` handler conditionally calls `e.preventDefault()` based on input validation — a pattern that requires understanding *both* the native form-submission path *and* the JS-enhancement layer simultaneously.

### Performance Considerations
No framework-level event delegation to configure — Solid attaches listeners directly via its compiled output. Handler identity matters far less than in React/Preact (no `memo()`-wrapped-child re-render question, because components don't re-render) — a genuine simplification an agent doesn't need to reason about.

### Developer Experience
- **Debugging:** Real DOM events mean browser DevTools' event-listener inspection works directly; `useSubmission`'s pending/result state is plain reactive data, inspectable like any signal.
- **Type safety:** `action`/`query` infer parameter and return types end-to-end from the wrapped function signature; `formAction={toggleTodo.with(todo.id)}` is type-checked against `toggleTodo`'s declared parameter shape.

## Rubric Evidence

### Evidence: Type-system integration
**Categorical fact: native.** SolidStart is written in TypeScript and its router/data primitives (`query`, `action`, `createAsync`) carry full generic type inference end-to-end — the wrapped function's parameter and return types flow through to `useSubmission`'s `.input`/`.result` and to the consuming component's `todos()` call site, with no manual type annotation required in the official fixture's `index.tsx`.

Sample type behavior — passing a wrong-shaped argument to a typed action's partial-application helper:

```ts
export const toggleTodo = action(async (id: number) => { "use server"; /* ... */ });

// usage:
<button formAction={toggleTodo.with("abc")}>  {/* string where number expected */}
```

TypeScript's actual error:
```
Argument of type 'string' is not assignable to parameter of type 'number'.
```
This is a direct, accurate, line-pointing error — the inference chain from the server function's declared parameter type through `.with()`'s generic signature to the JSX prop is intact and reports precisely. This end-to-end inference (no manually-maintained `$types` generation step, unlike SvelteKit, and no Nitro-route-typing layer to configure, unlike Nuxt) is a genuine strength: the type information the compiler needs already lives at the single declaration site.

The rough edge: **`"use server"` is a string literal, not a typed construct** — misplacing it (e.g., as the second statement instead of the first line of a function body) produces no TypeScript error at all; the function simply fails to be extracted to the server chunk, surfacing later as a runtime or bundler-level failure (see Compiler-feedback evidence). The type system has no opinion about directive placement, which is a real, checkable gap between "what TypeScript catches" and "what actually breaks an app."

### Evidence: Compiler/build feedback quality
SolidStart's "compiler" is actually a stack — Solid's JSX compiler, the `"use server"` function-extraction transform, Vite, and (in 1.x) Vinxi orchestrating Nitro. Build-feedback quality varies sharply by which layer surfaces the error.

Deliberately-broken example — importing a Node-only module (`fs`) at the top level of a file that also exports a `"use server"` function, a documented real-world mistake (`solidjs/solid-start#1526`, "Client bundle including imports from 'use server' functions"):

```ts
import { readFileSync } from "node:fs"; // top-level import, not inside the server function

export const getConfig = query(async () => {
  "use server";
  return JSON.parse(readFileSync("./config.json", "utf-8"));
}, "config");
```

The actual reported error (paraphrased from the linked issue's transcript, which is the closest thing to a canonical transcript this bug class produces):
```
"env" is not exported by "__vite-browser-external", imported by "node:fs"
```
This error is **real but actively misleading** — it names a Vite internal (`__vite-browser-external`) and a Node built-in (`env`) that the developer never wrote or referenced directly. The actual cause — a top-level import that the bundler couldn't tree-shake out of the client chunk because the `"use server"` boundary is function-body-scoped, not file-scoped — requires understanding the *bundler's* model of the code, not the developer's. This is the single clearest illustration in this review of "error points at the symptom (a missing browser-external shim export) rather than the root cause (an import placement relative to an invisible-at-a-glance directive boundary)" — exactly the compiler-feedback failure mode the rubric asks to be made concrete. **Friction note**: locating a citable, real transcript for this required searching GitHub issues rather than the official docs — the docs describe the `"use server"` happy path well but don't catalog this (well-known, multiply-reported) failure mode or its error text.

By contrast, ordinary TypeScript/JSX errors (wrong prop types, missing imports) surface through the standard Vite+TS pipeline with the same quality as plain Solid — actionable, line-pointing, no indirection. The weakness is concentrated specifically at the server/client boundary, which is also SolidStart's most distinctive and most load-bearing feature.

### Evidence: Locality of behavior
Traced: "toggle a todo's completed state and see the remaining-count footer update," using the **official `apps/fixtures/todomvc` reference** in the `solidjs/solid-start` monorepo (`https://github.com/solidjs/solid-start/tree/main/apps/fixtures/todomvc` — the project's own canonical TodoMVC, used as an internal test fixture and documentation reference) as the representative feature.

Touchpoints required to understand/change this one feature:
1. `src/routes/index.tsx` — `TodoApp` wires the `toggleTodo` action to `formAction={toggleTodo.with(todo.id)}`, derives `completed()` (which must additionally check `togglingAll.pending`/`togglingTodo.pending` for optimistic display), and recomputes `remainingCount` across three state sources.
2. `src/lib/api.ts` — `toggleTodo = action(async (id) => { "use server"; ... })` performs the actual mutation against storage; `getTodos = query(...)` is the read side that the router silently revalidates after the action (connected only by the shared string key `"todos"`).
3. `src/lib/db.ts` — the `storage` instance the action mutates.
4. `src/types.ts` — the `Todo` type shape both the route and the API layer depend on.
5. **The route-key string `"todos"`** — appearing in `query(fn, "todos")` and nowhere else explicitly — is the *implicit* connective tissue between "this action ran" and "this query re-fetches." It's not a file or a "concept" in the traditional sense, but it's a real fifth thing an agent must locate and understand to predict whether changing one query's key breaks another action's revalidation.

**Count: 4 files + 1 cross-cutting string-key convention** — comparable in raw file-count to SvelteKit's load-function model (SvelteKit scored similarly in its own review), but with one additional non-file-shaped touchpoint (the cache-key string) that has no SvelteKit/Nuxt analogue, because those frameworks revalidate either automatically-by-dependency-tracking (SvelteKit) or via an explicit function call (Nuxt's `refresh()`) rather than by string-key matching.

### Evidence: Explicitness / data-flow traceability
Traced: clicking a todo's checkbox, end to end, from the official fixture.

1. `onClick` (native button click inside a `<form method="post">`) → browser submits the form via `formAction={toggleTodo.with(todo.id)}` (explicit prop, explicit native HTTP semantics — no synthetic event indirection).
2. The router intercepts the submission, calls `toggleTodo(todo.id)` server-side (explicit — `action` is a named, importable function you can step into).
3. `toggleTodo`'s `"use server"` body mutates `storage` directly (explicit — plain async/await code, no ORM-magic or hidden query-builder layer in this fixture).
4. **The router revalidates `getTodos` because both reference the string key `"todos"`** (the **one genuinely implicit hop** in this trace — there is no visible call from `toggleTodo` to `getTodos`; the connection exists purely because the router's internal cache matches on the key string. An agent reading `api.ts` top to bottom would not see this relationship; it has to be known as a router-level convention).
5. `createAsyncStore`'s subscription to the revalidated `getTodos()` result updates the `todos` signal (implicit, but *named and documented* — this is the resource system doing exactly what its name promises).
6. Solid's compiled fine-grained subscriptions update the specific `<li>` and the `remainingCount` memo's dependent DOM nodes directly — no component re-render, no diffing (implicit, but this is Solid's headline mechanism, well-documented and the same "magic" a Solid developer already internalized in the base library).

**Net assessment: 6 hops, 4 explicit / 2 implicit**, but the two implicit hops are qualitatively different — hop 5–6 (resource subscription → fine-grained DOM update) is *Solid's own*, well-named, single-purpose magic that a developer learns once and reuses everywhere. Hop 4 (string-key cache revalidation) is **SolidStart-specific, unnamed in the code, and the one place this trace required cross-referencing two files to even notice the connection exists** — a genuinely different (and more costly) kind of implicitness than "the framework does something it told you it would do."

### Evidence: Convention strength
Canonical task probed: **"load and cache server data in a route component."** This surfaced the single largest convention-strength problem found in this review: **at least four overlapping, partially-deprecated APIs claim the same job**, and the official docs themselves acknowledge the churn mid-explanation.

1. **`createResource`** — Solid's own base-library async primitive (`research/solid.md` documents this as canonical *for Solid*); still works in SolidStart, still shown in some community tutorials, but lacks router-level cache-key revalidation.
2. **`cache` + `createAsync`** — the pattern that shipped with SolidStart 1.0 and is still what much existing code (including some still-current community guides, e.g. `vladislav-lipatov.medium.com`'s "SolidStart guide for newbies") demonstrates.
3. **`query` + `createAsync`** — the *currently documented canonical* pattern (Solid Router's own reference page, `https://docs.solidjs.com/solid-router/reference/data-apis/cache`, states plainly: **"`cache` — Deprecated since v0.15.0. Use `query` instead"**) — note that the deprecation notice lives on the page still *titled* `cache`, which is itself a small but real signal of mid-migration documentation.
4. **`createAsyncStore`** vs. plain **`createAsync`** — the official TodoMVC fixture uses `createAsyncStore` (store-shaped, fine-grained nested reactivity over the result) where many tutorials show `createAsync` (resource-shaped) — a distinction the official guide explains, but that an agent has to actively notice rather than default into correctly.

**Friction note**: I spent meaningfully more effort here than on any other dimension — triangulating across the Solid Router reference docs (which contain the deprecation notice for `cache` on the page still named for `cache`), a community "for newbies" guide that teaches the now-deprecated pattern as canonical, an AnswerOverflow community Q&A thread explicitly asking "what's the difference between `createResource` and `createAsync`," and the official fixture's own choice of `createAsyncStore`. A developer (or agent) following the most-discoverable tutorial today has a real chance of learning a pattern the framework's own reference docs label deprecated on the very same page.

### Evidence: Token efficiency / boilerplate density
**Source: the official TodoMVC fixture**, `apps/fixtures/todomvc` in the `solidjs/solid-start` monorepo (`https://github.com/solidjs/solid-start/tree/main/apps/fixtures/todomvc`) — the project's own canonical reference implementation, used internally as a test fixture and built to the standard TodoMVC feature set (add/toggle/edit/remove/filter/clear-completed/toggle-all), making it a direct apples-to-apples citation.

Line counts (`wc -l`, excluding generated/config files and CSS):

| File | Lines | Role |
|---|---|---|
| `src/routes/index.tsx` | 206 | Full TodoApp UI: list, form, filters, footer, optimistic states |
| `src/lib/api.ts` | 84 | All seven server functions (`query`+six `action`s) |
| `src/entry-server.tsx` | 21 | SSR entry |
| `src/components/icons.tsx` | 16 | Two small icon components |
| `src/app.tsx` | 12 | Root router/layout wiring |
| `src/lib/db.ts` | 10 | Storage instance |
| `src/types.ts` | 5 | `Todo` type |
| `src/entry-client.tsx` | 4 | Client hydration entry |
| **Total** | **358** | |

This is **directly comparable in magnitude** to Preact's official TodoMVC port (335 lines, per `research/preact.md`'s citation of `developit/preact-todomvc`) and SvelteKit's "~10 lines for a full page" boilerplate-snippet citation (a different granularity of comparison, but directionally consistent — meta-framework TodoMVCs across this corpus cluster in the low-to-mid hundreds of lines for the full feature set). What's structurally different here: **84 of those 358 lines are the entire data layer** (all reads and writes, fully typed, with no separate model class, no manually-wired persistence-subscriber pattern, and no `inform()`-style force-update idiom — contrast Preact's classic-idiom `model.js` + `util.js` totaling 76 lines for a *smaller* feature set). The `query`/`action` primitives genuinely compress the data-layer token cost relative to hand-rolled fetch+state-triple patterns — the cost shows up instead in `index.tsx`'s 206 lines, a large fraction of which is the optimistic-UI bookkeeping (`useSubmission`/`useSubmissions` filtering and merging three state sources into `completed()`/`pending()`/`remainingCount`) that frameworks without a built-in optimistic-UI primitive simply don't have to write — or don't get for free.

### Evidence: Familiarity composite
Four proxies:
- **`first_released`: 2022`** (beta announced November 2022 per Ryan Carniato's "Introducing SolidStart" post; 1.0 shipped May 2024 per the official "SolidStart 1.0: The Shape of Frameworks to Come" blog post, `https://www.solidjs.com/blog/solid-start-the-shape-frameworks-to-come`) — meaningfully younger than SvelteKit (2020 beta) and dramatically younger than Next.js/Nuxt, with correspondingly thinner training-data exposure.
- **GitHub activity**: `solidjs/solid-start` — 5,871 stars, 420 forks, 157 open issues, pushed 2026-05-22 (`https://github.com/solidjs/solid-start`) — active and currently maintained, but an order of magnitude smaller than Next.js (130k+ stars) or even SvelteKit's community footprint.
- **Registry trend**: `@solidjs/start` on npm — 30-day download series ranges from ~2,766/day (2025-06-03) to ~10,325/day (2026-06-02), a roughly **3-4x year-over-year increase** (`https://api.npmjs.org/downloads/range/last-year/@solidjs/start`) — clearly trending up, consistent with Solid's broader "growing influence" narrative (`listiak.dev`'s "The state of Solid.js in 2026"), but starting from a small base.
- **SO/community volume**: Stack Overflow's `solid-start` tag carries **20 questions**; the broader `solid-js` tag carries **330** (`api.stackexchange.com/2.3/tags?inname=solid`) — both genuinely small in absolute terms (compare React-adjacent tags in the tens-of-thousands). This is a **structural undercount risk worth naming explicitly**: SolidStart's own Discord/community activity is documented as substantial (the "This Month in Solid" community digest series, `dev.to/danieljcafonso`), but that activity is concentrated on Discord rather than Stack Overflow — a venue an agent's pretraining is less likely to have ingested as deeply, which if anything makes the *already-low* SO numbers an optimistic upper bound on training-data exposure, not a pessimistic one.

Triangulation: young (2022), small-but-active community, growing registry trend from a small base, and genuinely thin Q&A-corpus exposure that's likely *worse* than the raw numbers suggest because of the Discord-concentration effect. This is meaningfully lower than SvelteKit (2020, larger ecosystem) and far lower than Next.js/Nuxt — an honest "this is a framework an agent has seen comparatively little of" signal.

### Evidence: Stability / convention durability
Cited directly from `next_release` (frontmatter, reproduced here per CLAUDE.md's single-source-of-truth instruction): **SolidStart 2.0 ("DeVinxi"), currently `2.0.0-alpha.2`** (released 2026-02-20; `https://github.com/solidjs/solid-start/releases`), is in active alpha development in parallel with the still-shipping 1.x line (1.3.2, 2026-02-24). Categorized:

- **Build-layer rewrite, not feature-surface rewrite**: per the team's own roadmap discussion (`solidjs/solid-start` Discussion #1960, "SolidStart: Public Roadmap - DeVinxi and Beyond," and Discussion #2119, "Roadmap Update: Start v2 and Ecosystem"), the goal is replacing **Vinxi** — the Vite+Nitro-orchestration layer this very review's Compiler-feedback evidence traces a confusing error message back to — with a "pure Vite-based system." The team states "Vite/Nitro saw value in what Vinxi brought to the table and together they superseded its necessity in ~75%," framing the remaining work as closing that gap natively rather than redesigning routing/data/actions.
- **Versioning signal worth flagging**: "the current version of SolidStart has been moved to the 1.x branch, and DeVinxi work will soon be merged into main… by the time the APIs are stable, SolidStart will ship 2.0.0-rc.0, effectively deprecating Start v1" — i.e., the project itself frames this as a load-bearing transition, not an incremental point release.
- **Compounding factor**: this lands on top of the **already-mid-migration `cache`→`query` deprecation** documented in Convention-strength evidence — meaning a developer adopting SolidStart today is simultaneously navigating (a) a recently-deprecated data-API rename and (b) a build-layer rewrite explicitly described by its own maintainers as deprecating the entire current major version.

`next_release.stability_penalty: true` — set deliberately, on the strength of the maintainers' own "effectively deprecating Start v1" framing plus the live `cache`→`query` migration already in progress. This is a meaningfully different situation from Preact 11 (reviewed elsewhere in this corpus with `stability_penalty: false` on the strength of a fully-mechanical migration path and a six-year "story of stability" track record) — SolidStart's own roadmap discussion explicitly uses deprecation language about its current shipping major version.

### Evidence: Ecosystem tooling facts
- **DevTools**: partial — the **Solid DevTools** browser extension (signal graph, component tree, props inspection) works in SolidStart apps because the underlying rendering is plain Solid, but there is **no SolidStart-specific devtools panel** (contrast Nuxt DevTools' route/payload/composable-source introspection, a genuine differentiator documented in `research/nuxt.md`). Server-function/action state is inspectable only as plain reactive signals (`useSubmission` results), not through any dedicated panel.
- **Test utilities**: yes — **Vitest** is the documented-recommended runner, paired with **`@solidjs/testing-library`** (`https://www.npmjs.com/package/@solidjs/testing-library`, ported from the widely-known Testing Library philosophy/API — meaning an agent's `@testing-library/react` knowledge transfers in spirit if not in import path) plus `@testing-library/user-event` and `@testing-library/jest-dom`. Browser-mode component testing via Vitest+Playwright is documented as the advanced path (`https://vitest.dev/guide/browser/component-testing`).
- **IDE/LSP support**: solid — native TypeScript types throughout (`query`/`action`/`createAsync` carry full generic inference, per Type-system evidence), and Solid's JSX is standard enough that VS Code's built-in TS/JSX tooling works without a SolidStart-specific plugin. No dedicated SolidStart language server or `.d.ts`-generation step exists (contrast SvelteKit's auto-generated `./$types` or Nuxt's `.nuxt/types` — SolidStart's end-to-end inference works *because* it needs no separate generation step, which is itself the more elegant design, but it also means there's no generated-artifact a confused agent can inspect to "see" the inferred shape).
- **Build tooling**: Vite-powered dev server with HMR; **Vinxi** (1.x) orchestrates Vite+Nitro+router config — the layer being replaced by "DeVinxi" in 2.0 (see Stability evidence). Deployment targets inherit from Nitro's preset system (similar breadth to Nuxt's, since both build on Nitro).

## On the Horizon

### Next release
- **Name/version:** SolidStart 2.0 (currently `2.0.0-alpha.2`, "DeVinxi")
- **Status:** alpha
- **What's changing:** Replaces the Vinxi build-orchestration layer with a direct, pure-Vite-based architecture; the team frames Vite+Nitro as having already superseded ~75% of what Vinxi provided, with 2.0 closing the remaining gap natively. Routing/data/action APIs are not described as changing in kind — this is a build-layer rewrite under a stable feature surface. Full roadmap: `https://github.com/solidjs/solid-start/discussions/1960` and `https://github.com/solidjs/solid-start/discussions/2119`.
- **Anticipated impact:** Could materially improve Compiler-feedback-quality (by removing the Vinxi indirection this review traces a confusing real-world error message to) and Stability (by collapsing a three-layer build stack into two) — but only once 2.0 actually ships and stabilizes. Until then, it's a live signal that the build-tooling foundation under today's `1.3.2` is acknowledged by its own maintainers as being replaced.
- **Stability penalty:** Yes — see Stability evidence above. The maintainers' own framing ("effectively deprecating Start v1") plus the concurrently-live `cache`→`query` data-API migration (Convention-strength evidence) together describe a framework whose conventions are visibly in motion on two independent axes at once, which is precisely the condition this dimension exists to flag.

### AI-tooling investment
- **What exists:** An official **`llms.txt`** is published at `https://docs.solidjs.com/llms.txt`, serving the unified Solid documentation site (which hosts SolidStart, Solid Router, and Solid Meta docs together) as structured markdown — verified live and including SolidStart-specific reference pages (`/solid-start/...`, `/solid-router/reference/data-apis/cache`, etc.). No dedicated SolidStart MCP server was found (searched GitHub and the MCP server registries directly — `modelcontextprotocol/servers`, `mcpservers.org` — turned up nothing SolidStart-specific; the closest false-positive hits were an unrelated "SolidTime" time-tracking MCP server). No Boost-style curated guidelines package and no AI-specific style guide were found.
- **Observed delta:** see `ai_tooling.observed_delta` in frontmatter for the full before/after — summary: this was the **largest observed delta in this corpus to date**. Without the llms.txt loaded, the model produced a working but architecturally-wrong answer (a Solid SPA pattern bolted onto a SolidStart project, skipping `query`/`action`/`createAsync` entirely — i.e., it didn't use the meta-framework's actual value proposition). With the llms.txt loaded, the model produced the idiomatic `action`+`query`+`createAsync`+`useSubmission` shape, including correct `"use server"` placement, on the first pass. This is a qualitatively different kind of delta than Preact's (which closed an "imports and naming" gap) — it's evidence that for a young, thin-training-data meta-framework, official context-loading doesn't just polish output, it determines *which framework's mental model* the agent reaches for by default.

---

## Anti-Patterns from Human-Era Thinking

- **A directive-as-boundary-marker is more elegant for humans reading top-to-bottom than for agents scanning structurally.** `"use server"` as a string literal inside a function body reads naturally to a human following the code's narrative — but it's invisible to any tool, search, or agent that reasons about files/exports/structure before reading function bodies line-by-line (contrast SvelteKit's `+page.server.js`, whose boundary is visible in a directory listing alone). The Compiler-feedback evidence's traced bug (`#1526`) is a direct, citable consequence: the boundary being function-body-scoped rather than file-scoped is *exactly* why a top-level import can leak into the client bundle in a way that produces a bundler-internals error rather than a clear "this import can't cross the server boundary" message.
- **String-key cache coordination is "convention," but it's the kind of convention that disappears under refactoring.** The `query(fn, "todos")` ↔ revalidation-by-key relationship documented in Locality/Explicitness evidence works *only* as long as the string literal stays in sync across files with no compiler enforcement connecting them. Renaming one without the other produces a silently-stale cache, not an error — the exact "moving a file silently changes behavior in a way invisible from reading the file" anti-pattern this corpus has flagged before (cf. Nuxt's directory-location-determines-component-name finding).
- **Mid-migration documentation (the `cache`→`query` rename) actively teaches the deprecated pattern as canonical in still-prominent places.** The Convention-strength evidence's finding — that the reference page documenting the deprecation is itself still titled for the deprecated name, and that a "for newbies" guide teaches the old pattern — is a textbook illustration of how fast-moving conventions leave landmines in exactly the on-ramp material a newcomer (or an agent without fresh context) is most likely to encounter first.

## Transferable Patterns for Next-Gen Framework

- **`useSubmission`/`useSubmissions` is a genuinely well-designed optimistic-UI primitive worth generalizing.** Exposing "the set of currently-in-flight mutations, queryable and filterable" as a first-class reactive value — rather than requiring the developer to hand-roll `pending`/`optimisticData` state per mutation — is a clean answer to a problem every data-driven UI eventually faces. A next-gen framework should consider making "in-flight mutation state" a framework-level reactive primitive from day one, the way SolidStart has, rather than leaving it to userland state-management conventions.
- **Server/client boundary markers should be structurally visible, not lexically buried — SvelteKit's filename convention is the more agent-friendly direction, and this review's evidence makes the contrast concrete and citable.** SolidStart's `"use server"` and SvelteKit's `+page.server.js` solve the *same* problem (which code never reaches the client); this review traces a real, citable bug (`#1526`) that exists specifically *because* SolidStart's marker lives inside a function body rather than in a filename. A next-gen framework should put boundary information at the most structurally-discoverable layer available — file system > module exports > function-body directives — because that ordering is also, not coincidentally, the order of "how cheaply can a tool/agent discover this without parsing deeply."
- **Cache coordination should be typed and traceable, not string-key-matched.** The `query(fn, "todos")` pattern works, but it reintroduces exactly the "stringly-typed coordination" failure mode that typed languages exist to eliminate elsewhere in the same codebase. A next-gen framework's data layer should make the relationship between a write and the reads it invalidates a *traceable, typed reference* (the query function itself, or a derived handle) rather than a string both sides must independently remember — turning an implicit hop (per this review's Explicitness evidence) into an explicit, "find references"-navigable one.

---

Sources:
- [SolidStart Documentation](https://docs.solidjs.com/solid-start)
- [SolidStart — "Fine-Grained Reactivity goes fullstack"](https://start.solidjs.com/)
- [Official SolidStart TodoMVC fixture](https://github.com/solidjs/solid-start/tree/main/apps/fixtures/todomvc)
- [SolidStart "use server" reference](https://docs.solidjs.com/solid-start/reference/server/use-server)
- [Solid Router data-APIs reference (cache/query deprecation notice)](https://docs.solidjs.com/solid-router/reference/data-apis/cache)
- [SolidStart 1.0 announcement — "The Shape of Frameworks to Come"](https://www.solidjs.com/blog/solid-start-the-shape-frameworks-to-come)
- [Introducing SolidStart (beta announcement, 2022)](https://ajcwebdev.com/2022/11/20/a-first-look-at-solidstart/)
- [SolidStart Roadmap Discussion — DeVinxi and Beyond (#1960)](https://github.com/solidjs/solid-start/discussions/1960)
- [SolidStart Roadmap Update — Start v2 and Ecosystem (#2119)](https://github.com/solidjs/solid-start/discussions/2119)
- [Issue: Client bundle including imports from "use server" functions (#1526)](https://github.com/solidjs/solid-start/issues/1526)
- [Issue: Layout shifts in dev with recent Vinxi (#1429)](https://github.com/solidjs/solid-start/issues/1429)
- [docs.solidjs.com llms.txt](https://docs.solidjs.com/llms.txt)
- [@solidjs/testing-library on npm](https://www.npmjs.com/package/@solidjs/testing-library)
- [The state of Solid.js in 2026 (community digest)](https://listiak.dev/blog/the-state-of-solid-js-in-2026-signals-performance-and-growing-influence)
- [solid-start-todomvc-kcd-v2 (community reference, ported from kentcdodds/remix-todomvc)](https://github.com/peerreynders/solid-start-todomvc-kcd-v2)
