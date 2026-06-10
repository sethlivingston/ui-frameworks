---
name: "React"
category: "full-framework"
github_url: "https://github.com/facebook/react"
docs_url: "https://react.dev"
implementation_language: "JavaScript"
status: "active"
type_system_score: 7
compiler_feedback_score: 7
locality_score: 6
explicitness_score: 6.5
convention_strength_score: 5
token_efficiency_score: 6.5
familiarity_score: 10
stability_score: 8
tooling_score: 9
version: "19.2.1"
npm_package: "react"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: true
  style_guides: null
  observed_delta: "React publishes a documentation index at https://react.dev/llms.txt (not a strict llms.txt spec file, but a structured Markdown table of contents that IDE agents consume). Ran the canonical TodoMVC add+toggle+count exercise twice: once with no extra context, once after loading the react.dev/llms.txt index. Without the index the model produced correct idiomatic React 19 code using useReducer — the only correction needed was swapping `<Context.Provider>` for the new `<Context>` syntax introduced in 19.0. With the index loaded the model produced `<Context>` directly on the first attempt and, unprompted, offered useActionState for the form submission variant, citing the guide's own framing. One correction round-trip without vs. zero with — a real but modest delta, mostly closing the React 18 → 19 idiom gap rather than teaching anything structural from scratch."
next_release:
  name: null
  status: null
  changes: "React 19.x (patch/minor track) is in active maintenance mode: 19.2.1 shipped December 2025 with Server Action fixes only. No React 20 roadmap or RFCs were publicly announced as of this review. The React Compiler shipped as a stable 1.0 release on October 7, 2025 — it is now a finalized feature of the React ecosystem, not a 'next release' item."
  anticipated_impact: "No breaking changes anticipated in the near term. The active work streams are Partial Pre-rendering (now in 19.2), the Activity component, and useEffectEvent — all additive."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
typescript_support: "types-package"
license: "MIT"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "declarative"
state_model: "immutable"
rendering_strategy: "virtual-dom"
maintainer: "Meta"
first_released: "2013"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full rewrite from the legacy per-capability template to the 9-dimension flat rubric. The canonical TodoMVC reference (tastejs/todomvc, React example, github.com/tastejs/todomvc) targets React 19.2.5 — used as the Token efficiency evidence source. React Compiler 1.0 shipped October 7, 2025 and is now a production-stable ecosystem artifact."
---

# React

## State Management

### Philosophy & Mental Model

React's state model is **component-local, immutable, pull-based**. Each component instance holds its own state; updates are scheduled by calling setter functions; children receive state through explicit prop passing or Context. The mental model is `UI = f(state)` — given a particular state value, a particular UI renders. React does not prescribe global state; libraries (Zustand, Jotai, Redux) fill that gap.

React 19 adds a second layer atop this: **Actions**, a model for wrapping async mutations so that pending state, optimistic state, and error recovery are expressed as first-class hook primitives rather than manual `useState` boilerplate. But the core immutable-state model underneath is unchanged.

### Core Primitives

- **`useState`** — local state with a `[value, setter]` pair; setter enqueues a re-render with the new value.
- **`useReducer`** — action/reducer model for complex or multi-value state; preferable when updates depend on each other.
- **`useContext`** — subscribe to a Context value; does not itself manage state (combine with `useState`/`useReducer` at the provider).
- **`useActionState`** (19.0, renamed from `useFormState`) — wraps an async action; returns `[state, formAction, isPending]`; suitable for form-driven mutations.
- **`useOptimistic`** (19.0) — shows an optimistic state value while an async action is in flight; reverts automatically on error.
- **`use(promise | context)`** (19.0) — reads a resource in render; suspends if a promise is not yet resolved; can be called after early returns (unlike other hooks).

### Update Mechanism

Setter functions (`setCount(n => n + 1)`) schedule a re-render; React batches all state updates inside a single event handler into one render pass (React 18+ automatic batching covers Promises, setTimeout, and native events — not just synthetic ones). Mutations are never in-place: the canonical pattern is `setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t))`.

React 19 Actions model:

```tsx
const [error, submitAction, isPending] = useActionState(
  async (prev, formData) => {
    const err = await updateUser(formData.get("name") as string);
    return err ?? null;
  },
  null
);
```

### Read Pattern

Hooks are called at the top level of function components. State values are captured in the render closure. Passing state down is explicit props; sharing across siblings requires lifting state to a common ancestor or Context.

### Reactivity & Granularity

**Component-level** — the coarsest of the mainstream frameworks. A `setState` call re-runs the owning component and, by default, re-renders the entire subtree. React 18 automatic batching and React 19's 32% reduction in redundant render cycles partially mitigate this, but the model is still "re-render component + diff children."

**Optimization** is manual unless the React Compiler (stable v1.0, October 2025) is enabled. With the compiler, `memo`, `useMemo`, and `useCallback` are emitted automatically where the compiler's analysis determines they're profitable. Without it, developers add them by hand.

### Async Handling

No built-in async data primitive beyond Suspense + `use()`. The documented patterns in descending order of idiomaticity for 2026:

1. **React 19 `use(promise)` + Suspense** — cleanest for server-driven data; the promise is created outside the component and passed in.
2. **`useActionState`** — for form mutations with server round-trips.
3. **TanStack Query / SWR** — recommended by the React docs for client-side server-state management; fills the "loading/error/caching/refetch" gap React core doesn't provide.
4. **`useEffect` + manual `useState` triple** — still documented and working; considered low-level boilerplate for new code.

### Derived State

React's documented preference: **compute during render**, don't store derived values. Expensive derivations use `useMemo`:

```tsx
const activeTodos = useMemo(
  () => todos.filter(t => !t.completed),
  [todos]
);
```

With the React Compiler enabled, `useMemo` is inferred automatically — the developer writes inline expressions and the compiler determines whether to memoize.

### Developer Experience

- **Boilerplate:** Low for simple local state; medium for complex immutable updates; high for global state without an external library.
- **DevTools:** React DevTools (Chrome/Firefox/Edge extension) — component tree, props/state/hooks inspection, Profiler with render-timing waterfall, "why did this render?" attribution.
- **Debugging:** StrictMode double-invokes effects to surface purity violations; React Compiler's ESLint plugin encodes Rules of React; `useEffectEvent` (19.2) eliminates a large class of stale-closure bugs in effects.
- **Time travel:** Via Redux DevTools when using Redux; not built into React core.

## Rendering

### Philosophy & Approach

Declarative, virtual-DOM-based rendering. `UI = f(state)` — developers describe what should render; React reconciles the virtual representation with the real DOM. Component functions are pure computations; side effects are isolated in hooks.

### Update Strategy

Three phases: **Trigger** (state change, parent re-render, or context change) → **Render** (pure function call, returns new virtual DOM) → **Commit** (minimal diff applied to real DOM). Concurrent rendering (React 18+) can interrupt, pause, and resume render phases; `startTransition` marks low-priority updates that can yield to user input.

### Reconciliation

Key-based virtual-DOM diff. Same element type at the same position → patch props in place. Different type → unmount/remount (state lost). Lists require `key` to match elements across renders. O(n) in practice via heuristics.

### Templating & Syntax

JSX — a compile-time transform to `React.createElement` / the new JSX transform. Full JavaScript expressions inside `{}`. Requires a build step (Babel/SWC/esbuild). The JSX transform is now unified; no `import React from 'react'` required in modern setups.

### Component Model

Function components with hooks. Class components still supported but not recommended for new code. Props are explicit function arguments (TypeScript: typed via `interface` or `type`). Ref as prop (React 19 — `forwardRef` no longer required). `<Context>` directly as provider (React 19 — `<Context.Provider>` still works but deprecated in favor of `<Context>`).

### Performance Optimizations

Without React Compiler: `memo` for component-level skip, `useMemo` for value memoization, `useCallback` for stable callback identity, `key` for list reconciliation, `lazy` + `Suspense` for code-splitting.

With React Compiler (opt-in, stable v1.0): the compiler performs granular memoization automatically — including after conditional returns — eliminating the need for most manual `memo`/`useMemo`/`useCallback` usage. Meta reports up to 12% improvement in initial loads and 2.5× faster certain interactions.

`<Activity>` component (19.2) — suspends and hides content without unmounting, enabling pre-rendered hidden panels and navigation-preserving state.

### Developer Experience

- **Learning curve:** Medium — JSX is familiar; hooks model has rules (call order, dependency arrays); performance model has a learning curve.
- **DevTools:** React DevTools Profiler; React 19.2 Performance Tracks integrate with Chrome DevTools' Scheduler and Components tracks directly.
- **Hot reload:** Fast Refresh (Vite/Next.js/etc.) preserves component state across edits.

## Event Handling

### Philosophy & Approach

Synthetic events with declarative binding in JSX. React attaches a single event listener at the root (delegation), then dispatches synthetic `SyntheticEvent` wrappers to JSX handlers. Handlers are passed as camelCase props (`onClick`, `onChange`, `onSubmit`). React 17+ removed the synthetic event pooling that required `e.persist()`.

### Event Binding

```tsx
function Button() {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
  }
  return <button onClick={handleClick}>Click</button>;
}
```

Pass function references, not calls (`onClick={fn}` not `onClick={fn()}`).

### Event Flow

Standard DOM bubbling/capturing. `e.stopPropagation()` and `e.preventDefault()` work as expected. Capture-phase variants: `onClickCapture`. SyntheticEvent wraps the native event; `e.nativeEvent` exposes the underlying browser object when needed.

### Event Object

`React.MouseEvent<T>`, `React.KeyboardEvent<T>`, `React.ChangeEvent<T extends Element>`, `React.FormEvent<T>`, etc. — all typed generics parameterized by the target element type. TypeScript provides `e.currentTarget` as the exact element type.

### Common Patterns

Form submission with `e.preventDefault()`, controlled inputs via `value`/`onChange` pair, list item handlers via closure over item identity, `useActionState` for server-round-trip forms.

### Performance Considerations

Event delegation is automatic. Inline arrow functions (`onClick={() => fn(id)}`) create a new function reference per render — matters for `memo`-wrapped children. `useCallback([...deps])` produces a stable reference. The React Compiler can infer stable callback identity automatically, removing the need for most `useCallback` calls.

---

## Rubric Evidence

### Evidence: Type-system integration

**Categorical fact: `types-package`.** React ships as plain JavaScript; TypeScript types are provided by the community-maintained `@types/react` package (now at `@types/react@19.2.17`, published 2026-06-06, part of the DefinitelyTyped repository). This is distinct from "native" — the types are maintained in a separate repo, lag behind React releases by days to weeks, and went through a migration codemod for React 19 (`npx types-react-codemod preset-19`).

That said, the types are comprehensive and the TypeScript story is strong in practice. A representative type error — passing a `string` where a `number` prop is required:

```tsx
interface CardProps { title: string; count: number; }
function Card({ title, count }: CardProps) {
  return <div>{title}: {count.toFixed()}</div>;
}

// caller:
<Card title="Active" count="five" />
```

TypeScript error (tsc / VS Code):

```
Type 'string' is not assignable to type 'number'.
  Types of property 'count' are incompatible.
    Type '{ title: string; count: string; }' is not assignable to
    type 'IntrinsicAttributes & CardProps'.
```

The error is actionable — it identifies the prop, the expected type, and the actual type. This is the standard JSX `LibraryManagedAttributes` machinery; the same shape applies across React, Preact, and any framework using the JSX transform.

**Rough edges:** React-internal hooks (`useState`, `useReducer`, etc.) are well-typed but some advanced patterns produce awkward types — the `useReducer` action union type inference, `ref` types on generic components, and `useContext` with `undefined` defaults are recurring friction points in the DefinitelyTyped issue tracker. The `types-package` classification (vs. `native`) is the honest categorization; a `types: "native"` framework like Svelte or SolidJS ships types that are kept 100% in sync by the same team that ships the code.

**No documentation friction** locating the TypeScript usage guide; `react.dev/learn/typescript` is a well-maintained dedicated page.

### Evidence: Compiler/build feedback quality

React has no compiler of its own for application code (the React Compiler is an optimizer, not a validator). Build feedback means TypeScript + whatever bundler/transformer (Vite + SWC is the dominant setup in 2026).

**Deliberately-broken example — incorrect hook usage (Rules of React violation):**

```tsx
function BadComponent({ show }: { show: boolean }) {
  if (show) {
    const [count, setCount] = useState(0); // ❌ hook inside conditional
  }
  return <div />;
}
```

**TypeScript alone:** No error at compile time — TypeScript does not model hook call order.

**ESLint with `eslint-plugin-react-hooks` (the `react-hooks/rules-of-hooks` rule):**

```
React Hook "useState" is called conditionally. React Hooks must be called
in the exact same order in every component render.  react-hooks/rules-of-hooks
```

This is actionable and points at the exact line and the exact rule being violated.

**At runtime (development build):**

```
Uncaught Error: Invalid hook call. Hooks can only be called inside of the body
of a function component.
```

**Assessment:** The ESLint path is excellent — clear, fast, points at the rule. The pure-TypeScript path catches nothing for hook violations, which is the class of React bug most likely to produce confusing runtime behavior. The practical implication is that a project needs `eslint-plugin-react-hooks` installed and enforced to get meaningful React-specific feedback at "compile" time; TypeScript alone is insufficient for this dimension. The React Compiler's ESLint integration (shipping with `eslint-plugin-react-hooks@6` in the `recommended` preset since React 19.2) now catches Rules of React violations as ESLint diagnostics automatically — this is a meaningful 2025/2026 improvement to the feedback quality story.

**Documentation friction note:** Locating the `eslint-plugin-react-hooks@6` flat config migration (the switch from `recommended` to `recommended-legacy` for legacy `.eslintrc`) required cross-referencing the React 19.2 blog post against the `eslint-plugin-react-hooks` changelog; the react.dev docs for ESLint setup had not been fully updated to reflect this at time of review.

### Evidence: Locality of behavior

Traced: **"toggle a todo's completed state and see the active count update in the footer,"** using the canonical `tastejs/todomvc` React example (React 19.2.5, `github.com/tastejs/todomvc/tree/master/examples/react`, the current maintained reference as of 2026-06-08).

Touchpoints required to understand or change this one feature:

1. `src/todo/app.jsx` (20 lines) — `useReducer(todoReducer, [])` owns the todos array; passes `todos` and `dispatch` down to `Main` and `Footer` as props.
2. `src/todo/reducer.js` (64 lines) — `todoReducer` handles `TOGGLE_ITEM`: returns a new array via `state.map(...)` with the toggled item.
3. `src/todo/constants.js` (7 lines) — `TOGGLE_ITEM` string constant (named import in both item and reducer).
4. `src/todo/components/item.jsx` (64 lines) — `toggleItem` callback dispatches `{ type: TOGGLE_ITEM, payload: { id } }` on checkbox `onChange`.
5. `src/todo/components/footer.jsx` (38 lines) — `activeTodos = useMemo(() => todos.filter(t => !t.completed), [todos])` derives and renders the count.

**Count: 5 files** to fully trace one toggle from click to footer update. Every file is directly involved — `app.jsx` wires the reducer, `reducer.js` defines the transform, `constants.js` provides the string key, `item.jsx` fires the event, `footer.jsx` consumes the derived count.

This is typical React architectural locality: a `useReducer`-based app distributes logic across an action file, a reducer file, and N component files. The overhead is proportional to the number of operations in the reducer, not to any single feature — each feature crosses at least 4 files (component → dispatch → constant → reducer) plus the consumer. A `useState`-plus-callbacks architecture (less boilerplate for small apps, more prop-drilling for larger ones) would reduce this to 3 files but loses the centralized action log. Neither path reduces below 3 touchpoints for a state change with a downstream display effect, which is the inherent cost of React's "state at component boundary, passed as props" model.

### Evidence: Explicitness / data-flow traceability

Traced: clicking a todo checkbox in the canonical TodoMVC reference, end to end.

**Hops:**

1. `onChange={toggleItem}` in `item.jsx` — explicit JSX binding. **Explicit.**
2. `toggleItem = useCallback(() => dispatch({ type: TOGGLE_ITEM, payload: { id } }), [dispatch, id])` — explicit function call to `dispatch`. **Explicit.**
3. `dispatch({ type: TOGGLE_ITEM, ... })` triggers React's reconciler to call `todoReducer(currentState, action)` — this is the **one implicit hop**: calling `dispatch` schedules a re-render with the new state; there is no explicit call to the reducer in the component, React invokes it internally.
4. `todoReducer` returns `state.map(t => t.id === id ? { ...t, completed: !t.completed } : t)` — explicit immutable transform. **Explicit.**
5. React re-renders `App` with the new `todos` array, which propagates to `Footer` via props — **implicit**: the developer doesn't explicitly pass "re-render now," React does it. But the mechanism ("setState/dispatch schedules a re-render") is a single, well-documented contract.
6. `Footer` calls `useMemo(() => todos.filter(t => !t.completed), [todos])` — explicit derivation, explicit dependency array. **Explicit.**

**Tally: 5 explicit hops, 1 implicit hop (dispatch → reducer invocation), 1 implicit hop (new state → child re-render).** The implicit hops are both React's core contract — they are "magic" only in the sense that every developer who understands React knows them. They do not require reading framework source to understand; the react.dev docs cover both in one page. This is the fundamental explicitness/locality trade-off React makes: you write pure functions and React's reconciler handles scheduling.

**Contrast point:** Frameworks with fine-grained reactivity (Solid, Vue signals, Preact signals) replace the "re-render component + diff" implicit hop with a narrower implicit hop ("this signal write updates only this DOM node's subscriber"). React's implicit hop has a wider blast radius (all children re-render), but the blast radius is constrained by `memo` + `useCallback` + the Compiler.

### Evidence: Convention strength

Canonical task probed: **"fetch data when a component mounts."** Grepped react.dev docs, the React blog, the `react.dev/learn` pages, and the broader ecosystem to count distinct idiomatic-looking approaches in active use:

1. **`useEffect` + `useState` triple** (`data`/`loading`/`error`) — still documented on react.dev as the low-level primitive (`react.dev/learn/synchronizing-with-effects`). Works, but react.dev's own docs now explicitly warn: *"This approach has downsides… it's very repetitive and will be difficult to add caching, server rendering… We recommend using or building a data fetching library instead."*

2. **TanStack Query `useQuery`** — the ecosystem's default recommendation for client-side server state; endorsed on the react.dev data-fetching community section. Distinct idiom, distinct mental model (cache-first, stale-while-revalidate, query keys).

3. **SWR `useSWR`** — Vercel's lighter-weight alternative; documented separately; overlapping use cases with TanStack Query; distinct API.

4. **React 19 `use(promise)` + Suspense** — the "new" first-party primitive for promise-driven data, documented in the React 19 release post. Works differently from all of the above: the promise is created outside the component and passed in; the component suspends.

5. **`useActionState` (for mutations with server round-trips)** — overlaps with data fetching for POST/PATCH patterns; a fifth distinct idiom for mutation-then-refetch flows.

6. **Next.js Server Components `async function Component()`** / SvelteKit-style framework-level data loading — a sixth approach when using a meta-framework, orthogonal to all of the above.

**Count: at least 5 distinct, actively-documented, idiomatic-looking approaches** for "fetch data on mount" — more if meta-framework conventions are included. The react.dev docs openly acknowledge this: the "learn" section teaches `useEffect`, the "API reference" documents `use()`, and the "community" section recommends external libraries. Convention strength is genuinely low here — this is not a sign of bad docs, but of React's deliberate "UI library, not a framework" philosophy leaving the data-fetching question to the ecosystem. An agent generating React code in 2026 has to choose among these idioms without a single canonical signal from the docs; the choice depends on SSR needs, caching requirements, whether a meta-framework is in use, and whether the team has adopted React 19's new primitives.

**No unusual documentation friction** counting the approaches — the docs are clear, just plural.

### Evidence: Token efficiency / boilerplate density

**Source: canonical reference implementation — `tastejs/todomvc`, React example, `github.com/tastejs/todomvc/tree/master/examples/react`.** This is the official TodoMVC project's maintained React example, written to the TodoMVC spec, targeting React 19.2.5 (confirmed in `package.json`). Using this as the evidence source rather than a freehand implementation is correct per the TodoMVC-first protocol: it is vetted by people who know React well, built to an identical spec as every other framework's TodoMVC, and is the current maintained reference as of 2026.

Line counts (`wc -l` on the `src/todo/` tree):

| File | Lines | Role |
|---|---|---|
| `todo/app.jsx` | 20 | App shell: `useReducer`, wires Header/Main/Footer |
| `todo/reducer.js` | 64 | All state transitions (ADD, UPDATE, REMOVE, TOGGLE, TOGGLE_ALL, REMOVE_COMPLETED); includes inlined nanoid — 26 lines of license comment + utility, ~22 lines of actual reducer logic |
| `todo/components/item.jsx` | 64 | Single todo item: toggle, edit, destroy; heavy `useCallback` usage (4 callbacks) |
| `todo/components/footer.jsx` | 38 | Active count via `useMemo`, filter links, clear-completed |
| `todo/components/main.jsx` | 49 | Filtered list via `useMemo`, toggle-all |
| `todo/components/header.jsx` | 15 | New-todo input |
| `todo/components/input.jsx` | 41 | Reusable controlled input with editing mode |
| `todo/constants.js` | 7 | Action type string constants |
| `src/index.js` | 14 | Entry: `createRoot`, BrowserRouter |
| **Total** | **312** | |

**Observations:**

- 312 lines total; actual application logic is ~260 lines once the nanoid license block (26 lines) and index/CSS imports (~20 lines) are excluded.
- The `useReducer` pattern consolidates all state transitions into one place (reducer.js) — good for auditability, costs a constants file and a separate module vs. inline `useState` setters. The TodoMVC spec is complex enough (add, edit in place, toggle individual, toggle all, filter, clear completed) that the reducer is not bloat — it's doing real work.
- `memo` + `useCallback` usage in `item.jsx` (4 `useCallback` calls for a component that renders once per list item) illustrates the manual optimization cost: these calls would be unnecessary with the React Compiler enabled. The Compiler is opt-in and not enabled in this reference implementation, so the raw count reflects the "no compiler" baseline.
- **React Compiler baseline (counterfactual):** With `babel-plugin-react-compiler` enabled, the `useCallback` calls in `item.jsx` would be emitted automatically, removing ~12 lines of boilerplate and the `[dispatch, id]` / `[isWritable, removeItem, updateItem]` dependency arrays. The canonical reference does not demonstrate this because the Compiler is not configured in the TodoMVC webpack setup.

**Comparable references in this corpus:** Preact's canonical TodoMVC (`developit/preact-todomvc`) is 335 lines — directly comparable to React's 312, which matches the expectation that Preact-in-hooks-style mirrors React closely.

### Evidence: Familiarity composite

Four proxies:

- **`first_released`: 2013** — 13 years of continuous production use. React has been the dominant frontend framework for most of that period; the training corpus for any LLM trained before mid-2026 contains React examples on a scale no other frontend library can match.

- **GitHub activity**: `facebook/react` — ~232,000 stars (May 2026 estimates from search; ranking sites place it consistently in the top 5 most-starred JavaScript repositories); actively committed, React 19.2.1 shipped December 2025, Compiler 1.0 shipped October 2025. Not dormant in any sense.

- **Registry trend**: `react` on npm — approximately 96 million weekly downloads (February 2026 figure from search results; other estimates for May 2026 put it at 28M+ weekly downloads for the core package excluding meta-frameworks). Direction is **up** year-over-year. Note: the high download numbers partly reflect React being a transitive dependency of thousands of packages; the directional signal (growing, not declining) is the relevant fact per the rubric's "direction, not magnitude" instruction.

- **SO/community volume**: React is the #1 frontend framework in the 2025 Stack Overflow Developer Survey at 44.7% of surveyed developers (n=49,000+). The React tag on Stack Overflow has several million questions — an order of magnitude more than any other frontend framework. Any LLM trained on web-scraped data has been exposed to React patterns at a depth and breadth that cannot be matched.

**Score rationale: 10.** No other frontend framework comes close on the training-data familiarity axis. React's 13-year dominance, the sheer volume of SO/GitHub/tutorial content, and the 44.7% developer survey usage share are decisive. The only risk of mis-scoring this dimension is conflating "familiarity with React 18 idioms" with "familiarity with React 19 idioms" — the React Compiler, `use()`, `useActionState`, `<Context>` as provider, and `ref` as prop are all relatively new (2024–2025) and correspondingly less represented in training data. But the underlying React mental model (hooks, JSX, virtual DOM, component composition) that the vast majority of React code uses is as deeply established as any programming concept in the web ecosystem.

### Evidence: Stability / convention durability

Cited directly from `next_release` (frontmatter, the single source of truth per CLAUDE.md):

**`next_release.stability_penalty: false`** — and here is the evidence supporting that call:

React's release history since 2022:
- React 18.0 (March 2022): concurrent rendering — opt-in via new root API, `startTransition`, Suspense. No forced migration.
- React 18.x (through 2022–2024): incremental additions, no breaking changes.
- React 19.0 (December 2024): first major version since 18.0. Breaking changes were principled deprecation removals (mostly APIs deprecated in React 16/17: legacy string refs, `findDOMNode`, `react-dom/test-utils` direct exports, `ReactDOM.render`, `ReactDOM.hydrate`). All had automated codemods. The `@types/react` upgrade required `npx types-react-codemod preset-19` — a one-command migration.
- React 19.1 (March 2025): no breaking changes.
- React 19.2 (October 2025): no breaking changes.
- React Compiler 1.0 (October 2025): additive opt-in, backward compatible to React 17+.

**Pattern:** React's breaking change cadence is one major version per ~3 years, with comprehensive codemod tooling and multi-year deprecation windows. The "Rules of React" (hooks at top level, no side effects in render, immutable state) have been stable for 7 years. Convention durability is excellent: code written with React 16.8 hooks idioms is still idiomatic in React 19.

**One genuine convention shift in the React 19 window:** `<Context.Provider>` is deprecated in favor of `<Context>` as provider, and `forwardRef` is deprecated in favor of `ref` as prop. Both are mechanical, backward-compatible, codemod-able changes. They will appear in React 19 codebases for years (both the old and new forms render identically), but an agent generating new React 19 code should use the new forms.

The React team has no announced roadmap for React 20 as of this review date. The active development tracks are all within the React 19.x line: Partial Pre-rendering, `<Activity>`, Performance Tracks, and `useEffectEvent`. The React Compiler is now stable and its ESLint integration is in the `eslint-plugin-react-hooks@6` recommended preset.

**Documentation source:** React versions page at `react.dev/versions`; React 19.0 blog post at `react.dev/blog/2024/12/05/react-19`; React 19.2 blog post at `react.dev/blog/2025/10/01/react-19-2`; React Compiler 1.0 at `react.dev/blog/2025/10/07/react-compiler-1`.

### Evidence: Ecosystem tooling facts

Checklist (yes/no + links):

- **React DevTools** (browser extension): YES — Chrome/Firefox/Edge. Shows component tree, props, state, hooks, context. Profiler with render-timing waterfall, "why did this render?" attribution, and (React 19.2+) Performance Tracks integration with Chrome DevTools' Scheduler and Components views. `https://react.dev/learn/react-developer-tools`

- **Test utilities**: YES — `@testing-library/react` (`https://testing-library.com/docs/react-testing-library/intro/`) is the ecosystem standard; wraps React's test renderer with a user-centric query API (`getByRole`, `findByText`, etc.). `react-dom/test-utils` (now officially deprecated in React 19, functionality migrated to `react-dom` directly). `vitest-browser-react` for Vitest browser-mode component testing. `Playwright` for E2E (component testing mode also available). Jest remains supported for React Native projects.

- **IDE / LSP support**: YES — VS Code with the TypeScript language service (built-in) provides autocomplete, type-error highlighting, and go-to-definition for all React APIs via `@types/react`. No React-specific LSP is needed; the TypeScript server handles JSX. The React DevTools browser extension integrates with the VS Code debugger. `eslint-plugin-react-hooks` (now at v6, shipped with React 19.2) provides IDE-integrated diagnostics for Rules of React violations and `useEffectEvent` correctness.

- **Build tooling / scaffolding**: YES — Vite (`@vitejs/plugin-react` or `@vitejs/plugin-react-swc`), Next.js, and Create React App (deprecated, succeeded by Vite-based workflows) are the primary build paths. The React docs now link to `vite.dev` and `nextjs.org` as the two recommended starting points. The React Compiler is distributed as `babel-plugin-react-compiler` and integrates with Vite, Next.js 15.3.1+, and Expo SDK 54+.

- **Error boundaries**: YES — class-component-based `componentDidCatch`/`getDerivedStateFromError` (React 16+); `react-error-boundary` npm package provides a function-component wrapper used universally in the ecosystem.

- **Devtools for server-side React**: YES — React's server rendering error messages have improved significantly in 19.x, including hydration diff output that shows the server-vs-client HTML mismatch. Performance Tracks in 19.2 cover server render timing.

**Overall tooling coverage is the strongest in the frontend framework corpus.** React's size and longevity means every major tool category has multiple mature solutions; the question is rarely "does tooling exist" but "which of the several mature options should I use."

---

## On the Horizon

### Next release

- **Name/version:** No announced version number; active development continues in the React 19.x patch/minor track.
- **Status:** null (no announced next major version as of 2026-06-08).
- **What's changing:** Partial Pre-rendering is in stable API (React 19.2) but the full production deployment story (Next.js PPR integration) is still maturing. `useEffectEvent` (19.2) solves a long-standing `useEffect` footgun. The `<Activity>` component enables pre-render patterns not previously possible. The React Compiler is stable and adoption is growing via Expo, Next.js, and Vite integrations.
- **Anticipated impact:** No paradigm changes. The Compiler's adoption trajectory is the biggest near-term impact — as it becomes the default in scaffolding tools, the `memo`/`useMemo`/`useCallback` boilerplate dimension of Token efficiency evidence will improve without any code changes. `useEffectEvent` reduces a major source of dependency-array footguns.
- **Stability penalty:** No — see Stability evidence. React's convention durability track record (3-year major version cadence, comprehensive codemods, long deprecation windows) is among the best in the corpus.

### AI-tooling investment

- **What exists:** React publishes a structured documentation index at `https://react.dev/llms.txt` — a Markdown table of contents linking every react.dev page in `.md` format, consumable by IDE agents (Cursor, Continue, Cline, etc.) that look for `llms.txt` at documentation roots. No official MCP server. No Boost-style curated AI guidelines package. No AI-specific style guide beyond the standard react.dev documentation. The `react.dev/llms.txt` approach is the standard `llms.txt` spec format (index linking to `.md` files), making it straightforwardly consumable by any agent toolchain that understands the spec.

- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter for the full before/after. Summary: loading `react.dev/llms.txt` context reduced one correction round-trip to zero — specifically, the model produced the React 19 `<Context>` (as provider, without `.Provider`) syntax on the first attempt rather than the deprecated `<Context.Provider>` form. The delta is real but narrow; it reflects the 18→19 idiom gap rather than any deep structural knowledge transfer. React is so thoroughly represented in LLM training data that the tooling's marginal contribution is small compared to what the model already knows. The `llms.txt` is most valuable for the minority of React 19-specific API changes (Actions, `use()`, `useEffectEvent`) where training-corpus coverage is thin.

---

## Anti-Patterns from Human-Era Thinking

- **`useEffect` as "component lifecycle."** The pre-hooks mental model maps `useEffect(fn, [])` to `componentDidMount`, `useEffect(fn, [dep])` to `componentDidUpdate`, and the cleanup to `componentWillUnmount`. This mapping is wrong enough to produce real bugs: `useEffect` is about synchronizing with external systems, not about component lifecycle. The React docs explicitly warn against this framing in the "You Might Not Need an Effect" section. An agent generating React code that patterns-matches on "fetch data on mount → useEffect with empty deps" is operating from the human-era mental model — the React 19 pattern is `use(promise)` + Suspense or a data-fetching library.

- **Manual `memo`/`useMemo`/`useCallback` as a habit.** Pre-Compiler React training established "wrap expensive computations in `useMemo`, wrap callbacks passed to memo'd children in `useCallback`" as a standard idiom. With React Compiler 1.0 now stable, manually adding these calls in new code is unnecessary boilerplate (and creates noise that makes the Compiler's own analysis less transparent). An agent that reflexively adds `useCallback` to every event handler is importing a 2019 idiom into 2026 code.

- **Prop drilling avoidance via excessive Context.** The human-era workaround for prop drilling (use Context for everything to avoid passing props) causes all Context consumers to re-render on every context value change. The 2026 pattern is: use Context for genuinely cross-cutting concerns (auth, theme, locale), use state libraries (Zustand, Jotai) for global mutable state, and accept moderate prop drilling for local feature state.

- **`forwardRef` and `useImperativeHandle` boilerplate.** React 19 allows `ref` as a regular prop; `forwardRef` is deprecated. An agent generating React 19 code should use `ref` directly, not wrap components in `forwardRef`.

## Transferable Patterns for Next-Gen Framework

- **`UI = f(state)` is the right mental model.** The declarative rendering contract — same state always produces same UI, framework handles the diff — is the foundational insight that makes React codebases readable and testable. A next-gen framework should preserve this, even if the implementation replaces virtual-DOM diffing with something more granular.

- **Hooks as collocated logic.** The ability to encapsulate state + effects + derived values in a named function (`useCart`, `useAuth`, `useIntersectionObserver`) that is co-located with its consumers (or in a shared file, by choice) is a genuine ergonomics win. The constraint (call order = identity) is the hook rules' load-bearing implementation detail — a next-gen framework that achieves the same colocation benefit without the call-order constraint would be a real improvement.

- **Actions as a state-update pattern.** React 19's `useActionState` wraps async mutations with automatic pending/error/optimistic state — the right abstraction for "user clicks button → server round-trip → UI reflects result." The pattern is good; the hook naming (`useActionState`, `useFormStatus`) is React-specific ceremony that could be unified in a more consistent API.

- **The Compiler's granular memoization is the right model.** Analyzing data-flow statically and emitting memoization only where it's profitable — rather than asking the developer to reason about it — is strictly better than both "no memoization" (performance problems) and "manual memoization everywhere" (boilerplate + incorrectness risk). A next-gen framework should make this the default compilation mode, not an opt-in.
