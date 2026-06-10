---
name: "Preact"
category: "full-framework"
github_url: "https://github.com/preactjs/preact"
docs_url: "https://preactjs.com"
implementation_language: "JavaScript"
status: "active"
type_system_score: 6.5
compiler_feedback_score: 6.5
locality_score: 7.5
explicitness_score: 7
convention_strength_score: 5.5
token_efficiency_score: 7.5
familiarity_score: 7
stability_score: 7.5
tooling_score: 7
version: "10.27.x (11.0.0-beta in progress)"
npm_package: "preact"
ai_tooling:
  mcp_server:
    available: true
    url: "https://github.com/JoviDeCroock/preact-mcp"
    party: "community"
  guidelines: null
  llms_txt: true
  style_guides: null
  observed_delta: "Generated a small signals-based counter+derived-value component twice: once with no extra context, once after fetching https://preactjs.com/llms.txt into context first. Without the llms.txt, the model defaulted to React idioms translated 1:1 (useState, .jsx import assumptions, React.FC) and had to be corrected to use `preact/hooks` imports and `h`/JSX pragma config — two correction round-trips. With the llms.txt loaded, the model produced correct `import { useState } from 'preact/hooks'` and, unprompted, offered the `@preact/signals` version as the 'more idiomatic for 2026' alternative, citing the guide's own framing — zero correction round-trips. The delta was real but modest: it mostly closed the 'this looks like React but isn't' gap, which is Preact's single biggest source of agent friction."
next_release:
  name: "Preact 11 (beta)"
  status: "beta"
  changes: "Drops IE11 support, moves defaultProps into preact/compat, removes automatic px-suffixing and Component.base from core, rewrites hydration (\"Hydration 2.0\" — components can suspend and return zero/multiple DOM nodes), switches hook-dependency comparison to Object.is (closer to React, supports NaN deps), reduces forwardRef boilerplate for function-component refs, ships ESM as .mjs only, and raises the TypeScript floor to 5.1+."
  anticipated_impact: "Mostly an internals/ergonomics cleanup that narrows the Preact/React behavioral gap (a recurring source of agent confusion documented in Explicitness and Convention-strength evidence below) rather than a paradigm change. The defaultProps/px-suffix removal from core is a real breaking change for code relying on Preact's historically more-permissive defaults, but it's confined to a documented, mechanical migration path."
  stability_penalty: false
typescript_support: "native"
license: "MIT"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "reactive"
state_model: "signals"
rendering_strategy: "virtual-dom"
maintainer: "Jason Miller / Preact core team (community)"
first_released: "2015"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
---

# Preact

> **Framing note:** Preact bills itself as \"a fast 3kB alternative to React with the same modern API.\" That positioning is doubly relevant to this review: (1) it means an enormous fraction of Preact's documented API surface, idioms, and community knowledge is *literally React's*, which has outsized effects on Familiarity and on how agents approach it; and (2) Preact's own team has, since 2022, been pushing `@preact/signals` as its distinguishing, fine-grained-reactivity answer to the question "why not just use React" — making signals not a bolt-on but Preact's own articulated forward direction. Both threads run through the evidence below.

## State Management

### Philosophy & Mental Model

Preact's state story is genuinely two-layered, and a developer (or agent) needs to know both layers exist:

- **Layer 1 — classic, React-shaped local state.** `useState`/`useReducer` from `preact/hooks`, class `this.state`/`this.setState`, and prop-drilling/Context — a near-1:1 port of React's pre-signals model. This is what most existing Preact code (including the official TodoMVC reference, see Token-efficiency evidence) is built on, and it's still fully supported and documented.
- **Layer 2 — `@preact/signals`, the team's current flagship answer to fine-grained reactivity.** Signals are mutable reactive containers (`signal(initialValue)`) whose `.value` reads are auto-tracked by whatever is currently rendering or computing. Unlike React-style state, **updating a signal does not require re-rendering the owning component** — Preact's signals integration patches the renderer so that a signal passed into JSX subscribes the DOM text/attribute node directly, skipping the component's render function entirely.
- Preact's own framing (`https://preactjs.com/guide/v10/signals/`): *"Signals are effective in applications of any size, with ergonomics that speed up the development of small apps, and performance characteristics that ensure apps of any size are fast by default."* Notably the guide does **not** declare signals the mandatory default — it explicitly says *"The majority of application state ends up being passed around using props and context"* and positions signals as a complementary, opt-in optimization layer plus a nicer global-state primitive. (See Convention-strength evidence for what this dual-track positioning costs in practice.)
- Net mental model: **local-first, signals-for-cross-cutting-or-perf-sensitive-state**. A component tree is still "props down, callbacks up" in spirit; signals are the escape hatch when you want a value to update DOM without re-running components in between.

### Core Primitives

- **`signal(value)`** (from `@preact/signals`) — a reactive box; `.value` reads subscribe, `.value =` writes notify. The signal object reference itself never changes, which is what allows it to be passed through props/context "by reference" without triggering parent re-renders.
- **`computed(fn)`** — derived, read-only signal; recomputes lazily when a dependency changes and is read.
- **`effect(fn)`** — runs `fn` once and re-runs it whenever any signal it reads changes; returns a cleanup-capable disposer.
- **`batch(fn)`** — coalesces multiple `.value` writes inside `fn` into a single notification pass.
- **`useSignal(value)` / `useComputed(fn)` / `useSignalEffect(fn)`** — thin hook wrappers that memoize a signal/computed/effect instance for the lifetime of a component, for *local* component state expressed with signal ergonomics.
- Underneath both layers: **hooks** (`useState`, `useReducer`, `useEffect`, `useContext`, `useMemo`, `useCallback`, `useRef` — `preact/hooks`) and the **class component** API (`Component`, `this.state`, `this.setState`, lifecycle methods), both inherited near-verbatim from React's pre-signals design.

### Update Mechanism

Two idiomatic patterns coexist. Signal-based (the modern, team-promoted pattern):

```jsx
import { signal, computed } from '@preact/signals';

const todos = signal([{ text: 'Buy groceries', completed: false }]);
const remaining = computed(() => todos.value.filter(t => !t.completed).length);

function addTodo(text) {
  todos.value = [...todos.value, { text, completed: false }];
}
```

Hook-based (the classic, still-canonical-for-local-state pattern):

```jsx
import { useState } from 'preact/hooks';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

Both are explicit, synchronous, direct-assignment patterns — no action dispatch, no proxies-over-mutation tricks, no compiler-rewritten assignment syntax (contrast Svelte 5 runes or Vue's `ref.value` + compiler unwrapping). A signal write (`todos.value = …`) and a setState call (`setCount(…)`) are both ordinary function calls/assignments you can step through in a debugger.

### Read Pattern

- **Signals in JSX**: pass the signal directly — `<p>{count}</p>` — and Preact's signals integration subscribes the rendered text node to `count` without involving the component's render function at all. This is the headline "skip the component" trick: *"when a signal is passed down through a tree as props or context, we're only passing around references to the signal… This lets us skip all of the expensive rendering work and jump immediately to any components in the tree that actually access the signal's `.value` property"* (preactjs.com/guide/v10/signals).
- **Signals in logic** (event handlers, computed, effects): read `.value` explicitly — `count.value`.
- **Hooks**: destructure from `useState`/`useContext`/`useReducer` as in React; subscription is implicit (the hook re-runs the component on change).

### Reactivity & Granularity

This is where Preact's two layers diverge most sharply, and it's the single most consequential architectural fact in the review:

- **Hook/class state → component-level re-render**, exactly like React: a `setState`/`setCount` call re-runs the whole owning function component (and reconciles its subtree via virtual-DOM diff).
- **Signal `.value` reads in JSX → sub-component, DOM-node-level updates**, bypassing virtual-DOM diffing for that binding entirely. A signal threaded through five layers of props/context updates only the leaf DOM node that reads it — none of the intermediate components re-render.
- This means the same app can have wildly different re-render granularity depending purely on *which* primitive a given piece of state uses — a fact an agent must track per-value, not per-component, to reason about performance or to predict "what re-renders when I change X."

### Async Handling

No built-in async primitives in either layer (no Suspense-for-data-fetching as a first-class signals feature, unlike Solid's resources or React's `use()`). The documented patterns are:
- Classic: `useEffect` with manual loading/error/data state (`useState` triple, or `useReducer`), the same pattern React docs taught for years.
- Signals-based: community pattern of an async-aware signal wrapper that aborts in-flight fetches on dependency change (e.g. `https://rodydavis.com/posts/async-preact-signal`), or the community library `@preact-signals/query`, which explicitly mirrors TanStack Query's API (`useQuery$`) for a signals-native data-fetching layer.
- This is a **convention gap**, not a documentation gap — the official guide doesn't prescribe one canonical async pattern, and the ecosystem has filled it with at least three distinct idioms (manual `useEffect`, ad-hoc async-signal wrappers, and TanStack-style query libraries). See Convention-strength evidence.

### Derived State

- Signals: `computed(fn)` — lazily-recomputed, cached, dependency-tracked. `const remaining = computed(() => todos.value.filter(t => !t.completed).length)`.
- Hooks: `useMemo(fn, deps)` — manually-listed dependency array, React-identical semantics (and React-identical stale-closure footguns).
- Class components: plain getter methods or inline expressions in `render()`.

### Developer Experience
- **Boilerplate:** Low for signals (no dependency arrays, no action types); medium for hooks (React-equivalent — dependency arrays, memoization calls). See Token-efficiency evidence for a concrete count.
- **DevTools:** Preact DevTools browser extension (Chrome/Firefox/Edge, `https://github.com/preactjs/preact-devtools`) shows component hierarchy, props, hooks state, and (in recent versions) signal values and subscriptions.
- **Debugging:** Hook state inspectable via DevTools' "hooks" panel; signal values are plain objects (`signal.value`) inspectable via `console.log` or DevTools' signal panel — both are simpler to introspect than proxy-based reactive systems (Vue) because there's no proxy-trap indirection to reason through.
- **Time travel:** Not built in; would require a Redux-DevTools-style middleware, which the ecosystem doesn't standardize on for Preact specifically.

## Rendering

### Philosophy & Approach
Preact is a **virtual-DOM library**, full stop — it is explicitly "the same modern API" as React, implemented with a much smaller, more focused diffing engine (the entire core is ~3kB min+gzip vs. React's ~45kB). On top of that VDOM core, `@preact/signals` adds an opt-in **fine-grained layer** that, for the specific case of a signal read directly inside JSX, bypasses the VDOM diff and writes to the DOM node directly. So Preact is simultaneously "a smaller React" (VDOM) and "a framework with an escape hatch to fine-grained reactivity" (signals) — an unusual hybrid worth naming explicitly, since most frameworks pick one camp.

### Update Strategy
- Component-level: `setState`/hook-state changes schedule a re-render; Preact batches synchronous updates within an event handler into a single render pass (React-equivalent behavior).
- Signal-level: a `.value` write synchronously (or batched via `batch()`) notifies subscribers; subscribers that are DOM-node bindings update immediately without scheduling a component render at all.

### Reconciliation
Classic key-based virtual-DOM diffing — same algorithm family as React (children matched by `key`, same-type elements patched in place, type changes torn down and rebuilt). Preact's diff is smaller and historically faster on micro-benchmarks than React's, but conceptually identical: a developer who understands React's reconciliation rules (keys, why inline-defined components remount, etc.) needs to learn nothing new here. Signal-bound JSX expressions skip this path entirely — there's no diffing because there's no VDOM node representing that binding; it's a direct subscription on a real DOM Text node.

### Templating & Syntax
JSX, via the `h`/`jsx` pragma (configurable; Preact ships its own JSX runtime, `preact/jsx-runtime`). Syntactically indistinguishable from React JSX — `class` works as an alias for `className` (a small but real ergonomic divergence worth knowing), and event props are lowercase (`onclick` as well as `onClick` are both accepted in recent versions, another small divergence from React's strict camelCase).

```jsx
function TodoItem({ todo, onToggle }) {
  return (
    <li class={todo.completed ? 'completed' : ''}>
      <input type="checkbox" checked={todo.completed} onClick={() => onToggle(todo)} />
      <label>{todo.title}</label>
    </li>
  );
}
```

### Component Model
Function components (the dominant modern style, with hooks) and class components (`extends Component`, still fully supported and used throughout the official TodoMVC reference — see Token-efficiency evidence). Props are plain objects passed as the first argument / `this.props`. `preact/compat` provides a React-compatibility shim (`forwardRef`, `memo`, `Suspense`, portals, etc.) that lets a large fraction of the React ecosystem's libraries run unmodified on Preact — a deliberate, load-bearing design choice that shapes nearly every other dimension in this review.

### Performance Optimizations
- `memo()` (via `preact/compat` or natively in recent 10.x) for shallow-prop-comparison skip-rendering, React-identical semantics.
- Signals as a structural optimization: routing hot-path values through signals avoids the re-render question entirely rather than requiring memoization tuning.
- `shouldComponentUpdate` on class components (the original pre-hooks escape hatch, still present, visible commented-out in the official TodoMVC `TodoItem` source).
- No compiler-driven auto-memoization (contrast React Compiler / Svelte) — optimization remains a manual decision the developer (or agent) must make per-value.

### Developer Experience
- **Learning curve:** Easy for anyone who knows React — this is Preact's entire value proposition. The "second curriculum" is signals, which is a genuinely different mental model (subscriptions-by-reference, render-bypass) layered on top of an otherwise-familiar base.
- **DevTools:** Preact DevTools extension; also compatible with React DevTools via `preact/compat` aliasing in many setups.
- **Hot reload:** Standard Vite/`@preact/preset-vite` HMR support; Preact's own recommended scaffold is `npm init preact` → Vite-based.

## Event Handling

### Philosophy & Approach
Native DOM events with a thin normalization layer — **not** a synthetic event system like React's (a deliberate size/complexity trade-off; React's SyntheticEvent pooling and cross-browser normalization layer is a meaningful chunk of its bundle weight that Preact opts out of). Handlers receive the real, unwrapped browser `Event`/`MouseEvent`/etc.

### Event Binding
Inline JSX props, camelCase or lowercase (`onClick` and `onclick` both work in modern Preact — a real, if minor, divergence from React's strict-camelCase convention worth flagging for an agent translating React code):

```jsx
<button onClick={(e) => { e.preventDefault(); save(); }}>Save</button>
```

### Event Flow
Standard native DOM bubbling/capturing — `event.stopPropagation()` and `event.preventDefault()` work exactly as they do on raw DOM nodes, because that's what they are. No synthetic-event re-implementation of propagation semantics to learn or debug around.

### Event Object
The **real** DOM event object — `MouseEvent`, `KeyboardEvent`, `InputEvent`, etc. — not a synthetic wrapper. This is a meaningful explicitness win over React: `e.target`, `e.currentTarget`, `e.nativeEvent` (which doesn't exist because there's no synthetic layer to unwrap) all behave exactly per the DOM spec, and MDN documentation applies directly.

```jsx
function Input({ onChange }) {
  return <input onInput={(e) => onChange((e.target as HTMLInputElement).value)} />;
}
```

### Common Patterns
- Passing data to handlers: closures over loop variables / props (`onClick={() => onToggle(todo)}`) — identical to React idiom.
- Accessing state in handlers: closures (hooks) or `this.state`/`this.props` (classes) or direct `.value` reads/writes (signals) — three coexisting idioms again, see Convention-strength evidence.
- Preventing default: `e.preventDefault()` on the real event — no synthetic-event quirks.

### Performance Considerations
No automatic event delegation at the framework level for user-attached handlers (Preact attaches listeners directly to DOM nodes it creates, like React's modern root-delegation model under the hood for some event types, but this is an internal optimization, not something the developer configures). Handler identity (`() => {}` defined inline vs. `useCallback`-memoized) matters for `memo()`-wrapped children exactly as it does in React — the same "stable callback identity" tuning concerns transfer 1:1.

### Developer Experience
- **Debugging:** Standard browser DevTools event listener inspection works directly, because handlers are attached to real DOM nodes with real event objects — no synthetic-event indirection to look through.
- **Type safety:** `preact/compat`'s `JSX.IntrinsicElements` typings provide per-element event-handler types (`onClick: (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => void`), giving autocomplete on `e.currentTarget` typed to the actual element.

## Rubric Evidence

### Evidence: Type-system integration
**Categorical fact: native.** Preact is implemented in JavaScript but ships first-party, hand-maintained `.d.ts` types (not a community `@types` package), including a dedicated JSX typings layer and a `preact/compat` typings shim for React-library interop.

Sample type behavior, from the official TypeScript guide (`https://preactjs.com/guide/v10/typescript/`):

```tsx
class Foo extends Component {
  ref = createRef<HTMLAnchorElement>();
  render() {
    return <div ref={this.ref}>Foo</div>;
    //      ~~~  💥 Error! Ref only can be used for HTMLAnchorElement
  }
}
```
TypeScript correctly flags the `<div>` because `this.ref` was declared `createRef<HTMLAnchorElement>()` — a real, useful catch of a common copy-paste mistake (forgetting to update the ref's element type when changing the underlying tag).

The rough edge — and it's a real one, well-documented in Preact's own issue tracker — is **interop with React-typed third-party code**: `React.ReactElement` and Preact's `VNode` are structurally different types, producing errors like `'ReactFCInterlop' cannot be used as a JSX component… Type 'ReactElement<any,any>' is missing the following properties from type 'Element': nodeName, attributes, children` (`preactjs/preact#2748`). The documented fix requires `tsconfig.json` `paths` remapping (`react` → `preact/compat`, etc.) plus `skipLibCheck` — a real, recurring source of friction for any agent trying to wire a React-ecosystem library into a Preact project. This single issue is referenced across at least four open/closed `preactjs/preact` and `preact-www` issues (#862, #1930, #2150, #2748, #3423), which is itself a convention-strength signal: the "fix" is folklore spread across GitHub threads, not a single canonical doc page.

### Evidence: Compiler/build feedback quality
Preact has no compiler of its own (it's a runtime VDOM library) — "build feedback" here means TypeScript + the bundler (Vite, the team's own recommended scaffold via `npm init preact`).

Deliberately-broken example — passing a `string` where a `number` prop is declared:

```tsx
interface MyComponentProps { name: string; age: number; }
function MyComponent({ name, age }: MyComponentProps) {
  return <div>{name} is {age.toString()} years old</div>;
}

// usage:
<MyComponent name="Ada" age="thirty-six" />
```

TypeScript's actual error (`tsc` / any TS-aware editor):
```
Type 'string' is not assignable to type 'number'.
  Property 'age' is incorrect.
    Type '{ name: string; age: string; }' is not assignable to type
    'IntrinsicAttributes & MyComponentProps'.
      Types of property 'age' are incompatible.
        Type 'string' is not assignable to type 'number'.
```
This is the **same TypeScript JSX error shape React produces** (because both rely on the same `JSX.LibraryManagedAttributes` machinery) — actionable, points at the exact prop and the exact line, no indirection through framework internals. This is a direct consequence of Preact's "same modern API" design choice: an agent's prior React/TS experience transfers without translation for ordinary component code. The friction documented under Type-system integration (React/Preact type incompatibility at interop boundaries) is the one place this breaks down — and when it does, the resulting error message points at the symptom (`'Element' is missing properties…`) rather than the root cause (a missing `tsconfig` path remap), which is a real compiler-feedback weakness worth being honest about.

### Evidence: Locality of behavior
Traced: "toggle a todo's completed state and see it reflected in the remaining-count footer," using the official `preact-todomvc` reference (`https://github.com/developit/preact-todomvc`, classic Component/hooks-era code) as the representative feature.

Touchpoints required to understand/change this one feature:
1. `src/app/index.js` — `App` component wires `model.toggle` to `TodoItem`'s `onToggle` prop and re-derives `activeTodoCount` for the footer on every `setState({})`.
2. `src/app/item.js` — `TodoItem.toggle` calls `props.onToggle(todo)`.
3. `src/app/model.js` — `TodoModel.toggle` performs the actual immutable array update (`map` + spread) and calls `this.inform()`.
4. `src/app/util.js` — `store()` persistence helper invoked by `inform()`.
5. `src/app/footer.js` — renders `activeTodoCount` passed down as a prop.

**Count: 5 files / concepts** to fully trace one toggle from click to footer update, in the classic (pre-signals) idiom — this is the React-equivalent number, since the architecture is React-shaped (model class + `setState({})` "force update" pattern, itself a slightly unusual idiom worth flagging — `inform()` calls `this.setState({})` with an empty object purely to trigger a re-render, a pattern an agent would need outside context to recognize as intentional rather than a bug).

The **signals-based equivalent** collapses this meaningfully: a single module-scoped `todos = signal([...])` plus a `computed(() => todos.value.filter(t => !t.completed).length)` for the count means `TodoItem` calls `todos.value = todos.value.map(...)` directly and the footer's count signal updates itself — **2 touchpoints** (the signal/computed declarations, and the toggle call site), because there's no separate model class, no `inform()`/subscriber-callback wiring, and no manually-threaded `activeTodoCount` prop. This is the single clearest illustration in this review of what the signals layer *removes* structurally, not just stylistically — see Token-efficiency evidence for the corresponding line-count contrast.

### Evidence: Explicitness / data-flow traceability
Traced: clicking a todo's checkbox, end to end, in **both** idioms.

**Hooks/classic path** (5 hops, all explicit function calls):
1. `onClick` fires → `TodoItem.toggle(e)` (explicit handler, bound in JSX).
2. `toggle` calls `this.props.onToggle(todo)` (explicit prop-passed callback).
3. `App`'s handler calls `this.model.toggle(todo)` (explicit method call on a held reference).
4. `TodoModel.toggle` computes new array, calls `this.inform()` (explicit).
5. `inform()` calls the subscriber callback `() => this.setState({})`, which schedules Preact's re-render (the **one implicit hop** — "calling `setState({})` causes a re-render" is framework magic, but it's the *same* magic React developers already internalized).

**Signals path** (3 hops, one of which is intentionally "magic" by design):
1. `onClick` fires → handler reads `todo` from closure, writes `todos.value = todos.value.map(...)` (explicit assignment).
2. The `.value` setter notifies subscribers (implicit — this is the signal system's core mechanism, the one deliberate "magic" hop).
3. Any DOM node or `computed` that read `.value` during its last evaluation updates directly (implicit, but *narrowly scoped* — it updates only the specific bound node/computed, not "the component," which makes the blast radius easier to reason about than React-style "something upstream changed, now re-render and diff everything downstream").

**Net assessment**: signals trade one *broad* implicit hop (component re-render → VDOM diff → DOM patch, where "what re-rendered" requires DevTools to answer) for one *narrow* implicit hop (signal write → direct subscriber update, where "what updated" is a small, enumerable set). That's a real explicitness improvement, not just a performance one — it shrinks the search space an agent has to consider when asked "what does changing this value affect?"

### Evidence: Convention strength
Canonical task probed: **"fetch data when a component mounts."** Grepped Preact's own docs/guide tree and the broader ecosystem; found at least **four** distinct idiomatic-looking approaches in active circulation, with no single one declared canonical by the official docs:

1. **`useEffect` + manual `useState` triple** (`data`/`loading`/`error`) — the React-ported pattern, taught in the `preactjs.com/tutorial/07-side-effects` tutorial.
2. **`useEffect` + `useReducer`** for more complex async state machines — referenced in community guides as "the React way, ported."
3. **Signals-based async wrapper** — community pattern (e.g. `https://rodydavis.com/posts/async-preact-signal`) that creates a signal pair (`{ value, loading, error }`) and re-runs the fetch in an `effect()`, manually wiring `AbortController` cleanup — not in the official guide, but frequently cited in community Q&A.
4. **`@preact-signals/query`** — a third-party library that explicitly re-implements TanStack Query's API surface (`useQuery$`) for signals, cited directly from Preact ecosystem discussion threads (`preactjs/preact#4873`).

This is a genuine **convention gap**, and it traces directly back to the dual-track state story documented in State Management above: because the official guide presents signals as *optional* rather than canonical (*"The majority of application state ends up being passed around using props and context"* — preactjs.com/guide/v10/signals), the ecosystem hasn't converged on one async idiom the way, say, the React Query / TanStack Query ecosystem largely has converged for React. **Friction note:** I spent noticeably more effort here than for the State Management primitives themselves — the official docs simply don't address async/data-fetching as a first-class signals topic, and I had to triangulate across a personal blog post, a GitHub discussion thread, and a third-party npm package to map the landscape, which is itself the signal that no single canonical answer exists yet.

### Evidence: Token efficiency / boilerplate density
**Source: the official TodoMVC reference implementation**, `developit/preact-todomvc` (`https://github.com/developit/preact-todomvc`, also mirrored at `https://todomvc.com/examples/preact/`) — written by Preact's creator, Jason Miller (`developit`), to the standard TodoMVC spec, making it about as apples-to-apples a citation as this corpus can produce.

Line counts (excluding `index.html`/CSS, via `wc -l` on the `src/` JS tree):

| File | Lines | Role |
|---|---|---|
| `app/index.js` | 132 | App shell, routing, model wiring |
| `app/item.js` | 88 | Single todo item (edit/toggle/destroy) |
| `app/model.js` | 54 | Data layer + persistence |
| `app/footer.js` | 32 | Filter/count footer |
| `app/util.js` | 22 | `uuid`/`store` helpers |
| `index.js` | 7 | Entry point |
| **Total** | **335** | |

This is the **classic, pre-signals, class-Component idiom** — note this is the only canonical multi-file reference that exists; there is no official signals-based TodoMVC to cite as a counterpart (itself a data point about how far signals adoption has propagated into "canonical examples" territory — not very far yet, three-plus years after the `@preact/signals` 1.0 release). For comparison, the React TodoMVC reference this was explicitly ported from (`tastejs/todomvc` React example) runs to a similar order of magnitude — Preact's port is described by its author as "ES6 + Preact port of the ES5 + React TodoMVC example," underscoring how directly Preact's token cost mirrors React's for code written in React's idiom.

To illustrate the *signals* idiom's token cost concretely (my own minimal reduction, following the official signals guide's documented patterns at `preactjs.com/guide/v10/signals` — not a full TodoMVC, but the core add/toggle/derived-count slice that the Locality evidence above traced):

```jsx
import { signal, computed } from '@preact/signals';
import { useSignal } from '@preact/signals';

const todos = signal([]);
const remaining = computed(() => todos.value.filter(t => !t.completed).length);

function App() {
  const text = useSignal('');
  return (
    <div>
      <input value={text} onInput={e => text.value = e.currentTarget.value} />
      <button onClick={() => { todos.value = [...todos.value, { title: text.value, completed: false }]; text.value = ''; }}>Add</button>
      <ul>
        {todos.value.map(todo => (
          <li>
            <input type="checkbox" checked={todo.completed}
              onClick={() => todos.value = todos.value.map(t => t === todo ? { ...t, completed: !t.completed } : t)} />
            {todo.title}
          </li>
        ))}
      </ul>
      <p>{remaining} remaining</p>
    </div>
  );
}
```
~25 lines for add+toggle+derived-count+input-binding, with **no separate model class, no `inform()`/subscriber wiring, and no manually-threaded count prop** — directly reflecting the touchpoint reduction (5 → 2) measured under Locality of behavior. This is a real, measurable token-efficiency delta between Preact's two coexisting idioms, not just a stylistic preference.

### Evidence: Familiarity composite
Four proxies:
- **`first_released`: 2015** — over a decade old; "the smaller React" positioning has been stable messaging for most of that time, meaning training-data exposure is both broad (lots of React-shaped code that *is* Preact) and old (mature Stack Overflow corpus).
- **GitHub activity**: `preactjs/preact` — 38,684 stars, pushed 2026-06-06 (i.e., actively committed within the last 48 hours of this review), 149 open issues — healthy, current, not dormant. (`https://github.com/preactjs/preact`)
- **Registry trend**: `preact` on npm — 86.77M downloads in the most recent 30-day window (2026-05-04 to 2026-06-02; `https://api.npmjs.org/downloads/point/last-month/preact`); `@preact/signals` — 6.38M downloads in the same window, up from a year-over-year trajectory that roughly tripled (`@preact/signals-react`, the React-compat signals shim, went from ~1.25M/day-equivalent in mid-2025 to ~3.84M by mid-2026 per `api.npmjs.org/downloads/range/last-year`) — both **trending up**, with signals adoption growing notably faster than the base library, consistent with the team's promotional emphasis.
- **SO/community volume**: Because Preact's API is "the same modern API" as React by design, an enormous fraction of React Stack Overflow answers, blog posts, and tutorials apply near-verbatim — a genuine **structural overcount** in the model's favor that's worth naming explicitly (the inverse of htmx/Alpine's structural undercount): an agent's "React familiarity" substantially *is* "Preact familiarity" for everything except signals and the React/Preact interop seams documented under Type-system integration.

Triangulation: old, actively maintained, growing adoption, and uniquely able to borrow another framework's much larger familiarity footprint by design — but that borrowed footprint has a sharp edge at exactly the places (signals, `preact/compat` interop) where Preact diverges from React, which is where an agent's React-shaped intuitions actively mislead rather than help (see the `observed_delta` note in frontmatter for a direct illustration).

### Evidence: Stability / convention durability
Cited directly from `next_release` (frontmatter, reproduced here as the single source of truth per CLAUDE.md's instruction): **Preact 11.0.0-beta.0** (`https://github.com/preactjs/preact/releases/tag/11.0.0-beta.0`) is in active beta as of this review. Its categorized changes:
- **Breaking, mechanical**: drops IE11 support; moves `defaultProps` and automatic `px`-suffixing out of core into `preact/compat`; removes `Component.base`, `SuspenseList`, and "static dom bail"; raises the TypeScript floor to 5.1+; ships ESM as `.mjs`-only (drops `.module.js`).
- **Behavioral, convergent-with-React**: switches hook-dependency comparison to `Object.is` (enables `NaN` as a dependency, matching React's behavior) and reduces `forwardRef` boilerplate for function-component refs — both changes *narrow* the Preact/React behavioral gap rather than widen it.
- **New capability**: "Hydration 2.0" — components that suspend during SSR hydration can now return zero or multiple DOM nodes (previously constrained to exactly one per async boundary).

`next_release.stability_penalty: false` — and that's a deliberate, evidence-based call: every breaking change above has a documented, mechanical migration path (`https://preactjs.com/guide/v11/upgrade-guide/`), none of them touch the *conventions* this review scores (the signals/hooks dual-track story, the JSX/component model, the event-handling approach all carry forward unchanged), and the project's own track record — Preact X (10.0) shipped in 2020 and the ecosystem is *still* discussing "Preact X, a story of stability" (`https://preactjs.com/blog/preact-x/`) six years later — suggests the team treats major-version bumps as consolidation points, not paradigm resets. A community discussion thread (`preactjs/preact#4397`, "Is Preact 11 dead?") indicates the beta has moved slowly, which if anything *reinforces* low risk of near-term convention churn for anyone building on 10.x today.

### Evidence: Ecosystem tooling facts
- **DevTools**: yes — official browser extension, Chrome/Firefox/Edge (`https://github.com/preactjs/preact-devtools`, Firefox listing at `https://addons.mozilla.org/en-US/firefox/addon/preact-devtools/`). Shows component tree, props, hooks state, and signal values/subscriptions.
- **Test utilities**: yes, two layers — `preact/test-utils` (low-level, official, bundled with core) and `@testing-library/preact` (`https://github.com/testing-library/preact-testing-library`, officially documented at `https://preactjs.com/guide/v10/preact-testing-library/`), which ports the widely-known Testing Library query API/philosophy ("test the way users use your software") to Preact — meaning an agent that knows `@testing-library/react` idioms transfers that knowledge directly.
- **IDE/LSP support**: indirect but solid — Preact ships native TypeScript types (no separate LSP), and because its JSX/types model is React-shaped, the entire React TSX tooling chain (VS Code's built-in TS/JSX support, `typescript-language-server`) works without a Preact-specific plugin. The one friction point (documented under Type-system integration) is that React-typed *third-party* packages need manual `tsconfig` path remapping to interoperate cleanly — there's no automated tooling that does this for you.
- **Build tooling**: first-party Vite preset (`@preact/preset-vite`, scaffolded via `npm init preact`) is the team's current recommended path; `preact-cli`/WMR (older official scaffolds) are in reduced-maintenance status, which is itself a minor (but real, and undocumented-in-one-place) convention-durability wrinkle worth knowing if you encounter older Preact tutorials.

## On the Horizon

### Next release
- **Name/version:** Preact 11 (currently `11.0.0-beta.0`)
- **Status:** beta
- **What's changing:** IE11 support dropped; `defaultProps`/auto-`px`/`Component.base`/`SuspenseList` moved out of or removed from core; hook-dependency comparison switches to `Object.is`; "Hydration 2.0" allows multi-node/zero-node suspended components; reduced `forwardRef` boilerplate; ESM-only `.mjs` distribution; TypeScript 5.1+ required. Full list: `https://github.com/preactjs/preact/releases/tag/11.0.0-beta.0` and `https://preactjs.com/guide/v11/upgrade-guide/`.
- **Anticipated impact:** Net-narrows the Preact/React behavioral gap (good for Familiarity and for the `observed_delta` friction this review documents), with a documented mechanical migration path for every breaking change. Doesn't touch any of the conventions this review's evidence is built on — the signals/hooks dual-track story, JSX, event handling, and component model all carry forward.
- **Stability penalty:** No — see Stability evidence above for the full reasoning (mechanical migration path, six-year track record of "Preact X, a story of stability," and a community thread suggesting the beta is moving deliberately slowly rather than rushing a paradigm change).

### AI-tooling investment
- **What exists:** An official-feeling but **community-maintained** MCP server, `preact-mcp` (`https://github.com/JoviDeCroock/preact-mcp`), built by Jovi De Croock — a Preact **core team member** (also a maintainer of `@preact/signals` and `preact-render-to-string`) — though the repo itself lives under his personal GitHub account, not the `preactjs` org, which is why this review classifies it `party: "community"` rather than `first-party` (a real, checkable distinction: `rg "github.com/JoviDeCroock"` vs. `rg "github.com/preactjs"`). It exposes Preact documentation and ecosystem-repo READMEs as queryable MCP tools. Preact also publishes an official **`llms.txt`** at `https://preactjs.com/llms.txt` (verified live, returns the full v10 guide as structured markdown). No Boost-style curated guidelines package and no AI-specific style guide were found.
- **Observed delta:** see `ai_tooling.observed_delta` in frontmatter for the full before/after — summary: loading `llms.txt` context measurably reduced React-translation errors (correct `preact/hooks` imports, correct JSX-pragma assumptions) from two correction round-trips to zero, and caused the model to *proactively* surface the signals idiom as the more-current recommendation — but the delta was concentrated almost entirely on closing the "looks like React, isn't" gap rather than teaching anything Preact-specific from scratch. That's a useful, realistic data point: the tooling's biggest win is patching exactly the seam that Preact's own "same modern API" design choice creates.

---

## Anti-Patterns from Human-Era Thinking

- **The "it's just React" trap, cutting both ways.** Preact's entire pitch trains developers (and agents) to copy-paste React code and expect it to work — which it mostly does, until it hits one of the documented seams (event-prop casing, `class` vs `className`, `React.ReactElement` vs `VNode` type incompatibility, `defaultProps` location). Each seam is small, well-documented in isolation, but **collectively under-indexed as a single "things that differ" reference** — an agent has to discover them one GitHub issue at a time (see the four-issue citation chain under Type-system integration) rather than from one canonical "Preact for React developers, the complete diff" page.
- **Two valid state idioms, no canonical guidance on which to reach for.** The dual hooks/signals story (documented at length in State Management and Convention-strength evidence) is *architecturally* sound — it's a genuine, principled "local-first, signals-for-perf-or-cross-cutting" split — but the official docs don't tell you *when* to cross from one to the other, leaving that judgment call to per-developer taste. An agent generating new Preact code today has to infer "should this be `useState` or `useSignal`?" from context rather than from a stated rule.
- **The empty-object `setState({})` "force update" idiom** (visible in the official TodoMVC reference's `model.js`/`index.js` wiring) is a real, working pattern that looks like a bug to anyone — human or agent — who doesn't already know "calling `setState` with any argument schedules a re-render regardless of whether state actually changed." It's exactly the kind of implicit-but-load-bearing idiom that benefits enormously from being named explicitly in a comment, and isn't, in the canonical reference.

## Transferable Patterns for Next-Gen Framework

- **Signals' "pass-by-reference, subscribe-at-the-leaf" trick is a genuinely good idea worth generalizing.** The mechanism that lets a signal thread through five layers of props/context and update only the one DOM node that reads it — without involving any intermediate component's render function — is a clean, debuggable answer to "how do I avoid the all-or-nothing re-render question." A next-gen framework could make this the *only* path (no separate component-re-render layer to reason about at all), removing the "which layer does this value live in?" judgment call this review documents as a real cost.
- **Real DOM events, not synthetic wrappers, is the right default.** Preact's choice to skip React's SyntheticEvent layer is a measurable explicitness and tooling win (documented under Event Handling and Explicitness evidence) — MDN documentation applies directly, browser DevTools work without indirection, and there's no "wait, why doesn't `e.nativeEvent` exist" question to answer. A next-gen framework should treat "expose the platform's real objects" as a default to deviate from only with strong justification, not the other way around.
- **"Same modern API as X" is a powerful familiarity lever — but it needs a first-party, comprehensive seam-map to pay off for agents.** Preact gets enormous mileage from borrowing React's familiarity footprint, but the seams where it diverges are scattered across years of GitHub issues rather than collected in one place. A next-gen framework that deliberately mirrors an existing API surface (for the same familiarity win) should ship a single, comprehensive, versioned "differences from X" reference as a first-class doc artifact — not let it accrete as folklore.
