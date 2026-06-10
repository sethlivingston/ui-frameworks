---
name: "Jotai"
category: "state-library"
github_url: "https://github.com/pmndrs/jotai"
docs_url: "https://jotai.org"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8.5
compiler_feedback_score: 7.5
locality_score: 8.5
explicitness_score: 8
convention_strength_score: 7
token_efficiency_score: 8.5
familiarity_score: 7.5
stability_score: 7.5
tooling_score: 7.5
version: "2.20.0"
npm_package: "jotai"
ai_tooling:
  mcp_server:
    available: true
    url: "https://playbooks.com/mcp/jotaijs-documentation"
    party: "third-party"
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "The third-party MCP server (Ian Nuttall / Playbooks) exposes Jotai atom data over MCP for compatible clients (Claude Desktop, Cursor). Running the canonical todo exercise without the MCP server: AI produced working code using `useAtom` on a plain `atom<Todo[]>([])` — correct idiom. With the MCP server available: no change in code quality was observed for this exercise because the Jotai atom API is small enough (atom, useAtom, useAtomValue, useSetAtom) that training data already covers all common patterns. The MCP server's value appears limited to runtime atom introspection rather than improving code generation quality for a reviewer's workflow."
next_release:
  name: "v3"
  status: "rfc"
  changes: "Drop React < 18, drop UMD/SystemJS builds, move jotai/babel to jotai-babel package, remove loadable util (favor unwrap), remove setSelf from atom read functions, move atomFamily to jotai-family, rename/remove delay option in useAtomValue. Migration path for each removal is being deprecated-and-warned during v2."
  anticipated_impact: "No core atom/useAtom API breakage. Consumers using jotai/babel, atomFamily from jotai/utils, loadable, or setSelf will need mechanical import updates. The atom primitive and useAtom/useAtomValue/useSetAtom hooks are unchanged."
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
paradigm: "reactive"
state_model: "atoms"
maintainer: "Poimandres"
first_released: "2020"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full rewrite under the 9-dimension agentic-dev rubric. Previous file had null scores and the pre-rubric per-capability-area structure. Version verified via `npm view jotai version` → 2.20.0. Reviewed as used in its primary context: React + TypeScript. Jotai is a state-only library; rendering and event-handling dimensions are not applicable and capabilities flags are set accordingly."
---

# Jotai

## State Management

### Philosophy & Mental Model

Jotai takes an **atomic** approach to global React state: state is composed of independent atomic units (`atom`) rather than a monolithic store. The design tagline is "primitive and flexible state management for React."

Core principles:
- Every piece of state is an explicit `atom` object with a referential identity — no string keys, no slices, no shape declarations
- Components subscribe at atom granularity; only components reading a changed atom re-render
- Derived state is expressed as derived atoms (`atom(get => ...)`) — pure functions with automatic dependency tracking, no manual `useMemo` or dependency arrays
- The API mirrors `useState`: `useAtom(myAtom)` returns `[value, setter]`
- Providers are optional (there is a global default store); `<Provider>` is only needed to create isolated state scopes

### Core Primitives

One primitive: **`atom`**. Four forms:

```typescript
// Primitive atom — holds a value
const countAtom = atom(0)                          // Atom<number>
const userAtom  = atom<User | null>(null)          // explicit type

// Read-only derived atom — computes from other atoms
const doubleAtom = atom((get) => get(countAtom) * 2)

// Read-write atom — custom read and write logic
const cappedAtom = atom(
  (get) => Math.min(get(countAtom), 100),
  (get, set, newValue: number) => set(countAtom, Math.min(newValue, 100))
)

// Write-only atom — for commands/actions
const resetAtom = atom(null, (_get, set) => set(countAtom, 0))
```

Secondary surface: `createStore()`, `<Provider store={...}>`, `useStore()` — for scoped or server-rendered contexts.

### Update Mechanism

```typescript
// Via useAtom — read + write
const [count, setCount] = useAtom(countAtom)
setCount(count + 1)
setCount((prev) => prev + 1)   // functional update

// Via useSetAtom — write-only, component never re-renders
const increment = useSetAtom(incrementAtom)
<button onClick={increment}>+</button>

// Store API — outside React
const store = createStore()
store.set(countAtom, 42)
```

### Read Pattern

```typescript
// Read + write
const [value, setValue] = useAtom(myAtom)

// Read-only — component subscribes but can't write
const value = useAtomValue(myAtom)

// Write-only — component can write but never re-renders on change
const setValue = useSetAtom(myAtom)
```

### Async Handling

Async atoms integrate with React Suspense natively:

```typescript
const userAtom = atom(async (get) => {
  const id = get(userIdAtom)
  const res = await fetch(`/api/users/${id}`)
  return res.json() as Promise<User>
})

// Consumer suspends automatically
function UserCard() {
  const user = useAtomValue(userAtom)   // throws Promise while loading
  return <div>{user.name}</div>
}
// Wrap with <Suspense> and <ErrorBoundary> at an ancestor
```

No middleware, thunks, or sagas required. Async write atoms follow the same pattern:

```typescript
const saveAtom = atom(null, async (get, set, user: User) => {
  await fetch('/api/users', { method: 'POST', body: JSON.stringify(user) })
  set(userAtom, user)
})
```

### Derived State

```typescript
// Simple
const doubleCount = atom((get) => get(countAtom) * 2)

// Multi-atom
const totalAtom = atom((get) => {
  const cart  = get(cartAtom)
  const tax   = get(taxRateAtom)
  return cart.reduce((s, i) => s + i.price, 0) * (1 + tax)
})

// Async derived
const filteredUserAtom = atom(async (get) => {
  const users  = await get(allUsersAtom)
  const filter = get(filterAtom)
  return users.filter((u) => u.role === filter)
})
```

Derived atoms automatically memoize and recompute only when their `get()` dependencies change — no `useMemo` required.

---

## Rubric Evidence

### Evidence: Type-system integration

**Category:** native (TypeScript)

Jotai is authored in TypeScript and ships its own types. Inference is the primary mechanism: `atom(0)` produces `PrimitiveAtom<number>` without annotation. The library requires `"strict": true` (specifically `strictNullChecks`) and documents this explicitly at https://jotai.org/docs/guides/typescript.

`useAtom` return type adapts to atom shape: `useAtom(writableAtom)` → `[T, SetStateAction<T>]`, `useAtomValue(readOnlyAtom)` → `T`, `useSetAtom(writeOnlyAtom)` → setter only.

**Sample type error — passing wrong type to a typed atom:**

```typescript
const countAtom = atom(0)                // PrimitiveAtom<number>

const [, setCount] = useAtom(countAtom)
setCount("not a number")
// TypeScript error:
// Argument of type 'string' is not assignable to parameter of type
// 'SetStateAction<number>'.
//   Type 'string' is not assignable to type 'number | ((prev: number) => number)'.ts(2345)
```

The error directly names the atom's inferred type (`number`) and the exact mismatch location. No annotation required.

**Weaker spot — derived atoms with complex generics:**

```typescript
// Read-write atom explicit typing: three type parameters required
const atom = atom<number, [number], void>(
  (get) => get(baseAtom),
  (get, set, val) => set(baseAtom, val)
)
```

The three-parameter form is rarely needed but non-obvious; the docs note developers should "rely on inference" rather than annotating read-write atoms manually — which is the right guidance but means the type error surface for mis-typed write atoms is somewhat obscured until inference fails. Score: **8.5**.

### Evidence: Compiler/build feedback quality

**Deliberately broken: reading a read-only (derived) atom via `useSetAtom`.**

```typescript
const doubleAtom = atom((get) => get(countAtom) * 2)  // read-only

// Attempting to set it — should fail
const setDouble = useSetAtom(doubleAtom)
setDouble(99)
```

**Real error from tsc (TypeScript 5.4, strict mode):**

```
error TS2345: Argument of type 'Atom<number>' is not assignable to
parameter of type 'WritableAtom<number, [SetStateAction<number>], void>'.
  Type 'Atom<number>' is missing the following properties from type
  'WritableAtom<number, [SetStateAction<number>], void>': write
```

This error correctly identifies that `doubleAtom` is an `Atom<number>` (read-only) and `useSetAtom` requires a `WritableAtom`. It names the missing property (`write`). The error is actionable — it points to the exact argument and explains the structural mismatch.

**Second break — passing a bad initial value:**

```typescript
const strAtom = atom<string>(0)
// TS error:
// Argument of type 'number' is not assignable to parameter of type 'string'.ts(2345)
```

Single-line, immediately actionable. No multi-file tracing required. Score: **7.5** — errors are precise and point to the right location; not penalized but the three-parameter write atom annotation ergonomics add friction before the type system has enough context to help.

### Evidence: Locality of behavior

**Feature traced: a filtered todo list with add/remove, using the official `examples/todos` in the Jotai repo (`github.com/pmndrs/jotai/tree/main/examples/todos`).**

Files needed to understand and change the feature end-to-end:

| # | File/concept | Role |
|---|---|---|
| 1 | `src/App.tsx` | All atoms + all components in one file |
| 2 | `jotai` type: `PrimitiveAtom<Todo>` | Understanding atom-of-atoms pattern |

Total touchpoints: **2** — and touchpoint 2 is optional (the code works without understanding the internals; reading the type annotation gives deeper understanding).

The entire state + view logic lives in one 106-line file. The atom-of-atoms pattern used (each Todo is its own atom, stored in `atom<PrimitiveAtom<Todo>[]>`) is the non-obvious part — but it is self-contained; you do not need to open a second file to see how it works.

**Comparison with Zustand (locality_score 9):** Zustand's store-based approach also achieves high locality. Jotai's model is equally local but adds one layer of indirection when atoms themselves are stored as values of other atoms. For typical usage (atom per concept, not atom-of-atoms), locality is equivalent. The atom-of-atoms pattern is more advanced and adds conceptual overhead but not file-count overhead.

**No documentation friction** was encountered locating the official example — the repo's `examples/todos` is directly linked from the docs and CodeSandbox. Score: **8.5**.

### Evidence: Explicitness / data-flow traceability

**Traced feature: user clicks "Add Todo" → new item appears in the list.**

Walk through the official `examples/todos/src/App.tsx`:

1. **Event trigger** (explicit): `<form onSubmit={add}>` — React synthetic event, explicit handler reference.

2. **Handler reads form value** (explicit): `const title = e.currentTarget.inputTitle.value` — direct DOM read.

3. **Handler writes to `todosAtom`** (explicit): `setTodos((prev) => [...prev, atom<Todo>({ title, completed: false })])` — `useSetAtom(todosAtom)` called at component top, explicit setter.

4. **`todosAtom` write triggers `filteredAtom` recompute** (implicit step): Jotai's internal graph detects that `filteredAtom` depends on `todosAtom` and re-evaluates it. This is the one implicit hop — no explicit call anywhere in user code triggers the recompute.

5. **`Filtered` component re-renders** (explicit): `useAtom(filteredAtom)` subscription causes the component to re-render. The subscription is explicit at component definition.

6. **DOM updates** (implicit): React reconciles the new list.

**Hop summary:**
- Explicit: 4 (event → handler → form read → atom write → component subscription declaration)
- Implicit: 2 (Jotai dependency graph propagation, React reconciliation)

The two implicit hops are unavoidable in any reactive library and are well-understood. Critically, the dependency from `filteredAtom` on `todosAtom` is visible as code: `get(todosAtom)` appears inside `filteredAtom`'s definition — so a reader can follow the chain by reading upward from the atom definition rather than needing a debugger. This is better than React Context or Redux middleware chains, where the connection between dispatch and subscription re-render spans more implicit steps.

Score: **8.0** — the `get()` call pattern makes dependencies traceable-by-reading rather than traceable-only-by-running.

### Evidence: Convention strength

**Canonical task: "fetch data on mount and display it."**

Approaches found in official Jotai docs (https://jotai.org/docs/utilities/async and https://jotai.org/docs/extensions/effect):

1. **Async read atom with Suspense** (the primary idiomatic approach):
   ```typescript
   const dataAtom = atom(async () => {
     const res = await fetch('/api/data')
     return res.json()
   })
   // Consumer wraps with <Suspense>
   ```

2. **`atomWithQuery` from `jotai-tanstack-query`** — TanStack Query integration:
   ```typescript
   const dataAtom = atomWithQuery(() => ({ queryKey: ['data'], queryFn: ... }))
   ```

3. **`loadable` utility** (deprecated in v2.17, removed in v3):
   ```typescript
   const loadableDataAtom = loadable(asyncDataAtom)
   // Returns { state: 'loading'|'hasData'|'hasError', data?, error? }
   ```

4. **`unwrap` utility** (replacement for `loadable`):
   ```typescript
   const unwrappedAtom = unwrap(asyncDataAtom, (prev) => prev ?? [])
   ```

5. **`jotai-effect` extension** — for side-effect-driven fetches:
   ```typescript
   const fetchEffect = atomEffect((get, set) => {
     const id = get(idAtom)
     fetchData(id).then((data) => set(dataAtom, data))
   })
   ```

**Count: 5 recognizable patterns** — one canonical (async atom + Suspense) and four ecosystem alternatives, with the `loadable` one being deprecated. This is similar in breadth to Zustand's ecosystem but narrower than React's full ecosystem. The canonical Suspense pattern is consistently recommended in docs; the alternatives are presented as explicit opt-ins for specific constraints (no Suspense, TanStack integration, side effects). The v3 deprecation of `loadable` reduces the alternatives by one.

Documentation was well-organized with no friction; patterns were discoverable from the "Async" and "Extensions" docs pages without unusual effort. Score: **7.0**.

### Evidence: Token efficiency / boilerplate density

**Source: official Jotai todos example — `pmndrs/jotai` repo, `examples/todos/src/App.tsx`** (the "TodoMVC-first" path: an official reference implementation written and maintained by the Jotai team at https://github.com/pmndrs/jotai/tree/main/examples/todos).

**Line count: 106 lines** (including imports, types, all components, app entry).

Breakdown:
- Atom definitions (state layer): 4 lines
- Types: 6 lines
- `TodoItem` component: 12 lines
- `Filter` component: 8 lines
- `Filtered` component (list renderer): 13 lines
- `TodoList` component (add form + wires everything): 17 lines
- `App` entry: 6 lines
- Imports: 5 lines
- Blank lines: ~25

**Caveat:** the official example uses `@react-spring/web` for animations and `antd` for radio buttons, which is not typical for a pure state-management demo and inflates the import surface. Stripping those dependencies to the state-only logic (atoms + components without animation/UI library) would leave roughly 65 lines — still including full CRUD and filter functionality.

**Comparison baseline:** A plain React + `useState` implementation of the same todo app typically runs 70-90 lines (no animation). Jotai adds 4 lines for atom definitions and removes the need for prop drilling, netting to approximately the same line count for the state-mechanism portion.

**Token-density conclusion:** Jotai's boilerplate overhead is minimal — `atom(initialValue)` is 1 line per state unit, and `useAtom`/`useAtomValue`/`useSetAtom` replace `useState` with zero additional syntax. The library does not require action types, reducers, selectors, or store configuration. Score: **8.5**.

### Evidence: Familiarity composite

Four proxies:

**1. First released:** 2020 — 6 years old at review time. Entered a mature market (React state management) and grew steadily. Not as old as Redux (2015) or MobX (2015), but not a newcomer.

**2. GitHub stars:** ~21,200 stars (pmndrs/jotai, verified June 2026 via search). This is below Zustand (~50k) and Redux (~60k) but above Recoil (~19k, now archived) and reflects a solid mid-tier library.

**3. npm weekly downloads:** Approximately 3–4 million weekly downloads as of mid-2026, with growth from ~13% to ~19% developer usage in surveys between 2023-2025. Crossed from "promising" to "established" in 2024-2025. Source: pkgpulse.com/packages/jotai and npmtrends.com/jotai comparisons.

**4. Stack Overflow / community volume:** The `jotai` tag on Stack Overflow has a limited question count (hundreds, not thousands) — consistent with a library whose API is small enough that most questions are answered in the docs. The GitHub Discussions board is the primary community forum and is actively maintained (3200+ discussions as of 2026).

**Structural undercount note:** Jotai is npm-distributed; the npm download number is a fair proxy. No CDN-distribution mismatch applies here (unlike htmx/Alpine.js).

**Triangulation:** The model's training data almost certainly includes Jotai patterns (atom, useAtom, derived atoms) given the library's age and download volume, though not to the depth of React/Redux/Zustand. The minimalism of the API (3 primary functions) means whatever training coverage exists is comprehensive for the full API surface. Score: **7.5**.

### Evidence: Stability / convention durability

**Current state:** Jotai v2 has been stable since its 2023 release. The v2 series uses a smooth patch cadence with no announced v2 breaking changes. All breaking-change work is explicitly routed to v3, which is still in RFC/discussion phase as of June 2026 (https://github.com/pmndrs/jotai/discussions/2889).

**v3 planned removals (from RFC discussion):**
- `jotai/babel` → move to `jotai-babel` package (already deprecated in v2.18)
- `loadable` utility removed (deprecated in v2.17)
- `setSelf` in atom read functions removed (deprecated in v2.17)
- `atomFamily` moved to `jotai-family` (deprecated in v2.16)
- React < 18 support dropped
- UMD/SystemJS builds removed

**Classification:** These are all peripheral-API removals (babel tooling, legacy utilities) or infrastructure changes. The core atom API (`atom`, `useAtom`, `useAtomValue`, `useSetAtom`, derived atoms, async atoms) is unchanged in the v3 RFC. No core convention breakage is planned.

**Deprecation discipline:** Each v3 removal has already been deprecated in the v2 series with console warnings, following a documented migration path. This is better deprecation hygiene than many libraries.

**`next_release` frontmatter reference:** `next_release.stability_penalty: false` — v3's changes do not affect the primary atom pattern that any code using Jotai today relies on. Migration effort for v3 will be mechanical import-path updates for the ~3 deprecated utilities.

Score: **7.5** — points withheld because v3 does land a non-trivial number of peripheral removals simultaneously, and the "ETA 2026" window means there is some near-term churn in ecosystem packages (jotai-devtools, jotai-babel) even if core usage is unaffected.

### Evidence: Ecosystem tooling facts

**DevTools:**
- `jotai-devtools` (https://github.com/jotaijs/jotai-devtools) — YES. In-app React component providing visual atom inspection, time-travel snapshot/restore, atom filtering. Maintained by the Jotai org. Ships with Redux DevTools integration via `useAtomDevtools` hook.
- `useAtomsDebugValue` hook — YES (in jotai-devtools). Displays all atom values in React DevTools panel.
- Browser extension — NO (discussed in jotaijs/jotai-devtools#59 but not shipped as of review date).

**Test utilities:**
- No dedicated Jotai test library, but atoms are plain JavaScript objects: `store.get(atom)` / `store.set(atom, value)` / `store.sub(atom, callback)` make atoms fully testable outside React with zero mocking.
- Compatible with React Testing Library (standard React component tests).
- `createStore()` enables headless store tests: write assertions against `store.get(derivedAtom)` without mounting any component.

**IDE/LSP support:**
- TypeScript language service covers all Jotai types natively (no plugin required).
- Babel plugin (`jotai-babel`) — YES. Adds automatic `debugLabel` to every atom for devtools display, supports React Fast Refresh. Migrated from `jotai/babel` in v2.18.
- SWC plugin (`@swc-jotai/react-refresh`, `@swc-jotai/debug-label`) — YES (https://jotai.org/docs/tools/swc). First-party, used with Next.js and Vite+SWC.
- No dedicated VSCode extension or LSP beyond TypeScript.

**Build integrations:**
- Vite: documented (https://jotai.org/docs/guides/vite)
- Next.js: documented with SWC plugin integration (https://jotai.org/docs/guides/nextjs)
- Waku: documented

**Checklist summary:**
- [x] Dedicated devtools UI (jotai-devtools)
- [x] Redux DevTools integration
- [x] Time-travel debugging
- [x] Babel/SWC compiler plugins for debug labels + Fast Refresh
- [x] Headless store API for pure unit tests
- [x] React Testing Library compatible
- [x] Full TypeScript coverage (native types)
- [ ] Browser extension (discussed, not shipped)
- [ ] Dedicated VSCode/IDE extension

Score: **7.5** — strong for a state-only library; deducted for no browser extension and no IDE extension beyond TypeScript inference.

---

## On the Horizon

### Next release

- **Name/version:** v3 (no version number assigned yet)
- **Status:** rfc
- **What's changing:** Drop React < 18; remove UMD/SystemJS; move `jotai/babel` to `jotai-babel`; remove `loadable` (favor `unwrap`), `setSelf`, and `atomFamily` from `jotai/utils`; rename/remove `delay` option in `useAtomValue`. All removals have been deprecated with warnings in v2. Discussion thread: https://github.com/pmndrs/jotai/discussions/2889. ETA: 2026, no committed date.
- **Anticipated impact:** Mechanical import-path updates for `jotai/babel` users; removal of `loadable` usage in favor of `unwrap`. The `atom`, `useAtom`, `useAtomValue`, `useSetAtom`, derived atoms, and async atoms are unchanged. Low impact on any code following current idiomatic Jotai patterns.
- **Stability penalty:** No — the core atom API convention is stable. See `next_release.stability_penalty: false` in frontmatter.

### AI-tooling investment

- **What exists:** One third-party MCP server (Ian Nuttall / Playbooks, https://playbooks.com/mcp/jotaijs-documentation) — exposes Jotai atom data via MCP for runtime introspection. No first-party MCP server, no official `llms.txt` (verified: 404 at jotai.org/llms.txt), no Boost-style curated AI guidelines, no AI-specific style guides.
- **Observed delta:** The canonical todo exercise was run with and without the MCP server. No difference in generated code quality was observed. Jotai's API surface is small enough (3 primary hooks, 1 primitive) that model training data provides complete coverage of all common patterns. The MCP server's design is oriented toward runtime atom introspection (exposing live atom values to an AI agent) rather than improving code-generation for new Jotai code — a different use case from the evidence-gathering exercise here. Delta: effectively zero for code generation; potentially positive for debugging-as-AI-agent scenarios where live atom values need to be read.
