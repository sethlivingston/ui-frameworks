---
name: "SolidJS"
category: "full-framework"
github_url: "https://github.com/solidjs/solid"
docs_url: "https://docs.solidjs.com"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8
compiler_feedback_score: 7
locality_score: 9
explicitness_score: 8.5
convention_strength_score: 7.5
token_efficiency_score: 8.5
familiarity_score: 6.5
stability_score: 5.5
tooling_score: 7
version: "1.9.13"
npm_package: "solid-js"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: true
  style_guides: null
  observed_delta: "SolidJS publishes a structured llms.txt at https://docs.solidjs.com/llms.txt plus several full-content variants (llms-solid-full.txt, llms-solid-api.txt, llms-solid-guides.txt). Ran the canonical TodoMVC exercise (add, toggle, filter, clear-completed, persist) without and with the llms-solid-full.txt context loaded. Without the context: the model produced working SolidJS code but applied the React mental model in two spots — used a ternary conditional branch directly in JSX where <Show> is canonical, and passed an inline arrow as the onClick handler for list items rather than the more efficient tuple form [handler, data] that Solid supports for event delegation. With llms-solid-full.txt loaded: the model produced <Show> on first attempt and used the tuple event form unprompted. The props-are-proxies hazard (destructuring breaks reactivity) was flagged by the model as a comment warning without being prompted. Net delta: two idiomatic corrections from ternary→<Show> and inline→tuple, plus one proactive hazard annotation. Real improvement, same category of impact as React's llms.txt delta — closing training-data gaps rather than teaching structural fundamentals."
next_release:
  name: "2.0.0"
  status: "beta"
  changes: "First-class async Promises in the reactive graph; <Loading> component replacing Suspense for initial readiness; isPending() for refresh states without teardown; action() primitive for optimistic→await→refresh workflows; createEffect split into compute/apply phases; onMount renamed to onSettled; <Index> replaced by <For keyed={false}>; store setters now draft-first by default; use: directives removed in favor of ref directive factories; deterministic microtask-based scheduler with flush()."
  anticipated_impact: "Significant breaking changes across async patterns, effect model, list rendering, and directive syntax. Migration tooling is promised but the scope is broad enough that existing 1.x codebases will require non-trivial port effort. The async model changes affect every createResource user."
  stability_penalty: true
components: null
supersedes: null
superseded_by: null
typescript_support: "native"
license: "MIT"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "reactive"
state_model: "signals"
rendering_strategy: "fine-grained"
maintainer: "Ryan Carniato / Community"
first_released: "2018"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full from-scratch rewrite under the 9-dimension flat rubric. Solid 2.0.0-beta.0 shipped March 2026 (npm next tag); the stable 1.9.13 is the reviewed version. The 2.0 beta is a substantial API rewrite (not a paradigm change — still signals + fine-grained reactivity + JSX) that earns a stability penalty but not a new file, because the core identity (signals, no vdom, compile-to-direct-DOM) is unchanged. The changelog in the GitHub repo only covers through 1.8.0; 1.9.x release notes are on the GitHub Releases page. No documentation friction on core APIs; minor friction locating the full 1.9 changelog required checking the Releases page directly rather than CHANGELOG.md."
---

# SolidJS

## State Management

### Philosophy & Mental Model

SolidJS state is **signal-based, fine-grained, and ownership-scoped**. The core insight: reactive *values* (signals) are distinct from reactive *computations* (effects, memos). A component function runs exactly once on mount; only the specific DOM expressions and effects that *read* a signal re-execute when that signal changes.

This is architecturally different from React's re-render model. There are no dependency arrays because the reactive graph tracks reads automatically. There is no virtual DOM diff because the compiler generates direct DOM update code targeting the exact nodes that depend on each signal.

State can be component-local (signals, stores declared inside the component function) or shared via Context — the same reactive primitives work in both cases.

### Core Primitives

- **`createSignal(initialValue)`** — reactive atom returning `[getter, setter]`. The getter is a *function*; calling `count()` inside a reactive scope subscribes to it. Not calling it (passing `count` as a value) does not subscribe.
- **`createEffect(fn)`** — runs `fn` once, tracks which signals `fn` reads, and re-runs `fn` whenever any of those signals change. No dependency array.
- **`createMemo(fn)`** — like `createEffect` but returns a signal with the memoized result. Only recomputes when its signal dependencies change.
- **`createStore(initialObject)`** — returns `[proxy, setter]` for nested reactive objects. Fine-grained at the property level: only expressions that read `state.user.name` re-execute when `state.user.name` changes. Setter uses path-based or draft-function API.
- **`createResource(source?, fetcher)`** — async reactive primitive. Returns a signal that is `undefined` while loading, then the fetched value. Suspense-compatible.
- **`createContext / useContext`** — standard dependency injection; the provided value is itself reactive if it's a signal or store.

### Update Mechanism

```typescript
const [count, setCount] = createSignal(0);
setCount(1);                    // direct value
setCount(c => c + 1);          // functional update
```

Signal updates are synchronously propagated to all subscribed computations in topological order. Multiple synchronous signal updates in the same event handler are automatically batched — effects run once after the batch.

Store path updates:
```typescript
const [state, setState] = createStore({ user: { name: 'Alice', age: 30 } });
setState('user', 'age', 31);                          // path-based
setState('user', u => ({ ...u, name: 'Bob' }));       // function at path
setState(produce(draft => { draft.user.age++; }));    // Immer-style (solid-js/store)
```

### Reactivity & Granularity

Component granularity is maximal: the component function runs once, never again. DOM-node granularity is the operative unit:

```tsx
function Counter() {
  const [count, setCount] = createSignal(0);
  // Component body executes once.
  return (
    <div>
      {/* The compiler generates an effect that updates only this text node */}
      <span>{count()}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

The compiler transforms the JSX into DOM construction code plus fine-grained effects for each reactive expression. "Re-renders" as a concept does not apply.

### Async Handling

```tsx
import { createResource, Show } from 'solid-js';

function UserProfile(props: { userId: number }) {
  const [user] = createResource(() => props.userId, fetchUser);
  return (
    <Show when={user()} fallback={<p>Loading…</p>}>
      {u => <p>{u.name}</p>}
    </Show>
  );
}
```

`createResource` automatically re-fetches when its source signal changes, exposes `user.loading` and `user.error` accessors, and integrates with `<Suspense>` for coordinated loading boundaries.

### Derived State

```typescript
const total = createMemo(() =>
  items().reduce((sum, item) => sum + item.price * item.qty, 0)
);
const tax = createMemo(() => total() * 0.1);
// tax only recomputes when total changes; total only when items changes.
```

No dependency arrays. The reactive graph is derived from the signal reads that actually execute inside the memo function body.

## Rendering

### Philosophy & Approach

SolidJS uses **JSX as input syntax** but compiles it to direct DOM operations, not `React.createElement` calls and no virtual DOM. The JSX tree is constructed once; reactive expressions within it become effects that update specific DOM nodes.

### Update Strategy

The compiler identifies which JSX expressions are reactive (call a signal or memo) and wraps each one in a targeted effect. Static parts of the JSX are never touched after initial construction. This means rendering cost is proportional to the number of signals that change, not to the size of the component tree.

### Templating & Syntax

Standard JSX with Solid-specific control-flow components:

```tsx
<Show when={isLoggedIn()} fallback={<Login />}>
  <Dashboard />
</Show>

<For each={todos()}>
  {(todo, i) => <li>{i() + 1}. {todo.title}</li>}
</For>

<Switch fallback={<NotFound />}>
  <Match when={route() === 'home'}><Home /></Match>
  <Match when={route() === 'about'}><About /></Match>
</Switch>
```

`<Show>` and `<For>` are preferred over ternary and `.map()` because they preserve DOM nodes instead of recreating them on every change. The control-flow components are explicit and named, which makes intent legible in code review and search.

### Component Model

Components are plain TypeScript functions called exactly once. Props are accessed as a reactive proxy — destructuring `const { value } = props` breaks reactivity because it reads the value at call time rather than subscribing to future changes. Use `props.value` directly, or `splitProps` for safe pattern-matched access.

```tsx
import { splitProps } from 'solid-js';

function Button(props: { label: string; onClick: () => void; class?: string }) {
  const [local, rest] = splitProps(props, ['label', 'onClick']);
  return <button class={local.class} onClick={local.onClick}>{local.label}</button>;
}
```

### Performance Optimizations

No manual optimization is required for most cases. The framework's architecture makes the default the optimal case: no virtual DOM diff, no component re-execution, no need for `memo`, `useMemo`, or `useCallback` equivalents. `createMemo` exists for expensive computed values that multiple effects consume; it is not needed for preventing re-renders.

## Event Handling

### Philosophy & Approach

Events are bound in JSX using camelCase attribute names (`onClick`, `onInput`, `onKeyDown`). Under the hood Solid uses **event delegation** for common DOM events — a single listener at the document root dispatches to component handlers — which means per-item handler objects are cheap in large lists.

### Event Binding

```tsx
// Standard binding
<button onClick={handleClick}>Submit</button>

// Tuple form — passes data without creating a closure per list item
<For each={todos()}>
  {(todo) => <button onClick={[handleToggle, todo.id]}>Toggle</button>}
</For>

// Capture phase
<div on:click={handleCapture}>...</div>
```

The tuple form `[handler, data]` is idiomatic for list rows and is one of the idioms that benefits from the llms.txt context (see `ai_tooling.observed_delta`).

### Event Flow

Standard DOM bubbling and capture. `e.stopPropagation()` and `e.preventDefault()` work identically to vanilla JS. No synthetic event wrapper — handlers receive native DOM event objects.

### Common Patterns

```tsx
// Form input binding
<input value={name()} onInput={e => setName(e.currentTarget.value)} />

// Component callback
function Child(props: { onSave: (data: string) => void }) {
  return <button onClick={() => props.onSave('data')}>Save</button>;
}
```

## Rubric Evidence

### Evidence: Type-system integration

**Category: native** — solid-js is written in TypeScript; JSX types are part of the package.

Solid 1.7.0 ("U Can't Type This", [release notes](https://github.com/solidjs/solid/releases/tag/v1.7.0)) made three improvements directly relevant to AI-assisted development:

1. **Null-asserted control flow** — `<Show when={maybeUser()}>` now gives the callback an `Accessor<User>` (not `Accessor<User | undefined>`), so `{u => u.name}` compiles without a non-null assertion.

2. **Precise input event types** — `onInput`, `onChange`, `onBlur` on `<input>` expose `e.currentTarget` as `HTMLInputElement`, not `Element`. Accessing `.value` no longer requires a cast.

3. **Functions removed from `JSX.Element`** — previously a component could accidentally accept an unexecuted function where a value was expected. Now that is a compile-time error.

Sample error from passing a raw signal (forgetting the call):

```tsx
const [count, setCount] = createSignal(0);
// Error: Type 'Accessor<number>' is not assignable to type 'number | string | boolean | null | undefined | ...'
<span>{count}</span>   // should be count()
```

The error is actionable but not spectacular — it points at the JSX line but names the `Accessor<number>` type rather than explaining the "forgot to call the getter" pattern. An experienced Solid developer knows immediately; a newcomer needs to understand the getter convention first.

Props-as-proxy type error (destructuring):
```tsx
function Comp(props: { count: number }) {
  const { count } = props;  // No TypeScript error here — this is the silent gotcha.
  // count is captured as a plain number; reactivity is lost at runtime.
  return <div>{count}</div>;
}
```
TypeScript does not catch this pattern because destructuring from a proxy is valid JavaScript. This is a documented sharp edge, not a type-system gap the language can close without runtime information.

**Score rationale: 8.0** — native TypeScript, precise JSX element types since 1.7, null-asserted control flow, precise input event targets. Loses 2 points for the props-proxy destructuring hazard (not catchable at compile time) and for `e.target` still typing as `Element` in generic event handlers (only `currentTarget` is narrowed for known input elements).

### Evidence: Compiler/build feedback quality

Setup: `vite` + `vite-plugin-solid`, TypeScript strict mode.

**Experiment 1 — wrong signal call site (reactive expression outside owner):**

```typescript
// top-level module scope, not inside a component or createRoot
const [count, setCount] = createSignal(0);
const effect = createEffect(() => console.log(count()));
```

Runtime warning (development mode):
```
computations created outside a `createRoot` or `render` will never be disposed
```
The message is accurate and names the fix (`createRoot` / `render`). No TypeScript compile error because this is legal TypeScript; it's a runtime semantics violation.

**Experiment 2 — passing an accessor as a JSX child instead of calling it:**

```tsx
const [msg, setMsg] = createSignal('hello');
return <div>{msg}</div>;  // missing ()
```

TypeScript error:
```
Type 'Accessor<string>' is not assignable to type 'JSX.Element'.
  Type 'Accessor<string>' is not assignable to type 'string'.
```
Correct and actionable. Points at the expression. Does not say "call this as a function" but the `Accessor<string>` type name is a hint for any Solid developer.

**Experiment 3 — missing required prop:**

```tsx
function Greeting(props: { name: string }) {
  return <div>Hello {props.name}</div>;
}
<Greeting />
```

TypeScript error:
```
Property 'name' is missing in type '{}' but required in type '{ name: string; }'.
```
Standard and precise.

**Experiment 4 — store path set with wrong type:**

```typescript
const [state, setState] = createStore({ count: 0 });
setState('count', 'not-a-number');
```

TypeScript error:
```
Argument of type 'string' is not assignable to parameter of type 'number | ((prev: number) => number)'.
```
Precise — the path-based setter is fully generic-typed.

**Summary**: Build-time errors are correct and point at the right line. The quality gap is: (a) the signal-called-outside-owner error is runtime-only (no static analysis), and (b) the props-proxy destructuring hazard is runtime-only. These are the two most common beginner mistakes and neither surfaces at build time.

**Score rationale: 7.0** — TypeScript errors are accurate and actionable for the cases they cover; the two highest-impact gotchas (reactive scope violation, props destructuring) are runtime warnings at best, requiring Solid DevTools or console inspection to catch.

### Evidence: Locality of behavior

**Feature traced**: Todo item toggle (checkbox change → state update → UI update) using the canonical [solidjs/solid-todomvc](https://github.com/solidjs/solid-todomvc) reference.

The entire feature lives in one file: `src/index.tsx`. Touchpoints:

1. **State definition** — `createLocalStore<TodoStore>` at the top of `TodoApp`. The `todos` array is part of the store. (~line 36)
2. **Handler definition** — `toggle` function defined inline in the same component body: `const toggle = (todoId, e) => editTodo({ id: todoId, completed: e.target.checked })` (~line 67)
3. **editTodo helper** — defined in the same component body: `const editTodo = (todo) => setState('todos', item => item.id === todo.id, todo)` (~line 58)
4. **JSX binding** — `<input class="toggle" onInput={[toggle, todo.id]} />` in the `<For>` block (~line 92)

**Count: 4 touchpoints, all in one file, all in one component function body.**

There are no separate actions files, no reducers, no event bus subscriptions, no global state file to cross-reference. The signal/store getter, the event handler, and the JSX binding are co-located. A reader can understand or modify the toggle behavior without leaving the component.

For comparison: the React TodoMVC equivalent spans `state.ts`, `reducer.ts`, `App.tsx`, and `TodoItem.tsx` in the common reference implementations — roughly 4 files, 6 touchpoints.

**Score rationale: 9.0** — single-file locality is the norm for Solid components, enforced by the reactivity model (signals declared near use, effects implicit in JSX). The only case that spans files is shared state via Context, which is explicit and traceable. Docked 1 point because `createStore`'s path-based setter API requires holding the store's shape in mind across multiple `setState` calls when a feature grows complex.

### Evidence: Explicitness / data-flow traceability

**Feature traced**: User clicks the "Toggle All" checkbox in TodoMVC → all todos flip completed state → UI updates.

Walk:

1. **User interaction (explicit)** — `<input onInput={({ target: { checked } }) => toggleAll(checked)} />`  
   Explicit: JSX attribute names the handler. No implicit subscription, no event bus.

2. **Handler call (explicit)** — `toggleAll(completed: boolean)` is a function in the same scope. Defined as `const toggleAll = (completed) => setState('todos', todo => todo.completed !== completed, { completed })`.  
   Explicit: function call visible in JSX, function definition two lines up.

3. **Store update (explicit, slightly opaque API)** — `setState('todos', predicate, patch)` is Solid's path-based setter. The path `'todos'`, the filter predicate, and the patch object are all visible. The API is concise but requires knowing that the three-argument form means "find items matching predicate, apply patch" — this is a learnable convention, not magic, but it does require reading docs or examples to decode on first encounter.

4. **Reactive graph propagation (implicit)** — After `setState`, the store proxy notifies all expressions that read the matched `todo.completed` properties. This propagation is invisible in source: there is no explicit "notify subscribers" call. The reactive graph is maintained by the framework's runtime.

5. **DOM update (implicit, but scoped)** — The `classList={{ completed: todo.completed }}` binding in the JSX was compiled to an effect. That effect re-runs only for the specific list items whose `completed` changed. The developer doesn't write this effect; the compiler generated it.

**Explicit hops: 3** (JSX binding → handler name → setState call)  
**Implicit hops: 2** (reactive propagation through store proxy, compiler-generated DOM effect)

The implicit hops are *scoped* — they don't span files or require understanding a global event bus. They follow from two documented invariants: "stores track property access" and "JSX expressions with signal reads become effects." A developer who knows these two rules can trace the full flow without debugging tools. Contrast with MobX (implicit everywhere) or Vue Options API (computed/watch hidden in the options bag).

**Score rationale: 8.5** — three explicit hops, two well-defined implicit hops that follow from documented invariants. The data flow is straightforward from trigger to DOM update. The main legibility cost is the three-argument `setState` form for stores, which is terse to the point of requiring context to parse.

### Evidence: Convention strength

**Task: "fetch data on component mount and display it"**

Grepped the official SolidJS docs ([docs.solidjs.com](https://docs.solidjs.com)) and community tutorials for approaches. Found these distinct idiomatic patterns:

1. **`createResource(fetcher)`** — the canonical, documented-first approach. Returns a reactive value with `.loading` and `.error` accessors; integrates with Suspense. This is in every official tutorial.

2. **`createResource(source, fetcher)`** — the reactive-source variant where the resource re-fetches when a signal changes. A natural extension of (1), not really a different convention.

3. **Manual signals + `createEffect`** — define `const [data, setData] = createSignal(null); const [loading, setLoading] = createSignal(false);` and use an async `createEffect` with `fetch`. Found in several community posts, often written by React-background developers applying `useEffect` patterns. Functionally equivalent but more boilerplate than `createResource` and lacks the `.error` / `.loading` accessors.

4. **`@tanstack/solid-query`** — the full TanStack Query adapter for Solid, used in larger apps for caching, deduplication, and background refetching. Not a Solid idiom but an established ecosystem add-on.

**Count: 3 real alternatives** (resource, manual signals+effect, TanStack Query). The canonical path (`createResource`) is well-marked; the docs lead with it. Manual signals+effect is present as a fallback but is less commonly shown in first-party docs. TanStack Query is for more complex use cases and clearly positioned as an add-on.

No documentation friction on convention strength: the official "Fetching Data" guide ([docs.solidjs.com/guides/fetching-data](https://docs.solidjs.com/guides/fetching-data)) makes `createResource` the unambiguous starting point.

**Score rationale: 7.5** — the canonical approach is well-defined and docs lead with it. The community alternative (manual signals+effect) and the ecosystem add-on (TanStack Query) represent real choice that an AI model or new developer has to navigate. Fewer alternatives than React (which has useEffect, SWR, React Query, React 19 use(), data loaders, etc.) but more than Svelte's single idiomatic path.

### Evidence: Token efficiency / boilerplate density

**Path taken: canonical reference implementation** — [solidjs/solid-todomvc](https://github.com/solidjs/solid-todomvc), `src/index.tsx`. This is the first-party TodoMVC maintained by the SolidJS organization, authored by Ryan Carniato, targeting the standard TodoMVC spec (add, edit, toggle, delete, filter, persist to localStorage, show item count).

**Line count: 117 lines** for the complete application (imports + types + store helper + component + render call). This covers the full spec including localStorage persistence, filter routing via `window.hashchange`, and the toggle-all checkbox.

```
- Imports:          3 lines
- Type declarations: 15 lines
- Constants/helpers: 7 lines
- createLocalStore:  6 lines
- TodoApp component: 84 lines (state, helpers, JSX)
- render() call:     1 line
```

The entire app is one file. There is no separate actions file, reducer, store file, or router. The store shape, all handlers, and the JSX are co-located in `TodoApp`.

For context: the React TodoMVC canonical at [tastejs/todomvc](https://github.com/tastejs/todomvc) spans multiple files and totals roughly 200–250 lines across the relevant source files for equivalent functionality (without TypeScript types, which adds more).

**Score rationale: 8.5** — 117 lines for a complete spec-compliant app with TypeScript types is compact. The score reflects real efficiency: no boilerplate reducers, no action creators, no separate state files. The store's path-based setter API (`setState('todos', pred, patch)`) is terse. Docked 1.5 points because the `createStore` update API is more complex to read/write than simple signal assignment, and the TypeScript type declarations (15 lines) are a non-trivial fixed cost.

### Evidence: Familiarity composite

Four proxies:

1. **Age** — first stable release 2018; 8 years old as of 2026. Predates Svelte's wide adoption but postdates React/Vue/Angular by several years. Long enough to have substantial community material; not long enough for SO saturation like React.

2. **Stack Overflow volume** — SolidJS SO volume is small relative to React/Vue. The `[solidjs]` tag has ~4,000–5,000 questions (estimate based on search; SO direct query was blocked). React has ~450,000+. This is roughly a 90x gap in SO training signal.

3. **GitHub stars** — 35.6k stars as of June 2026, ~1.1k forks. Growing at roughly 60% YoY per PkgPulse data. Healthy trajectory but still an order of magnitude below React (230k+) and significantly below Vue (48k+) and Svelte (30k+, similar range).

4. **npm downloads** — approximately 1.5–2.4M weekly downloads (range from different measurement methodologies). Growing but roughly 80x below React. The npm trend direction is positive; solid-js 1.9.13 was published 24 days before this review date.

**Triangulation**: Solid is in the "known but not dominant" tier — well-represented in framework comparison articles, benchmark discussions, and signal-reactivity discourse; sparse in production codebases relative to React/Vue/Angular. An AI model trained through early 2025 would have meaningful Solid coverage from tutorials, release announcements, and React-comparison content, but far less reinforcement from Stack Overflow answers, GitHub code examples, and production snippet searches.

The signals mental model (call `count()` to read, `setCount()` to write, no dependency arrays) is distinctive enough to be memorable and well-documented, but the prop-proxy hazard and `<Show>`/`<For>` patterns are less widely reinforced.

**Score rationale: 6.5** — known, growing, conceptually distinct enough to be well-covered in AI training. The score reflects a real but manageable familiarity gap vs. React/Vue. The JSX syntax is React-familiar; the differences (signals as functions, control flow components, no re-renders) are the places where models trained primarily on React may produce subtly wrong code.

### Evidence: Stability / convention durability

The 1.x API has been stable since 2021. The 1.9.x series (current stable: 1.9.13) introduced only quality-of-life changes (JSX validation improvements, better export handling, `bool:` attribute namespace, `handleEvent` support) with one minor breaking change: removal of the `browser` field from `package.json` in 1.9.0 (requiring build tools to use the `exports` field explicitly).

The convention durability concern is the in-progress **Solid 2.0**. Per `next_release` frontmatter (the single source of truth), 2.0.0-beta.0 shipped March 2026 with these breaking changes:

- `createResource` async model replaced by first-class Promise support in `createMemo`/`createSignal`
- `createEffect` split into compute and apply phases
- `onMount` renamed to `onSettled`
- `<Index>` removed (use `<For keyed={false}>`)
- `use:` directives removed (use `ref` factory pattern)
- Store setters now draft-first by default
- `<Suspense>` mechanics changed with new `<Loading>` component

**Stability penalty: YES** — the 2.0 beta is in active ecosystem adoption testing. A developer writing 1.x code today is writing code that will need non-trivial migration to 2.0. The core mental model (signals, fine-grained reactivity, JSX) is unchanged, but the async APIs and effect model that appear in nearly every non-trivial component are being rewritten.

The 2.0 beta roadmap from [github.com/solidjs/solid/discussions/2425](https://github.com/solidjs/solid/discussions/2425) confirms: RC phase follows beta, then stable 2.0. Timeline to stable is not announced as of this review date (June 2026).

**Score rationale: 5.5** — 1.x conventions are rock-solid within their version; 2.0 introduces broad-scope breaking changes to the async model and effect API that affect the majority of real applications. The stability penalty reflects that conventions an AI model writes today against 1.x have a meaningful probability of being wrong for 2.x within the next 6–12 months.

### Evidence: Ecosystem tooling facts

**DevTools**
- [solid-devtools](https://github.com/thetarnav/solid-devtools) (community-maintained, latest 0.34.5) — Chrome extension + Vite plugin that visualizes the reactivity graph, lists component hierarchy, inspects signal/store values, and shows dependency relationships between computations. Not first-party; actively maintained.
- Chrome DevTools: native DOM inspection works normally since Solid produces real DOM nodes.

**Testing**
- [@solidjs/testing-library](https://github.com/solidjs/solid-testing-library) — first-party wrapper around Testing Library for rendering components in tests, with automatic reactive cleanup. API mirrors `@testing-library/react`.
- [Vitest](https://vitest.dev/) — recommended test runner; solid-js works with Vitest's jsdom environment out of the box.
- No friction in the testing docs ([docs.solidjs.com/guides/testing](https://docs.solidjs.com/guides/testing)): the guide is direct, and the setup is three dependencies.

**IDE/LSP**
- TypeScript language server covers types natively; no special LSP needed.
- Volar (Vue tooling) does not apply; Solid uses standard TS/JS LSP.
- JSX in `.tsx` files is handled by the TypeScript server with Solid's `tsconfig.json` (`"jsx": "preserve"`, `"jsxImportSource": "solid-js"`).
- VSCode: no dedicated official extension; TypeScript + Prettier coverage is sufficient for most work.
- The [Solid DevTools Vite plugin](https://www.npmjs.com/package/solid-devtools) adds development-time reactivity visualization as a browser panel.

**Build tooling**
- [vite-plugin-solid](https://www.npmjs.com/package/vite-plugin-solid) — Vite integration, first-party, the canonical build path.
- Rollup: used in the solid-todomvc reference (no web server required; bundle points to `dist/index.html`).
- Babel and SWC transforms are available for non-Vite setups.

**Router / meta-framework**
- [@solidjs/router](https://github.com/solidjs/router) — first-party router with signal-reactive route params.
- [SolidStart](https://start.solidjs.com/) — the first-party meta-framework (SSR, SSG, file-based routing); reviewed separately in `solidstart.md`.

**Score rationale: 7.0** — solid testing library and Vite plugin are first-party and production-quality. DevTools is community-maintained and covers the reactivity graph well but lacks the maturity of React DevTools (no time-travel, no flamegraph profiler). No dedicated IDE extension means no autocomplete for control-flow component props beyond what TypeScript infers. Docked 3 points versus React's 9 primarily for: community-maintained devtools vs. Meta-maintained, no dedicated IDE extension, no official standalone profiler.

## On the Horizon

### Next release

- **Name/version:** 2.0.0
- **Status:** beta (2.0.0-beta.0 shipped March 2026 on npm `next` tag)
- **What's changing:** First-class async Promises in the reactive graph (Promises now suspend computations directly, replacing the `createResource` pattern as the primary async primitive). New `<Loading>` component for initial readiness. `isPending()` for refresh states. `action()` for optimistic UI. `createEffect` split into compute/apply phases. `onMount` renamed `onSettled`. `<Index>` removed in favor of `<For keyed={false}>`. `use:` directives removed. Store setters draft-first. Microtask-based deterministic scheduler with `flush()`.
- **Anticipated impact:** Every application using `createResource`, `createEffect`, or `<Index>` needs migration. The async model change is the most impactful for real codebases. The core mental model (signals, fine-grained, JSX) is preserved; this is not a paradigm rewrite, but it is a broad API rewrite.
- **Stability penalty:** yes — see `### Evidence: Stability / convention durability` above.

### AI-tooling investment

- **What exists:** SolidJS publishes `llms.txt` at `https://docs.solidjs.com/llms.txt` plus full-content variants: `llms-solid.txt` (all Solid-related files as links), `llms-solid-full.txt` (complete docs as Markdown), `llms-solid-guides.txt` (guides section), `llms-solid-api.txt` (API reference section). No official MCP server. No Boost-style curated AI guidelines package. No AI-specific style guide document.
- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter for the full comparison. Summary: two idiomatic corrections (ternary→`<Show>`, inline arrow→tuple event form) and one proactive hazard annotation (props-proxy destructuring warning) when the `llms-solid-full.txt` context was loaded versus without. The delta is real and meaningful for newcomers to Solid; it closes the React→Solid mental model gap rather than teaching structural concepts. No improvement was observed on the 1.x vs. 2.0 distinction — the model with the full docs loaded still defaulted to 1.x `createResource` for async examples, suggesting the 2.0 material is not yet well-represented in the `llms-solid-full.txt` as of this review.
