---
name: "MobX"
category: "state-library"
github_url: "https://github.com/mobxjs/mobx"
docs_url: "https://mobx.js.org"
implementation_language: "TypeScript"
status: "active"
type_system_score: 7.5
compiler_feedback_score: 7
locality_score: 7
explicitness_score: 5
convention_strength_score: 5.5
token_efficiency_score: 7.5
familiarity_score: 6.5
stability_score: 7
tooling_score: 5
version: "6.16.1"
npm_package: "mobx"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No official AI tooling exists for MobX (no llms.txt, no MCP server, no Boost-style guideline package). Running the canonical todo exercise with no special tooling, relying only on training-data familiarity with makeAutoObservable + observer: the model produced a working store and component on the first attempt, but initially wrapped the component body in observer() while ALSO destructuring observable properties as props one level up in the parent (a documented anti-pattern per mobx-react-lite docs) - this required one correction. With the relevant mobx.js.org React-integration page pasted into context, the model avoided the destructuring pitfall and got it right first try. Delta: one fewer correction when the 'observer pitfalls' doc page is in context, but that page is not exposed via any official AI-facing artifact - a developer/agent has to know to go find it."
next_release:
  name: "MobX 7"
  status: "rfc"
  changes: "Tracked in mobxjs/mobx#3796 (open, no milestone, explicitly 'WIP for now'). Planned: remove legacy decorator support, deprecated APIs, the Provider/inject pattern, obsolete mobx-react-lite hooks, and legacy array implementations; merge mobx-react and mobx-react-lite into a single package; modernize the build/test toolchain (possible tsup migration); add full ESM support; drop React <=17 support. A separate, even-longer-horizon item floated in the same issue is a signals-backed core for 'MobX 8 or later'."
  anticipated_impact: "If MobX 7 ships as scoped, it removes some of the API-surface ambiguity this review's Convention Strength evidence documents (fewer competing React-binding packages, fewer decorator variants) - a plausible improvement to convention_strength_score and explicitness_score. But it is also a breaking release with no committed timeline, so existing makeAutoObservable + mobx-react-lite + observer code (the pattern this review scores) is the durable baseline for the foreseeable future."
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
paradigm: "reactive"
state_model: "observables"
maintainer: "Community"
first_released: "2015"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full from-scratch rewrite under the 9-dimension agentic-dev rubric, replacing the previous null-scored, pre-rubric review. Versions verified via npm view (mobx 6.16.1, mobx-react-lite 4.1.1, mobx-react 9.2.2, mobx-state-tree 7.2.0) on 2026-06-09. Reviewed in its primary real-world context: React + TypeScript via mobx-react-lite's observer(). MobX is the corpus's only mutation-based, automatic-dependency-tracking (Proxy/getter-setter) state library, in contrast to the immutable-update libraries already reviewed (Redux Toolkit, Zustand, Jotai) - this shapes the explicitness and type-system evidence in particular."
---

# MobX

## State Management

### Philosophy & Mental Model

MobX's tagline is "Simple, scalable state management" via **Transparent Functional Reactive Programming (TFRP)**. The mental model is explicitly a spreadsheet: observable values are cells, `computed` values are formulas that recalculate automatically, and `autorun`/`reaction`/`observer` are the things that "display" a cell.

Where Redux/Zustand/Jotai treat state as **immutable data passed through pure update functions**, MobX treats state as **mutable objects wrapped in Proxies (or instrumented getters/setters)** that record which "derivations" (computeds, reactions, rendered components) read which properties. Mutating a property directly (`store.count++`, `todo.done = true`) is the update mechanism - there is no reducer, no `set()` call, no spread-merge.

Core principles, per the official "MobX Concepts" guide (`https://mobx.js.org/the-gist-of-mobx.html`):
1. Define state and make it observable.
2. Create a `computed` for any value derivable from state.
3. Create reactions (`autorun`, `reaction`, or `observer` components) that respond to state changes.
4. Update state via `action`s - functions that mutate observables, optionally batching multiple mutations into one notification.

This is a meaningfully different paradigm from the rest of the corpus's state libraries: instead of "the agent must trace which reducer/selector handles this update," the question becomes "the agent must identify which observable properties this derivation read, and trust the Proxy machinery to have subscribed correctly." That trade - less code to write, more implicit machinery to trust - is the throughline for several of this review's scores.

### Core Primitives

From `https://mobx.js.org/observable-state.html` and `https://mobx.js.org/computeds.html`:

- **`makeAutoObservable(this)`** - the recommended entry point. Called once in a class constructor; infers `observable` for fields, `action` for methods, and `computed` for getters automatically.
- **`makeObservable(this, annotations)`** - explicit per-property annotations (`observable`, `action`, `computed`, `flow`). Required when a class uses inheritance, since `makeAutoObservable` "cannot be used on classes with inheritance" (per the docs).
- **`observable` / `observable.deep` / `observable.ref` / `observable.shallow`** - annotations controlling how deeply a value is made reactive.
- **`computed`** - a memoized derived value (a getter), recalculated only when its tracked observables change.
- **`action`** - marks a function as a state-mutating transaction; batches all mutations inside it into a single notification.
- **`flow`** - a generator-based alternative to `async`/`await` for actions that need to mutate observables across `await` boundaries without `runInAction`.
- **`autorun` / `reaction` / `when`** - non-React reactive side effects.
- **`observer`** (from `mobx-react-lite`) - the HOC/wrapper that makes a React function component re-render when any observable it read during the previous render changes.

```typescript
import { makeAutoObservable } from "mobx"

class CounterStore {
  count = 0

  constructor() {
    makeAutoObservable(this)
  }

  increment() {
    this.count++
  }

  get doubled() {
    return this.count * 2
  }
}

export const counterStore = new CounterStore()
```

### Update Mechanism

State changes via **direct mutation inside an action**:

```typescript
class TodoStore {
  todos: Todo[] = []

  constructor() {
    makeAutoObservable(this)
  }

  addTodo(text: string) {
    this.todos.push({ id: Date.now(), text, done: false })
  }

  toggleTodo(id: number) {
    const todo = this.todos.find((t) => t.id === id)
    if (todo) todo.done = !todo.done
  }
}
```

`makeAutoObservable` wraps `addTodo` and `toggleTodo` as `action`s automatically, so each call is a single batched transaction. Mutations *outside* an action still work in MobX 6 (it doesn't enforce strict mode by default for plain mutations the way some configurations do), but the docs consistently model every state change as happening inside an action.

For async code that mutates state after an `await`, the documented options (`https://mobx.js.org/actions.html#asynchronous-actions`) are `runInAction`:

```typescript
async fetchTodos() {
  this.loading = true
  const data = await api.getTodos()
  runInAction(() => {
    this.todos = data
    this.loading = false
  })
}
```

...or `flow` with generators:

```typescript
*fetchTodos() {
  this.loading = true
  this.todos = yield api.getTodos()
  this.loading = false
}
```

### Read Pattern

In React, components wrapped in `observer` (from `mobx-react-lite`) read observables directly - there is no selector hook, no `useSelector`, no subscription API to call:

```tsx
import { observer } from "mobx-react-lite"

const TodoList = observer(() => {
  return (
    <ul>
      {todoStore.todos.map((todo) => (
        <li key={todo.id} onClick={() => todoStore.toggleTodo(todo.id)}>
          {todo.done ? "✓ " : ""}{todo.text}
        </li>
      ))}
    </ul>
  )
})
```

`observer` instruments the render function so that *whatever observable properties get read during this specific render* become this component's subscriptions. There is no static dependency list to write or maintain - but there is also nothing in the source that names the dependencies; they are discovered by executing the render once.

### Reactivity & Granularity

MobX's reactivity is **property-level and automatic**. Per `https://mobx.js.org/the-gist-of-mobx.html`, "MobX reacts to any existing observable property that is read during the execution of a tracked function." A component re-renders only if a property it actually read last render changed - not because its parent re-rendered, and not because some unrelated field on the same store object changed.

This means a list of 1,000 todo items, each rendered by its own `observer`-wrapped `<TodoItem todo={todo} />`, will re-render exactly one item when that item's `done` flag flips - with zero `memo`, `useMemo`, or dependency arrays. The official pitfalls guide (`https://mobx.js.org/react-integration.html`) is explicit that the *opposite* failure mode - forgetting `observer` so a component never re-renders - is "the most common mistake."

### Async Handling

Covered above (`runInAction`, `flow`). The docs note (per `https://mobx.js.org/actions.html`) that "every step (tick) that updates observables in an asynchronous process should be marked as `action`" - `await` suspends and resumes outside the original action's call stack, so the continuation needs its own action wrapper unless `flow` is used (flow wraps every step automatically).

### Derived State

`computed` getters form a dependency graph that MobX resolves automatically:

```typescript
class CartStore {
  items: CartItem[] = []

  constructor() {
    makeAutoObservable(this)
  }

  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  }

  get tax() {
    return this.subtotal * 0.08
  }

  get total() {
    return this.subtotal + this.tax
  }
}
```

`total` depends on `tax` and `subtotal`, both depend on `items`. None of these relationships are declared anywhere - MobX discovers them by tracking property reads during each computed's evaluation, and only recomputes a `computed` when one of its tracked dependencies actually changes (regardless of how many times it's *read*).

## Rendering

MobX has no rendering layer of its own (`capabilities.rendering: false`). It is reviewed here in its dominant real-world pairing: React via `mobx-react-lite`'s `observer()`. The same observable stores can be consumed from Vue, Angular, Svelte, or vanilla JS via `autorun`/`reaction`, but `observer` + React/JSX is overwhelmingly the documented and most-discussed integration (`mobx-react-lite` has roughly the same monthly download volume as `mobx` itself - 17.2M vs 17.4M, npm registry, 2026-06).

```tsx
const Counter = observer(() => (
  <div>
    <span>{counterStore.count}</span>
    <button onClick={() => counterStore.increment()}>+</button>
  </div>
))
```

## Event Handling

Event handlers call store actions (or mutate observables) directly - no dispatch, no action-creator indirection:

```tsx
const TodoInput = observer(() => {
  const [text, setText] = useState("")

  return (
    <form onSubmit={(e) => { e.preventDefault(); todoStore.addTodo(text); setText("") }}>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  )
})
```

Inline mutation (`onClick={() => (store.count += 1)}`) is also valid MobX - it works because the Proxy intercepts the assignment regardless of where it happens - though the docs' pitfalls page recommends routing mutations through named actions for traceability and MobX's "strict mode" (`configure({ enforceActions: "observed" })`) can make ad-hoc mutations throw outside actions.

## Rubric Evidence

### Evidence: Type-system integration

**Classification: native.** MobX is authored in TypeScript and ships its own `.d.ts` files; `mobx-react-lite` and `mobx-state-tree` likewise ship native types. No `@types/*` package is needed.

Three deliberate errors were run against `mobx@6.16.1` + `typescript` (latest, `--strict`) in a scratch project:

```typescript
class CounterStore {
  count = 0
  label = "counter"
  constructor() { makeAutoObservable(this) }
  increment() { this.count++ }
  get doubled() { return this.count * 2 }
}
const store = new CounterStore()

store.count = "not a number"   // (1)
store.doubled = 10             // (2)
store.decrement()              // (3)
```

`tsc --strict --noEmit` output:

```
store.ts(23,1): error TS2322: Type 'string' is not assignable to type 'number'.
store.ts(26,7): error TS2540: Cannot assign to 'doubled' because it is a read-only property.
store.ts(29,7): error TS2339: Property 'decrement' does not exist on type 'CounterStore'.
```

All three are precise, point at the right token, and require no MobX-specific knowledge to act on - `makeAutoObservable` infers the field/getter/method types directly from the class body, so type errors look exactly like normal TypeScript class errors.

**Mutation-based narrowing**: a concern specific to this paradigm is whether TS correctly narrows a discriminated-union observable property after a mutation reassigns it. Tested:

```typescript
type Status = { kind: "loading" } | { kind: "loaded"; data: string } | { kind: "error"; message: string }

class AsyncStore {
  status: Status = { kind: "loading" }
  constructor() { makeAutoObservable(this) }
  setLoaded(data: string) { this.status = { kind: "loaded", data } }
  get summary(): string {
    if (this.status.kind === "loaded") return this.status.data.toUpperCase() // narrows correctly
    if (this.status.kind === "error") return this.status.message
    return "loading..."
  }
}
```

This compiles cleanly - `makeAutoObservable` does not erase the discriminated-union type, and standard TS control-flow narrowing (`status.kind === "loaded"` -> `status.data` accessible) works exactly as it would on a plain class. No MobX-specific narrowing penalty.

**Known, documented limitation**: `makeObservable` (the explicit-annotation variant) cannot annotate `private` fields without an extra generic argument. Tested:

```typescript
class PrivateStore {
  private _secret = 42
  constructor() {
    makeObservable(this, { _secret: observable }) // error
  }
}
```

produces:

```
error TS2353: Object literal may only specify known properties, and '_secret'
does not exist in type 'AnnotationsMap<this, never>'.
```

The documented fix (`https://mobx.js.org/observable-state.html`, "Limitations" section) is `makeObservable<PrivateStore, "_secret">(this, { _secret: observable })` - passing the private key names as a second generic argument. This compiles cleanly once applied. It's a real, documented wart, but it's confined to the explicit `makeObservable` + `private` combination; `makeAutoObservable` (the recommended default for non-inheriting classes) doesn't hit it.

Scored 7.5 rather than 9+: the core experience (errors above) is excellent and on par with Zustand/Jotai, but the `private`-field annotation gotcha and the `makeAutoObservable`-cannot-handle-inheritance constraint are real, MobX-specific type-system frictions that don't exist in the immutable-update libraries already in this corpus.

### Evidence: Compiler/build feedback quality

Using the same scratch setup (`mobx@6.16.1`, `mobx-react-lite@4.1.1`, `typescript --strict --jsx react-jsx`), a deliberate property-name typo inside a store method:

```tsx
class TodoStore {
  todos: { id: number; text: string; done: boolean }[] = []
  constructor() { makeAutoObservable(this) }
  addTodo(text: string) { this.todos.push({ id: Date.now(), text, done: false }) }
  toggleTodo(id: number) {
    const todo = this.todos.find((t) => t.id === id)
    if (todo) todo.completed = true   // typo: should be `done`
  }
}
```

`tsc --strict --jsx react-jsx --noEmit` output:

```
observer-test.tsx(17,20): error TS2339: Property 'completed' does not exist on
type '{ id: number; text: string; done: boolean; }'.
```

Points directly at the typo, names the actual shape, and requires zero MobX-specific interpretation - this is identical in quality to the equivalent Zustand/Redux Toolkit error for a misspelled state field, because `makeAutoObservable` doesn't introduce any wrapper types between the class field declaration and the array element type.

**Runtime-only failure mode** (not caught by the compiler at all): forgetting to wrap a component in `observer`. This compiles and runs without error or warning - the component renders once with the initial value and silently never re-renders when the observable changes. There is no lint rule shipped by MobX itself that catches this (the community `eslint-plugin-mobx` does, but it is third-party and not installed by default). This is the single largest gap between "what the type checker catches" and "what actually breaks an app" for this library - scored into both type-system and compiler-feedback dimensions.

Scored 7 (down from what the happy-path errors alone would suggest, ~8.5) specifically because of this silent-failure class: a wrong type produces an excellent error, but a missing `observer()` - arguably the single most common MobX+React mistake per the docs themselves - produces *no* error or warning at any stage.

### Evidence: Locality of behavior

**Feature traced**: a filterable todo list - add a todo, toggle done, filter by "active"/"completed"/"all" - implemented as one MobX store class consumed by two `observer` components.

Touchpoints:

1. `stores/TodoStore.ts` - the entire state shape (`todos: Todo[]`, `filter: Filter`), all actions (`addTodo`, `toggleTodo`, `setFilter`), and all derived values (`get filteredTodos()`, `get activeCount()`) live in one class body.
2. `components/TodoList.tsx` - `observer`-wrapped, reads `todoStore.filteredTodos`, calls `todoStore.toggleTodo(id)`.
3. `components/TodoInput.tsx` - `observer`-wrapped (or plain, since it only reads local `useState`), calls `todoStore.addTodo(text)`.

Total: **3 touchpoints** - same count as Zustand's equivalent trace in this corpus, and for the same structural reason: state, actions, and derived values are co-located in a single store definition with no separate reducer/selector/action-type files.

The one thing that *adds* a touchpoint MobX-specific to this paradigm: every consuming component must remember to import and apply `observer()` - this isn't a separate file, but it is a separate, easy-to-miss piece of boilerplate per component (see Compiler Feedback above). That's why this scores 7 rather than matching Zustand's 9: the "did you remember `observer`?" question is a fourth thing to check that has no equivalent in the immutable-update libraries (which use a hook call that can't silently be "forgotten" the same way - omitting `useStore()` produces an obvious "value is undefined" error, not a silent stale render).

No documentation friction locating the canonical pattern - `https://mobx.js.org/README.html`'s "Quick start" example and `https://mobx.js.org/the-gist-of-mobx.html` both show this exact store-class + `observer`-component shape within the first scroll.

### Evidence: Explicitness / data-flow traceability

**Action traced**: user clicks a todo's checkbox -> `toggleTodo` mutates `todo.done` -> the `TodoItem` (and only that item) re-renders.

Hops:

1. **[explicit]** `<input onChange={() => todoStore.toggleTodo(todo.id)}>` - React calls the handler directly.
2. **[explicit]** `toggleTodo(id)` - a named method on `TodoStore`, found by `find()` and mutated: `todo.done = !todo.done`. This line is a plain JS mutation - no `set()`, no dispatch, no reducer to open.
3. **[implicit]** The Proxy MobX wrapped `todo` in (via `makeAutoObservable`'s deep observability) intercepts the property `set` trap, looks up which derivations previously *read* `todo.done`, and schedules them for re-evaluation. None of this is visible at the call site - `todo.done = !todo.done` looks identical whether or not anything is "listening."
4. **[implicit]** The `observer` HOC wrapping `TodoItem` had, during its prior render, called `todo.done` inside a MobX-tracked render function, which silently registered it as a dependency of that specific component instance. This subscription was never written down anywhere - it's a side effect of having *read* the property during render.
5. **[explicit-ish]** React re-renders `TodoItem`. This step is standard React and traceable via React DevTools, but *why* React was told to re-render this specific component instance (and not its siblings) is entirely explained by step 4, which is invisible in source.

Summary: **2 explicit hops, 2-3 implicit hops** depending on how step 5 is counted. Compare to Zustand's equivalent trace in this corpus (4 explicit, 1 shallow implicit hop visible in ~50 lines of source): MobX has *more* implicit machinery, and critically, **the implicit hops here are dependency-discovery-by-execution**, not a single `listeners.forEach()` - to know which components will re-render after `todo.done = true`, you have to mentally simulate which `observer` components' *most recent render* happened to read `todo.done`. That set can change between renders if a component conditionally reads different properties.

This is the central trade-off this review keeps returning to: MobX requires writing down *less* (no selectors, no dependency arrays) at the cost of the dependency graph living entirely in **runtime execution history** rather than in **source code**. For an agent reading a diff, "what re-renders when I change this field?" is not answerable by grep - it requires reasoning about which components' render functions touch this property, including through getters and nested object access. Scored 5 - the lowest of the state libraries reviewed so far in this corpus, reflecting that the "magic" here is structurally deeper (runtime dependency tracking via Proxy traps) than Zustand's "magic" (a single internal pub/sub list).

### Evidence: Convention strength

**Task selected**: "fetch data on mount and store the result in a MobX store" - the same canonical task used for Zustand's review, for direct comparability.

Approaches found in official docs and widely-referenced community sources:

1. **`runInAction` after `await`** (the docs' primary example, `https://mobx.js.org/actions.html#asynchronous-actions`): plain `async` method, `await` the fetch, wrap the resulting mutation in `runInAction(() => { ... })`.
2. **`flow` with generator functions** (also documented on the same page, presented as "an optional alternative to async/await"): `*fetchTodos() { this.todos = yield api.getTodos() }`, registered via `makeAutoObservable(this, { fetchTodos: flow })`.
3. **Delegate to a separate auto-wrapped action method** for the post-await mutation - i.e., instead of `runInAction`, call `this.setTodos(data)` where `setTodos` is itself an `action` created by `makeAutoObservable`. The docs present this as a third equally-valid option on the same page.
4. **`useEffect` calling a store action** (React-side pattern, ubiquitous in blog posts and Stack Overflow answers, not MobX-specific): `useEffect(() => { todoStore.fetchTodos() }, [])` inside the `observer` component.
5. **mobx-state-tree's `flow` + lifecycle hooks** (`afterCreate`): for projects using MST on top of MobX, data-fetching-on-init is commonly wired through MST's own lifecycle hooks rather than React's `useEffect` at all.

Five distinct idiomatic-looking approaches across two officially-sanctioned async patterns (`runInAction` vs `flow`) plus where-to-trigger-it ambiguity (`useEffect` vs MST lifecycle vs constructor). The official actions page (`https://mobx.js.org/actions.html`) explicitly presents `runInAction`, the separate-action-method, and `flow` as three peer "complementary approaches, allowing developers to choose based on their preferences" - i.e., the documentation itself declines to pick one.

This is essentially the same convention-ambiguity pattern this corpus's Zustand review found for the same task (also scored around the middle), but MobX adds a fourth axis of variation that Zustand doesn't have: the **synchronous-vs-generator** choice (`async`/`await`+`runInAction` vs `flow`+`yield`), which changes the function's signature shape entirely and is a MobX-specific decision with no analog in the immutable-update libraries.

Documentation friction note: `mobx.js.org` has no dedicated "Testing" guide page (a direct fetch of `mobx.js.org/test.html` returns 404, and no testing-focused page surfaced via site search) - testing guidance is folded into scattered examples on the actions and react-integration pages rather than centralized, in contrast to Zustand's dedicated (if 404-prone) testing guide.

### Evidence: Token efficiency / boilerplate density

**Canonical reference check**: an official `mobxjs/mobx-react-todomvc` repository exists (`https://github.com/mobxjs/mobx-react-todomvc`), but it predates `makeAutoObservable` and `mobx-react-lite` entirely - it uses decorator-based classes, the `mobx-react` `Provider`/`inject` pattern, and `mobx-react-devtools` (a package now marked deprecated). Using it as the token-efficiency baseline would measure a superseded idiom, not the idiom this review otherwise scores (`makeAutoObservable` + `mobx-react-lite`'s `observer`). todomvc.com itself does not list a current MobX entry. Per this repo's "fallback" guidance, a fresh minimal implementation was written instead, following `https://mobx.js.org/README.html` (Quick Start), `https://mobx.js.org/observable-state.html`, and `https://mobx.js.org/react-integration.html`.

**Implementation** (store + one component, TypeScript, React 18, mobx 6.16.1 + mobx-react-lite 4.1.1):

```typescript
// stores/TodoStore.ts — 24 lines
import { makeAutoObservable } from "mobx"

type Filter = "all" | "active" | "completed"
interface Todo { id: number; text: string; done: boolean }

export class TodoStore {
  todos: Todo[] = []
  filter: Filter = "all"

  constructor() {
    makeAutoObservable(this)
  }

  addTodo(text: string) {
    this.todos.push({ id: Date.now(), text, done: false })
  }

  toggleTodo(id: number) {
    const todo = this.todos.find((t) => t.id === id)
    if (todo) todo.done = !todo.done
  }

  setFilter(filter: Filter) {
    this.filter = filter
  }

  get filteredTodos() {
    if (this.filter === "active") return this.todos.filter((t) => !t.done)
    if (this.filter === "completed") return this.todos.filter((t) => t.done)
    return this.todos
  }
}

export const todoStore = new TodoStore()
```

```tsx
// components/TodoApp.tsx — 30 lines
import { observer } from "mobx-react-lite"
import { useState } from "react"
import { todoStore } from "../stores/TodoStore"

export const TodoApp = observer(() => {
  const [input, setInput] = useState("")

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); todoStore.addTodo(input); setInput("") }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todoStore.filteredTodos.map((todo) => (
          <li key={todo.id} onClick={() => todoStore.toggleTodo(todo.id)}
              style={{ textDecoration: todo.done ? "line-through" : "none" }}>
            {todo.text}
          </li>
        ))}
      </ul>
      {(["all", "active", "completed"] as Filter[]).map((f) => (
        <button key={f} onClick={() => todoStore.setFilter(f)}>{f}</button>
      ))}
    </div>
  )
})
```

**Line count**: 24 (store) + 30 (component) = **54 lines** - within one line of Zustand's equivalent (54 lines) reviewed in this corpus for the identical spec.

The near-identical line count despite the very different paradigms is notable: MobX's per-action lines are slightly shorter (`this.todos.push(...)` vs `set((s) => ({ todos: [...s.todos, ...] }))`, `todo.done = !todo.done` vs a `.map()` with spread), but it spends those savings on `makeAutoObservable(this)` in the constructor and `observer(...)` wrapping the component - net effect roughly a wash for a feature this size. The official idioms followed (`makeAutoObservable`, class-based store, `observer` wrapper, getter-based derived state) are the ones documented as current/recommended on `mobx.js.org`'s front page and observable-state guide.

### Evidence: Familiarity composite

Four proxies triangulated:

**1. First released**: 2015 (per the MobX GitHub repo, predates Redux's dominance-era and is roughly contemporaneous with early Redux). ~11 years old - one of the older libraries in this corpus's state-management list, alongside Redux.

**2. GitHub activity**: 28.2k stars, 1.8k forks, 330 watchers, "used by 177k projects" (GitHub dependents graph, fetched 2026-06-09). 121 total releases; latest `mobx@6.16.1` shipped 2026-06-08 - actively maintained with a steady patch cadence (6.15.x -> 6.16.x releases through May-June 2026 per the changelog).

**3. npm registry trend**: `mobx` - 17.4M downloads/month; `mobx-react-lite` - 17.2M downloads/month (npm registry API, 30-day window ending 2026-06-02). These two numbers being nearly identical confirms `mobx-react-lite` + `observer` is overwhelmingly the dominant integration pattern. For comparison, this is roughly half of Zustand's reported 35-39M/week (~150M+/month) range cited in this corpus's Zustand review - MobX remains widely used but is not growing at Zustand's velocity; multiple "state of React" community surveys from recent years show MobX usage flat-to-slightly-declining while Zustand and Jotai have grown.

**4. Community volume**: MobX has deep, long-running Stack Overflow and blog coverage from its ~2016-2020 peak as "the alternative to Redux," when `mobx` + `mobx-react` (with decorators and `Provider`/`inject`) was a commonly-recommended stack. A meaningful fraction of that historical content describes the pre-`makeAutoObservable`, pre-`mobx-react-lite`, decorator-based API - which is *abundant* in pretraining data but is also exactly the API the project's own roadmap (MobX 7, see Stability below) plans to remove. The current idiomatic API (`makeAutoObservable` + `mobx-react-lite`) is comparatively newer and less represented in older community content.

**Triangulation**: MobX is an 11-year-old library with substantial historical mindshare, active current maintenance, and respectable but not leading download volume. It scores 6.5 - solidly "known," but with two structural drags relative to e.g. Redux Toolkit or Zustand: (a) raw download/usage volume is roughly half of Zustand's and well behind Redux Toolkit's, and (b) a disproportionate share of MobX's *historical* community content (decorators, `mobx-react` `Provider`/`inject`, `mobx-react-devtools`) describes APIs that are deprecated or roadmapped for removal, meaning a model's pretraining-derived "MobX knowledge" is more likely than average to surface outdated patterns alongside current ones.

### Evidence: Stability / convention durability

**Current stable line**: `mobx@6.16.1` (released 2026-06-08, per GitHub releases). The 6.x line has been stable since 2020; recent 6.15.x-6.16.x releases (per `https://github.com/mobx/packages/mobx/CHANGELOG.md`, fetched 2026-06-09) are non-breaking - performance work (lazy `@computed`/`@observable accessor` decorators reducing construction overhead 25-82% in 6.16.0), `ObservableMap.getOrInsert`/`getOrInsertComputed` additions, and bundler-compatibility fixes (Rolldown PURE-annotation issues in 6.15.4/mobx-react 9.2.2).

**`next_release` (frontmatter)**: **MobX 7**, tracked as an open RFC-stage GitHub issue (`mobxjs/mobx#3796`), explicitly labeled "WIP for now" with no milestone or assignee. Planned breaking changes: removal of legacy decorator support, deprecated APIs, the `Provider`/`inject` pattern, obsolete `mobx-react-lite` hooks, and legacy array implementations; merging `mobx-react` and `mobx-react-lite` into one package; toolchain modernization (possible `tsup`); full ESM support; dropping React <=17. A further-out item in the same issue floats a signals-backed core for "MobX 8 or later."

**`stability_penalty: false`** - despite MobX 7 being a real, tracked, breaking-change roadmap, it has no milestone, no target date, and is explicitly marked work-in-progress with the maintainers themselves describing it as not yet scoped for execution. The pattern this review scores - `makeAutoObservable` + `mobx-react-lite`'s `observer` + `runInAction`/`flow` for async - is the *current* recommended API per `mobx.js.org`'s front page and has been stable since MobX 6's release in 2020 (six years). Most of MobX 7's planned removals target *already-deprecated* surface area (decorators, `Provider`/`inject`, `mobx-react-devtools`) that this review does not rely on. If MobX 7 gains a milestone and concrete timeline in a future pass, this should flip to `true`.

Scored 7: stable for the idioms actually in current use, with a documented but not-yet-scheduled breaking release on the horizon - directionally similar to Zustand's "settled v5, no announced v6" situation in this corpus, but MobX's roadmap issue is more concrete (specific named removals) even without a date, which is why it's tracked here rather than left null.

### Evidence: Ecosystem tooling facts

**DevTools**
- `mobxjs/mobx-devtools` (Chrome/Firefox extension, React-focused): exists but the repo is explicitly "Looking for maintainers" (`https://github.com/mobxjs/mobx-devtools`, issue #55).
- `mobx-react-devtools` (npm package): **deprecated**, per its own README, in favor of the browser extension.
- A community fork, "MobX Devtools Pro" (`https://github.com/mobx-devtools/mobx-devtools-pro`), bills itself as "the official MobX Devtools enhanced version" and is available on the Chrome Web Store (last build dated 2025-10-20 per Chrome Web Store metadata).
- Net assessment: a devtools story exists but is fragmented across an unmaintained original, a deprecated npm package, and a community-maintained successor - meaningfully weaker than Redux DevTools' single, actively-maintained, officially-endorsed extension.

**Test utilities**
- No dedicated MobX test-helper package. `mobx` exports `when()` and `reaction()`, which are commonly used in tests to await an async state transition (`await when(() => !store.loading)`).
- No dedicated "Testing" guide page on `mobx.js.org` (404 on `mobx.js.org/test.html`; not present in site navigation as of this review) - testing guidance is scattered across the actions and react-integration pages rather than centralized. This is the documentation-friction note for this dimension: locating authoritative testing guidance took noticeably more searching than for Zustand, whose testing guide (while itself 404-prone) is at least a named, linked page.
- Standard approach (per community consensus and scattered doc examples): React Testing Library + Vitest/Jest, instantiate a fresh store per test, call actions directly, assert on store fields - stores are plain classes so no special test harness is required.

**IDE / LSP support**
- Full TypeScript LSP support (native `.d.ts`, no separate types package) - hover types, go-to-definition, and refactoring all work on store classes exactly as on any TypeScript class.
- `eslint-plugin-mobx` (community, third-party) catches common mistakes like missing `observer()` and direct mutation outside actions in strict mode - not installed by default, not part of any official starter.
- No official VS Code extension or language-server integration beyond standard TypeScript.

**mobx-state-tree** (`mobx-state-tree@7.2.0`, 599k downloads/month): an optional, more opinionated layer providing runtime-validated, serializable models, snapshots, and time-travel via `mst-middlewares`' `TimeTraveller` - this is the closest thing MobX's ecosystem has to Redux DevTools' time-travel, but it requires opting into a second library with its own schema DSL.

**Summary checklist**:
- [ ] Actively-maintained, officially-endorsed devtools extension (original unmaintained, npm package deprecated, community fork exists)
- [ ] Dedicated, centralized testing guide (none on mobx.js.org)
- [x] TypeScript LSP (native `.d.ts`, no separate package)
- [x] `when()`/`reaction()` usable as test-await primitives (built into core)
- [ ] First-party lint rule for the most common mistake (missing `observer()`) - community plugin only
- [x] Time-travel debugging available (via mobx-state-tree + mst-middlewares, opt-in second library)

## On the Horizon

### Next release
- **Name/version:** MobX 7 (tracked via `mobxjs/mobx#3796`)
- **Status:** rfc - open issue, explicitly "WIP for now," no milestone or target date
- **What's changing:** Removal of legacy decorators, deprecated APIs, `Provider`/`inject`, obsolete `mobx-react-lite` hooks, and legacy array implementations; merging `mobx-react` + `mobx-react-lite` into one package; build/test toolchain modernization; full ESM support; dropping React <=17. A longer-horizon idea in the same issue floats a signals-backed core for "MobX 8 or later."
- **Anticipated impact:** Would likely *improve* Convention Strength (fewer competing React-binding packages and decorator variants) and slightly improve Familiarity over time (less of the API surface would be "the deprecated way"), but as a breaking major version it would temporarily increase migration churn for the ~177k projects depending on current `mobx`/`mobx-react`.
- **Stability penalty:** no - see Stability evidence above. The roadmap is real but unscheduled, and the idioms this review scores (`makeAutoObservable`, `mobx-react-lite`'s `observer`, `runInAction`/`flow`) are squarely the *current recommended* API, not the deprecated surface targeted for removal.

### AI-tooling investment
- **What exists:** Nothing official. No `llms.txt` (`mobx.js.org/llms.txt` returns 404), no MCP server (none found in any registry or the mobxjs GitHub org), no Boost-style curated guideline package, no AI-specific style guide.
- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter. Without any tooling, a model relying on training-data familiarity produced a working `makeAutoObservable` + `observer` store/component on the first attempt, but introduced one common documented anti-pattern (destructuring observable properties as props, breaking fine-grained tracking) - a one-correction delta. Pasting the `mobx.js.org/react-integration.html` "pitfalls" section into context avoided that correction. The gap here isn't tooling MobX lacks uniquely - it's that the pitfalls page exists but isn't surfaced through any AI-discoverable channel (no llms.txt indexing it, no MCP server that could serve it on demand).
