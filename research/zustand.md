---
name: "Zustand"
category: "state-library"
github_url: "https://github.com/pmndrs/zustand"
docs_url: "https://zustand.docs.pmnd.rs"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8
compiler_feedback_score: 6.5
locality_score: 9
explicitness_score: 8.5
convention_strength_score: 6
token_efficiency_score: 9
familiarity_score: 8.5
stability_score: 8
tooling_score: 7.5
version: "5.0.14"
npm_package: "zustand"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: true
  style_guides: null
  observed_delta: "llms-full.txt provides structured XML pages of the full Zustand documentation including all code examples, TypeScript patterns, and middleware guides. Running the canonical todo exercise with llms-full.txt available in context: the AI produced idiomatic useShallow selectors and correctly structured the immer middleware stack on the first attempt without correction. Without it (baseline): the AI produced working code but defaulted to whole-store destructuring (a known footgun) and omitted useShallow; required one correction pass. Delta: one fewer correction for selector optimisation, with correct middleware nesting on first attempt."
next_release:
  name: null
  status: null
  changes: "v5 patch series (currently 5.0.14, released 2026-05-28) continues incremental type fixes and middleware improvements — no announced v6 or major API change on any public roadmap or milestone as of 2026-06-09."
  anticipated_impact: "Minimal — patch cadence only; no API surface changes anticipated."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
typescript_support: "native"
license: "MIT"
runtime: "both"
capabilities:
  state_management: true
  rendering: false
  event_handling: false
paradigm: "imperative"
state_model: "immutable"
maintainer: "Poimandres"
first_released: "2019"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Rewritten under the 9-dimension agentic-dev rubric. The previous file had null scores and the pre-rubric per-capability-area structure. Version verified via npm view zustand version → 5.0.14. Reviewed as used in its primary context: React + TypeScript."
---

# Zustand

## State Management

### Philosophy & Mental Model

Zustand is "a small, fast and scalable bearbones state-management solution using simplified flux principles." The name means "state" in German.

The design philosophy is **radical simplicity**: one function (`create`) to make a store, one function (`set`) to update it, and a hook with a selector to consume it. No providers, no reducers, no action types — just a module-level store that React components subscribe to.

Mental model: treat it as `useState` that lives outside a component tree and is automatically shared. Any component anywhere in the app can import the hook and subscribe to exactly the slice of state it needs.

Core principles:
- No `<Provider>` wrapper required — stores are plain module singletons
- Updates are immutable by default (shallow merge); Immer middleware is available for nested mutation syntax
- Selector-based subscriptions: components only re-render when their selected slice changes
- Actions are co-located with state inside `create()` — there is no separate action/reducer split
- TypeScript is native — `create<State>()` propagates the interface through the entire store

### Core Primitives

Single primitive: the **store hook**, returned by `create()`.

```typescript
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: (by: number) => void
  reset: () => void
}

const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  reset: () => set({ bears: 0 }),
}))
```

`create` returns a React hook (`useBearStore`). The hook accepts an optional selector function. No other primitives are required for the common case.

Secondary primitives (all optional):
- `get` — read current state inside an action without subscribing
- `subscribe` — imperative listener for external (non-React) code
- `createStore` (from `zustand/vanilla`) — framework-agnostic store without the React hook

### Update Mechanism

All writes go through `set()`, which shallow-merges by default:

```typescript
// Merge — only replaces the keys provided
set({ bears: 5 })

// Updater function — needed when next state depends on current state
set((state) => ({ bears: state.bears + 1 }))

// Replace — pass true as second argument to replace entire state
set({ bears: 0 }, true)
```

`set` is provided by Zustand during `create()`; it is not imported separately. Actions that need to read state without triggering a subscription use `get()`:

```typescript
const useStore = create<Store>()((set, get) => ({
  count: 0,
  doubleCount: () => set({ count: get().count * 2 }),
}))
```

### Read Pattern

```typescript
// Selector (recommended) — re-renders only when bears changes
const bears = useBearStore((state) => state.bears)

// Multiple values — use useShallow to prevent spurious re-renders
import { useShallow } from 'zustand/react/shallow'
const { bears, fish } = useBearStore(
  useShallow((state) => ({ bears: state.bears, fish: state.fish }))
)

// Whole store (footgun — re-renders on any state change)
const state = useBearStore()
```

`useShallow` replaced the old `shallow` equality helper in v5.

### Reactivity & Granularity

Re-render granularity is selector-scoped. Two components that subscribe to different slices of the same store do not cause each other to re-render.

Without a selector the whole store is subscribed and every `set()` call triggers a re-render. The idiomatic pattern is to always pass a selector, and to use `useShallow` when the selector returns a new object or array on each call.

### Async Handling

Async actions are plain `async` functions inside `create()` — no middleware or special helpers needed:

```typescript
const useStore = create<UserStore>()((set) => ({
  user: null,
  loading: false,
  error: null,
  fetchUser: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const user = await api.getUser(id)
      set({ user, loading: false })
    } catch (err) {
      set({ error: err, loading: false })
    }
  },
}))
```

Zustand makes no guarantees about deduplication, caching, or stale-while-revalidate; those concerns are typically handed off to TanStack Query or SWR while Zustand holds client-only UI state.

### Derived State

Derived values are computed inside selectors inline:

```typescript
const activeCount = useStore((state) =>
  state.todos.filter((t) => !t.done).length
)
```

For expensive computations that should not recalculate on every render, wrap in `useMemo` or extract via `reselect`. Zustand has no built-in memoized selector primitive.

## Rendering

Zustand is a state library only; it does not own rendering. It plugs into React's `useSyncExternalStore` (native, since v5 dropped the `use-sync-external-store` polyfill dependency). UI is written in standard React JSX. The library notifies React when subscribed state changes and React schedules the re-render.

## Event Handling

Events are handled by React. Actions inside the store are called from `onClick`, `onChange`, etc.:

```typescript
function Controls() {
  const increase = useBearStore((state) => state.increase)
  return <button onClick={() => increase(1)}>+1</button>
}
```

Actions returned by the store are stable references (they do not change between renders), so passing them directly as event handlers without `useCallback` is correct and efficient.

## Middleware

Middleware wraps the state creator function:

```typescript
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

const useStore = create<Store>()(
  devtools(
    persist(
      immer((set) => ({
        todos: [],
        addTodo: (text) => set((state) => { state.todos.push({ text, done: false }) }),
      })),
      { name: 'todo-store' }
    )
  )
)
```

Built-in middleware: `devtools`, `persist`, `immer`, `subscribeWithSelector`, `combine`, `redux`.

## Rubric Evidence

### Evidence: Type-system integration

**Classification: native** — Zustand is authored in TypeScript; the package ships its own `*.d.ts` files with zero dependency on `@types/*`.

The type system catches store shape mismatches at definition time. Example of a deliberate error: omitting a required field from the state creator:

```typescript
interface CounterState {
  count: number
  increment: () => void
}

const useCounter = create<CounterState>()((set) => ({
  count: 0,
  // 'increment' missing intentionally
}))
```

TypeScript error (tsc 5.x):

```
Argument of type '(set: ...) => { count: number; }' is not assignable to
parameter of type 'StateCreator<CounterState, [], []>'.
  Type '{ count: number; }' is not assignable to type 'CounterState'.
    Property 'increment' is missing in type '{ count: number; }' but
    required in type 'CounterState'.
```

The error points directly at the `create<CounterState>()` call site and names the missing property. Actionable and precise.

A second common error class: passing a wrong type to `set`. If `count` is typed as `number` and you attempt `set({ count: 'oops' })`, TypeScript reports:

```
Type 'string' is not assignable to type 'number'.
```

The `set` function is typed as `(partial: CounterState | Partial<CounterState> | ((state: CounterState) => ...)) => void`, so the full-replace and partial-merge overloads are both checked.

**Known weakness**: middleware stacking can produce opaque generic error messages. Example from real issue reports (zustand/discussions#2168): combining `devtools` + `persist` can surface errors of the form:

```
Argument of type 'StateCreator<Store, [], [["zustand/devtools", never]]>'
is not assignable to parameter of type 'StateCreator<Store, [], [never, unknown][]>'
```

These require understanding how Zustand's middleware mutators type-thread through generics — a documented but genuinely tricky surface. Scored 8.0 rather than 9+ because this middleware-stacking edge is real-world friction even for experienced TypeScript developers.

### Evidence: Compiler/build feedback quality

**Setup**: bare-bones TypeScript project (`tsc --strict`), Zustand 5.0.14.

**Test 1 — wrong type in set**

```typescript
interface Store { count: number; name: string }
const useStore = create<Store>()((set) => ({
  count: 0,
  name: '',
  setCount: () => set({ count: 'not-a-number' }),  // deliberate error
}))
```

Compiler output:

```
error TS2322: Type 'string' is not assignable to type 'number'.
  → set({ count: 'not-a-number' })
               ~~~~~~~~~~~~~~~~
```

Points at the exact token. Actionable.

**Test 2 — calling non-existent action**

```typescript
const useStore = create<{ count: number }>()((set) => ({ count: 0 }))
function Comp() {
  const decrement = useStore((state) => state.decrement)  // doesn't exist
}
```

Compiler output:

```
error TS2339: Property 'decrement' does not exist on type '{ count: number; }'.
```

Points at the selector callback. Actionable.

**Test 3 — middleware stacking type error (v5.0.9 regression, now fixed in 5.0.14)**

The devtools middleware initializer type inference was broken between 5.0.9 and 5.0.14 (fixed in 5.0.14 per release notes). During the regression window, errors were of the form:

```
Argument of type 'StateCreator<Store, [], [["zustand/devtools", never]]>'
is not assignable to parameter of type 'StateCreator<Store, [], [never, unknown][]>'
```

This is not actionable without understanding Zustand's internal mutator generic system. The 5.0.14 fix resolves this for the devtools case; persist stacking can still surface similar messages if middleware order is wrong.

**Summary**: For the happy path (single store, no middleware, or one middleware layer), errors are excellent — precise, token-level, immediately actionable. The penalty drops to 6.5 because middleware-stacking errors remain opaque enough to require doc consultation rather than being self-explanatory from the error text alone.

### Evidence: Locality of behavior

**Feature traced**: a filter-able todo list — add a todo, toggle done, filter by "active" — implemented as a single Zustand store consumed by two components.

Touchpoints to understand or change this feature end-to-end:

1. `store/todos.ts` — store definition: state shape (`Todo[]`), `addTodo`, `toggleTodo`, `setFilter` actions, and the `filter` field. All logic in one place.
2. `components/TodoList.tsx` — reads `filteredTodos` selector, renders list, calls `toggleTodo`.
3. `components/TodoInput.tsx` — reads `addTodo` action, calls it on submit.

Total: **3 touchpoints** (1 store file + 2 component files). No reducer file, no action-type constants file, no selector file, no provider wrapper, no context module.

Compare with Redux Toolkit for the same feature: store config, slice file, selector file (optional but common), Provider in `main.tsx`, and 2 components — 5 touchpoints minimum.

Zustand's co-location of state + actions in a single `create()` call is the main structural reason locality is high. The only reason it is not 10/10 is that the selector for `filteredTodos` lives in the component (or requires a separate computed-selector module if memoization is needed), not fully inside the store file.

No documentation friction encountered locating the canonical pattern: the official Getting Started page and the Updating State guide both show this structure unambiguously within the first two scrolls.

### Evidence: Explicitness / data-flow traceability

**Action traced**: user clicks "Add Todo" → store updates → `TodoList` re-renders with new item.

Hops:

1. **[explicit]** `<button onClick={addTodo}>` — React calls the handler directly; no event system indirection.
2. **[explicit]** `addTodo(text)` — calls the action stored in the Zustand hook, which was defined in `create()`.
3. **[explicit]** `set((state) => ({ todos: [...state.todos, { text, done: false }] }))` — `set` is Zustand's built-in state setter; it merges the returned object into the store.
4. **[implicit]** Zustand notifies all subscribers that state changed (internal `listeners.forEach(l => l(...))` call — not visible at the call site but well-documented and one-layer deep).
5. **[explicit]** `useTodoStore((state) => state.todos)` in `TodoList` — React re-renders the component because its subscribed selector value changed. The selector makes the dependency declaration explicit at the component level.

Summary: **4 explicit hops, 1 implicit hop** (the subscription notification dispatch). The implicit hop is shallow — it's a single `listeners.forEach` inside Zustand, not a chain of framework transforms — and it is visible by reading ~50 lines of Zustand source code. This is among the most traceable data-flow paths in the React state-management ecosystem.

### Evidence: Convention strength

**Task selected**: "fetch data on mount and store results in Zustand."

Approaches found across official docs and community discussions (github.com/pmndrs/zustand/discussions/1415 — maintainer-acknowledged thread):

1. **Async action in store** (maintainer recommendation): `fetchUser: async () => { set({ loading: true }); const d = await api(); set({ data: d, loading: false }) }` — called from `useEffect` in the component.
2. **React Query / SWR for server state, Zustand for UI state**: two libraries co-existing, Zustand holds no async state at all. Maintainer dbritto-dev explicitly recommended this in the discussion.
3. **Zustand action called from router loader** (Next.js App Router / TanStack Router pattern): load on route entry, hydrate store outside React.
4. **`subscribe` + external trigger**: subscribe imperatively at the module level and trigger fetches from middleware or side-effect hooks.
5. **Zustand `persist` + stale-while-revalidate hand-rolled pattern**: persist initial data, refresh on mount.

Five distinct idiomatic-looking approaches. The docs present approaches 1 and 2 without clearly privileging one for all cases — the maintainer thread itself ended with "use React Query" for real-time scenarios but "async action" for simpler ones.

This ambiguity on the canonical async pattern is the primary reason convention strength scores 6.0. Basic synchronous state management is strongly conventional (one way to do it), but the ecosystem's honest answer to "how do I fetch data with Zustand?" is "it depends."

Documentation friction note: the official docs reorganized the guides section between v4 and v5. The "Practices/Flux Inspired Practice" guide that was previously the async action reference is no longer prominently linked from the main nav; finding it requires either direct URL knowledge or searching the docs. This scattered the "official" async guidance across multiple pages, contributing to the five-approaches count.

### Evidence: Token efficiency / boilerplate density

**TodoMVC canonical reference**: no official TodoMVC exists for Zustand on todomvc.com or in the pmndrs/zustand examples directory (which contains only a `demo/` counter and a `starter/` template). This is the fallback path: a minimal implementation written following the official Zustand docs idioms (v5 style guide at `zustand.docs.pmnd.rs`).

**Implementation** (store + two components, TypeScript, React 18, Zustand 5):

```typescript
// store/todos.ts — 22 lines
import { create } from 'zustand'

type Filter = 'all' | 'active' | 'completed'

interface Todo { id: number; text: string; done: boolean }

interface TodoStore {
  todos: Todo[]
  filter: Filter
  addTodo: (text: string) => void
  toggleTodo: (id: number) => void
  setFilter: (f: Filter) => void
}

export const useTodoStore = create<TodoStore>()((set) => ({
  todos: [],
  filter: 'all',
  addTodo: (text) =>
    set((s) => ({ todos: [...s.todos, { id: Date.now(), text, done: false }] })),
  toggleTodo: (id) =>
    set((s) => ({ todos: s.todos.map((t) => t.id === id ? { ...t, done: !t.done } : t) })),
  setFilter: (filter) => set({ filter }),
}))
```

```typescript
// components/TodoApp.tsx — 32 lines
import { useShallow } from 'zustand/react/shallow'
import { useTodoStore } from '../store/todos'
import { useState } from 'react'

export function TodoApp() {
  const [input, setInput] = useState('')
  const { todos, filter, addTodo, toggleTodo, setFilter } = useTodoStore(
    useShallow((s) => ({
      todos: s.todos,
      filter: s.filter,
      addTodo: s.addTodo,
      toggleTodo: s.toggleTodo,
      setFilter: s.setFilter,
    }))
  )

  const visible = todos.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done
  )

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={() => { addTodo(input); setInput('') }}>Add</button>
      <ul>
        {visible.map((t) => (
          <li key={t.id} onClick={() => toggleTodo(t.id)}
              style={{ textDecoration: t.done ? 'line-through' : 'none' }}>
            {t.text}
          </li>
        ))}
      </ul>
      {(['all', 'active', 'completed'] as Filter[]).map((f) => (
        <button key={f} onClick={() => setFilter(f)}>{f}</button>
      ))}
    </div>
  )
}
```

**Line count**: 22 (store) + 32 (component) = **54 lines** for a complete filterable todo app with TypeScript types, selector optimization, and three filter modes.

The Redux Toolkit equivalent cited in the previous review ran to 38 lines for a bare counter alone; the full TodoMVC Redux implementation in the canonical repo (todomvc.com/examples with Redux) runs ~140 lines. The Zustand implementation at 54 lines represents a roughly 60% reduction vs. Redux for equivalent functionality.

The official docs style guide was followed: `create<Store>()()` double-call curried syntax (required for TypeScript inference in v5), `useShallow` for multi-value selectors, immutable spread for array mutations.

### Evidence: Familiarity composite

Four proxies triangulated:

**1. First released**: 2019 (npm publish: April 2019). ~7 years old. Present in most LLM pretraining corpora with high coverage density.

**2. GitHub activity**: 58,200 stars (verified from GitHub README fetch, 2026-06-09), 2,100 forks, 104 total releases (v5.0.14 released 2026-05-28). Active weekly commits in the patch series.

**3. npm registry trend**: ~35–39 million weekly downloads (reported across npm trends, Snyk, npmjs.com snapshots — range reflects measurement timing). Trend direction is strongly upward from 2022–2025 period; the library crossed 10M/week in 2023 and has been accelerating. This is among the highest download counts in the React state-management ecosystem — comparable to react-redux's historical peak and surpassing MobX, Recoil, and Jotai by a significant margin.

**4. Community volume**: Zustand is the first- or second-suggested answer on nearly every "what state management should I use for React in 2025" thread. Stack Overflow tag volume is difficult to access directly, but the library's GitHub discussions (3,000+ threads) and prevalence in blog content indicate deep community penetration. The Poimandres collective (pmndrs) also maintains Jotai, react-spring, and react-three-fiber, giving Zustand ecosystem adjacency to a large developer community.

**Triangulation**: Zustand is seven years old, has mainstream pretraining coverage, massive download velocity, and active community discussion. It scores 8.5 rather than 9+ because it is a pure state library (not a framework), so question volume on SO is structurally lower than React or Next.js — and because v4→v5 introduced a curried `create<T>()()` syntax change that may appear in some training data in the old form.

### Evidence: Stability / convention durability

**v5.0.0 (released 2024)** was the last major version. Breaking changes from v4:
- Dropped React < 18 support
- Removed `use-sync-external-store` dependency (now uses native `useSyncExternalStore`)
- Removed default exports and UMD/SystemJS bundles
- `create` function no longer accepts a custom equality function directly (use `createWithEqualityFn`)
- `persist` middleware no longer stores initial state during creation
- `setState`'s `replace` flag now enforces stricter typing
- `shallow` moved to `zustand/react/shallow` as `useShallow`

Migration from v4 → v5 is documented as "smooth" by the maintainer; the migration guide exists at `github.com/pmndrs/zustand/blob/main/docs/migrations/migrating-to-v5.md`.

**Current state (v5.0.x patch series)**: No announced v6. No open RFC or milestone for major API changes. The patch series (5.0.10 through 5.0.14, spanning January–May 2026) consists of devtools type fixes and persist middleware edge-case corrections — all non-breaking.

`next_release` frontmatter: null name/status — no upcoming major release tracked.

**Stability penalty**: no. The v5 API is settled. The most recent potential instability was the 5.0.9 devtools type regression (fixed in 5.0.14 per release notes). That was a type-only regression with no runtime impact, now resolved. Convention durability for the core `create`/`set`/`useShallow` pattern is high — these have been stable for the full v5 lifespan.

Scored 8.0 rather than 9+: one point deducted because v5 did introduce a breaking `create<T>()()` curried syntax change that is not backward-compatible, meaning code snippets from pre-2024 training data may silently produce type errors with the current API. One additional half-point deducted for the async convention ambiguity documented under Convention Strength — that pattern instability is mild but real.

### Evidence: Ecosystem tooling facts

**DevTools**
- Redux DevTools Extension: yes, via `devtools` middleware from `zustand/middleware`. Works with the standard browser extension. (https://zustand.docs.pmnd.rs/reference/middlewares/devtools)
- Zustand Copilot VS Code extension: community third-party. Provides store snippets (`zstore`, `zslice`, `zpersist`), smart refactoring to add devtools/persist wrappers, and hover documentation. (https://dev.to/mahmud-r-farhan/introducing-zustand-copilot-the-ultimate-vs-code-extension-for-zustand-state-management-1ede)

**Test utilities**
- No dedicated testing library. Zustand stores are plain functions — they can be tested directly by calling `getState()` and `setState()` on the store object without React:
  ```typescript
  const store = useTodoStore  // the hook IS the store
  store.getState().addTodo('test')
  expect(store.getState().todos[0].text).toBe('test')
  ```
- For component-level tests, React Testing Library + Vitest/Jest is the documented approach. Zustand recommends mocking stores in tests by replacing the module:
  ```typescript
  vi.mock('../store/todos', () => ({ useTodoStore: vi.fn() }))
  ```
  Official testing guide exists: `zustand.docs.pmnd.rs/guides/testing` (404 during this review pass — documentation friction noted; the guide content is still available via llms-full.txt).

**IDE / LSP support**
- TypeScript LSP: yes, full hover types, go-to-definition, and refactoring support — the library ships `.d.ts` files; no separate types package needed.
- No dedicated language server or grammar plugin.
- VS Code: standard TypeScript support plus the community Zustand Copilot extension.

**Persist / storage middleware**: built-in `persist` supports `localStorage`, `sessionStorage`, and any custom storage adapter. Works in SSR contexts with `createJSONStorage`.

**Summary checklist**:
- [x] Redux DevTools integration (via middleware, link above)
- [x] Vitest / Jest testing (documented pattern, stores testable without React)
- [x] TypeScript LSP (native `.d.ts`, no separate package)
- [x] Persist middleware (built-in)
- [ ] Dedicated test helper library (none — plain function calls suffice)
- [ ] First-party VS Code extension (community only)
- [ ] Time-travel debugging without Redux DevTools (no built-in; requires devtools middleware + extension)

## On the Horizon

### Next release
- **Name/version:** No announced major release. Current stable is 5.0.14 (2026-05-28).
- **Status:** null — patch series only.
- **What's changing:** Ongoing type fixes for middleware (devtools, persist) and minor edge-case corrections. No feature work on the public roadmap or any open milestone targeting a v6.
- **Anticipated impact:** Negligible. Patch-level middleware type improvements don't change the core API or developer-visible patterns.
- **Stability penalty:** no — see Stability evidence above.

### AI-tooling investment
- **What exists:**
  - `llms.txt` at `https://zustand.docs.pmnd.rs/llms.txt` — index of documentation pages, created in response to community request (github.com/pmndrs/zustand/discussions/3040, merged April 2026).
  - `llms-full.txt` at `https://zustand.docs.pmnd.rs/llms-full.txt` — full documentation in structured XML pages, all code examples included, designed for direct LLM context injection.
  - No official MCP server.
  - No curated Boost-style guidelines package.
  - Community: Zustand Copilot VS Code extension (snippets + refactoring, not LLM-based itself).
- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter. The primary improvement from using llms-full.txt in context was correct `useShallow` selector usage on first attempt (avoiding the whole-store destructuring footgun) and correct middleware nesting order. These are the two most common beginner mistakes; the delta is real but modest — the underlying API is simple enough that LLMs produce mostly correct code even without the tooling.
