---
name: "XState"
category: "state-library"
github_url: "https://github.com/statelyai/xstate"
docs_url: "https://stately.ai/docs/xstate"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8.5
compiler_feedback_score: 7.5
locality_score: 6.5
explicitness_score: 7.5
convention_strength_score: 4.5
token_efficiency_score: 4
familiarity_score: 6
stability_score: 7.5
tooling_score: 6.5
version: "5.32.0"
type: "State Machine / Statechart Library"
npm_package: "xstate"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No official AI-tooling exists for XState consumers (the repo's own AGENTS.md/CLAUDE.md are contributor-facing, for working on the xstate monorepo itself, not for app developers using the library). Running the canonical fetch-machine exercise with no special tooling, the model produced a `setup({ types: ... })` machine with `fromPromise` invoke and correctly typed events on the first attempt — the typed-events API is regular enough and well-represented enough in training data that the absence of curated guidelines was not a major handicap. The one recurring miss without guidance: forgetting `assign()` is required for any context mutation (writing `actions: ({ context }) => { context.count++ }` directly, which silently does nothing) — a footgun specific to XState's immutable-context model that generic JS/TS training doesn't anticipate."
next_release:
  name: null
  status: null
  changes: "xstate core is at 5.32.0 (2026-05-27), continuing the v5 minor/patch series with incremental additions (e.g. exporting `InspectedTransitionEvent`). @xstate/react reached a breaking 6.0.0 in mid-2025 (bumped peer dependency to xstate ^5.20.0) and 6.1.0 (2026-02-26) added a behavioral change where `useActor`/`useSelector` now throw on actor error states for React error-boundary integration. No v6 of core xstate, and no rewrite, is on the public roadmap as of 2026-06-09."
  anticipated_impact: "Low for core API stability; the @xstate/react 6.1.0 error-throwing change is a meaningful behavioral shift (errors that previously sat silently in an 'error' state snapshot now propagate to error boundaries) that existing v5-era code/tutorials may not anticipate."
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
paradigm: "declarative"
state_model: "reactive-properties"
maintainer: "Stately (statelyai)"
first_released: "2018"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full from-scratch rewrite under the 9-dimension agentic-dev rubric — the previous file had null scores and the pre-rubric per-capability-area structure. Versions verified via `npm view xstate version` (5.32.0) and `npm view @xstate/react version` (6.1.0). Reviewed as used in its primary context: React + TypeScript, via `setup()` + `createMachine` + `@xstate/react`. XState is a fundamentally different paradigm from the immutable-update (Redux/Zustand), observable (MobX), and atomic (Jotai) libraries already in the corpus — state transitions are an explicit machine-config DSL, not reducers or direct mutation, which shows up most sharply in the convention-strength and token-efficiency scores below."
---

# XState

## State Management

### Philosophy & Mental Model

XState models application logic as **finite state machines and statecharts**, executed via the **actor model**. The core claim: most UI bugs come from "impossible states" — `loading: true` and `error: "..."` both set, or a checkout flow that's simultaneously `submitting` and `editable`. A state machine makes those combinations structurally unrepresentable: the machine is in exactly one (possibly hierarchical/parallel) state at a time, and `context` (plain data) is mutated only through `assign()` actions attached to explicit transitions.

Mental model: instead of a bag of independent `useState` calls that *could* combine into 2^n configurations, you enumerate the actual reachable states (`idle`, `loading`, `success`, `error`) and the events that move between them (`FETCH`, `RESOLVE`, `REJECT`, `RETRY`). Anything not listed as a transition from the current state is simply ignored.

Core principles:
- **States are enumerated, not inferred** — `idle | loading | success | error`, never an ad hoc combination of booleans
- **Transitions are total functions over (state, event)** — same state + same event always produces the same result
- **Context (`assign`) is the only mutable data**, and it can only change inside a transition's `actions`
- **Hierarchical and parallel states** let you compose machines without combinatorial explosion
- **Actors** (machines, promises, callbacks, observables) communicate by sending typed events — this is XState's model for async work, child processes, and cross-machine communication

### Core Primitives

- **`setup({ types, actors, actions, guards })`** — declares the TypeScript shape of `context`/`events`/`input` and registers named actors/actions/guards for reuse. Returns an object with `.createMachine(config)`.
- **`createMachine(config)`** — defines `id`, `initial`, `context`, `states` (each with `on` transitions, `entry`/`exit` actions, `invoke`, `after`), can be called directly (untyped/looser) or via `setup(...).createMachine(...)` (typed).
- **`assign({...})`** — the only primitive that mutates `context`; takes either a partial object or a function of `{ context, event }`.
- **`createActor(machineOrLogic, options)`** — instantiates a machine (or any actor logic) into a running actor; `.start()`, `.send(event)`, `.subscribe(fn)`, `.getSnapshot()`.
- **Actor logic creators** — `fromPromise`, `fromCallback`, `fromObservable`, `fromTransition` — wrap non-machine async/sync logic so it can be `invoke`d or `spawn`ed as a child actor.
- **`@xstate/react`** — `useMachine`, `useActor`, `useActorRef`, `useSelector`, `createActorContext` — the React binding layer.

```typescript
import { setup, assign } from 'xstate';

const counterMachine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'INCREMENT' } | { type: 'DECREMENT' },
  },
}).createMachine({
  id: 'counter',
  context: { count: 0 },
  on: {
    INCREMENT: { actions: assign({ count: ({ context }) => context.count + 1 }) },
    DECREMENT: { actions: assign({ count: ({ context }) => context.count - 1 }) },
  },
});
```

### Update Mechanism

State changes only happen by **sending an event to a running actor**. The machine config declares, per state, which events are handled and what `actions`/`target` they trigger:

```typescript
const actor = createActor(counterMachine);
actor.start();

actor.send({ type: 'INCREMENT' }); // context.count: 0 -> 1
actor.send({ type: 'BOGUS' });     // ignored — not a defined transition (TS error if typed)
```

`assign` is the only way `context` changes — direct mutation inside an action function (`context.count++`) is silently ignored because XState treats context as immutable between transitions and clones it via `assign`'s declarative updater.

### Read Pattern

In React, `useMachine` (own actor, component-scoped) or `createActorContext` (shared actor via React Context) are the two documented entry points:

```typescript
import { useMachine } from '@xstate/react';

function Counter() {
  const [state, send] = useMachine(counterMachine);

  return (
    <div>
      <p>Count: {state.context.count}</p>
      <button onClick={() => send({ type: 'INCREMENT' })}>+</button>
      {state.matches('loading') && <Spinner />}
    </div>
  );
}
```

`state.value` is the current state node (e.g. `'loading'`, or `{ loggedIn: 'idle' }` for hierarchical machines), `state.context` is the data, `state.matches(...)` and `state.can(...)` answer "am I in this state" / "would this event do anything right now."

### Reactivity & Granularity

`useMachine`/`useActor` re-render the component on every snapshot change by default (whole-actor subscription). `useSelector(actorRef, selector)` and `createActorContext(...).useSelector(fn)` narrow this to a derived value, re-rendering only when that value changes — structurally identical to Zustand's selector pattern, but layered on top of the actor's snapshot rather than a plain object.

Hierarchical states scope which transitions are even reachable: a `LOGOUT` handler defined on a parent `loggedIn` state fires from any of its child states (`idle`, `loading`, `error`) without being redeclared in each. Parallel states (`type: 'parallel'`) let independent regions (e.g. `audio` and `video` playback state) update without affecting each other's snapshot region.

### Async Handling

Async work is modeled as a **child actor invoked by a state**, using `fromPromise` (or `fromObservable`/`fromCallback` for streams/event sources):

```typescript
import { setup, assign, fromPromise } from 'xstate';

const userMachine = setup({
  types: {
    context: {} as { user: User | null; error: string | null },
  },
  actors: {
    fetchUser: fromPromise(async ({ input }: { input: { id: string } }) => {
      const res = await fetch(`/api/users/${input.id}`);
      if (!res.ok) throw new Error('not found');
      return res.json();
    }),
  },
}).createMachine({
  id: 'user',
  initial: 'idle',
  context: { user: null, error: null },
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: {
      invoke: {
        src: 'fetchUser',
        input: ({ context, event }) => ({ id: (event as any).id }),
        onDone: { target: 'success', actions: assign({ user: ({ event }) => event.output }) },
        onError: { target: 'failure', actions: assign({ error: ({ event }) => String(event.error) }) },
      },
    },
    success: {},
    failure: { on: { RETRY: 'loading' } },
  },
});
```

The actor starts on entering `loading` and is automatically torn down on exit (success, failure, or any other transition out) — there is no manual cleanup/cancellation bookkeeping for the common case.

### Derived State

Derived values are computed from `state.context` / `state.value` inline at the call site, same as any other state library — XState has no memoized-selector primitive of its own:

```typescript
const total = state.context.items.reduce((sum, i) => sum + i.price, 0);
const isLoading = state.matches('loading');
const canRetry = state.can({ type: 'RETRY' });
```

**Guards** are XState's mechanism for conditional transitions — a declarative alternative to branching inside an action:

```typescript
on: {
  SUBMIT: [
    { guard: ({ context }) => context.attempts < 3, target: 'submitting' },
    { target: 'blocked' },
  ],
}
```

## Rendering

XState is **rendering-agnostic** — it ships official bindings for React (`@xstate/react`), Vue (`@xstate/vue`), Svelte (`@xstate/svelte`), and Solid (`@xstate/solid`), plus a framework-agnostic core (`createActor` + `subscribe`). The machine itself never touches the DOM; a component reads `state.value`/`state.context` and renders normally.

## Event Handling

All interaction funnels through `actor.send({ type: '...', ...payload })`. There is no separate "event system" beyond this — DOM events call `send`, which the machine either accepts (defined transition) or silently ignores (no transition for that event in the current state):

```typescript
const [state, send] = useMachine(machine);

<button onClick={() => send({ type: 'INCREMENT' })}>+</button>
<button onClick={() => send({ type: 'SET_COUNT', value: 10 })}>Set to 10</button>
```

**Delayed transitions** (`after`) and **wildcard transitions** (`'*'`) are declared in the machine config rather than as imperative `setTimeout`/`catch-all` handlers:

```typescript
submitting: {
  after: { 3000: 'timeout' },
  on: { SUCCESS: 'success', '*': 'error' },
}
```

## Rubric Evidence

### Evidence: Type-system integration

**Classification: native.** XState v5 is authored in TypeScript and the `setup({ types: {...} })` API was specifically redesigned in v5 to make context/event/input types flow through `createMachine`, `assign`, guards, and actors without manual typegen (the v4→v5 migration guide states "TypeScript inference has been greatly improved in XState v5," reducing the need for the old `@xstate/cli` typegen step).

Verified directly with `tsc --strict` against `xstate@5.32.0` (`npm view xstate version` confirms this is current stable). Deliberate errors introduced into a `setup()`-typed counter machine:

```typescript
const counterMachine = setup({
  types: {
    context: {} as { count: number },
    events: {} as
      | { type: 'INCREMENT' }
      | { type: 'DECREMENT' }
      | { type: 'SET'; value: number },
  },
}).createMachine({
  // ...
  states: {
    active: {
      on: {
        SET: {
          actions: assign({
            count: ({ event }) => event.amount, // (1) typo: 'amount' doesn't exist
          }),
        },
      },
    },
  },
});

actor.send({ type: 'INCREMETN' }); // (2) typo'd event type
actor.send({ type: 'SET' });       // (3) missing required 'value'
```

Compiler output (`tsc --strict --target es2020 --lib es2020,dom --moduleResolution bundler`):

```
error-test.ts(31,41): error TS2339: Property 'amount' does not exist on type '{ type: "SET"; value: number; }'.
error-test.ts(43,14): error TS2820: Type '"INCREMETN"' is not assignable to type '"INCREMENT" | "DECREMENT" | "SET"'. Did you mean '"INCREMENT"'?
error-test.ts(46,12): error TS2345: Argument of type '{ type: "SET"; }' is not assignable to parameter of type '{ type: "INCREMENT"; } | { type: "DECREMENT"; } | { type: "SET"; value: number; }'.
  Property 'value' is missing in type '{ type: "SET"; }' but required in type '{ type: "SET"; value: number; }'.
```

All three errors are precise, point at the exact expression, and even produce a "did you mean" suggestion for the typo'd event type — this is the union-of-string-literals exhaustiveness checking TypeScript is good at, and the `setup({ types })` API routes context/event types through `assign` callbacks and `send()` calls correctly.

**Caveat**: this strong inference applies to the `setup()` + `createMachine` path. The older `createMachine<Context, Event>(config)` generic-parameter style (still valid, and what most pre-2024 tutorials/training data show) infers far less — `assign` callback parameters and `send` payloads frequently fall back to `any` or require manual type assertions. An agent working from older XState v4/early-v5 examples will reach for the weaker pattern unless it specifically knows to prefer `setup()`.

Scored 8.5 (not higher) because the `setup()` API is the *correct* answer but is one of two coexisting APIs with very different inference quality, and `context.count++`-style direct mutation inside an action — a natural thing to write — type-checks fine (actions can be arbitrary functions) but **silently does nothing at runtime**, which the type system cannot catch.

### Evidence: Compiler/build feedback quality

Same test as above — the three TypeScript errors are the actual build feedback an agent or developer gets. All three are **actionable without consulting docs**: error 1 names the missing property (`amount`) and the type it should match; error 2 is a literal-union mismatch with a spell-check suggestion; error 3 names the missing required field. None require understanding XState internals — they're plain TypeScript discriminated-union errors surfaced because `setup({ types })` declared the unions correctly.

**Runtime feedback for the silent-mutation footgun** (not caught by the compiler): if an action is written as

```typescript
actions: ({ context }) => { context.count = context.count + 1; } // no assign()
```

this compiles cleanly (the action's return type is `void`, which is valid) but `context.count` never changes — there is no runtime warning, console message, or thrown error. The only feedback is "the UI didn't update," which then requires knowing that `assign()` is mandatory for context writes. This is the single most-cited beginner confusion in XState discussions and is a real gap in the feedback loop: the failure mode is silent rather than loud.

**Build-level**: XState ships ESM + CJS builds via standard `tsup`/Rollup tooling; no custom build step or compiler plugin is required (no XState-specific Babel/Vite plugin to misconfigure), which removes a whole category of build-config errors common to compiler-driven frameworks.

Documentation friction note: locating the *current* canonical typing pattern took extra effort — `stately.ai/docs` mixes `setup()`-based examples (the v5-recommended approach) with bare `createMachine<Context, Event>(...)` examples in adjacent guides (e.g. the actors/invoke pages lean more on `setup()`, while some older blog-linked guides still show the generic-parameter style), without a single page stating "always prefer `setup()`." An agent generating from a mixed corpus could plausibly produce either style.

### Evidence: Locality of behavior

**Feature traced**: the official TodoMVC reference implementation (`statelyai/xstate` repo, `examples/todomvc-react`) — add/edit/delete todos, toggle complete, filter by all/active/completed, persist to `localStorage`, sync filter with the URL hash.

Touchpoints to understand or change this feature:

1. `src/todosMachine.ts` (135 lines) — the entire state shape (`context.todos`, `context.todo`, `context.filter`), every event type (`newTodo.commit`, `todo.mark`, `todo.delete`, `filter.change`, etc.), and every transition's `assign` logic. All behavioral logic lives here.
2. `src/App.tsx` (31 lines) — wires `createActorContext(todosMachine, { state: ... })` and provides it; this is where `localStorage` initial-state hydration is read.
3. `src/Todos.tsx` (161 lines) — top-level list component: reads `context.todo`/`context.todos`/`context.filter` via `TodosContext.useSelector`, persists to `localStorage` in a `useEffect`, syncs the URL hash via a custom `useHashChange` hook, renders the filter footer.
4. `src/Todo.tsx` (171 lines) — individual todo row: editing state, double-click-to-edit, calls `send({ type: 'todo.commit' | 'todo.delete' | 'todo.mark', ... })`.
5. `src/useHashChange.ts` (9 lines) — a small custom hook bridging `window.location.hash` to `filter.change` events.

Total: **5 files, 507 lines** (excluding the 73-line ambient `.d.ts` and CSS). Compare to the Zustand TodoMVC-equivalent reviewed in this corpus at 54 lines / 2 files (store + component) for the same all/active/completed filter feature set (the Zustand version omits localStorage persistence and URL-hash sync, which would add some lines but not 10x).

The state-transition logic itself (file 1) is genuinely centralized — every event the app can handle and every context change is in one 135-line file, which is a real locality win *for the state-machine logic specifically*. But the feature as a whole is not more local than alternatives: the machine file must still be cross-referenced against the consuming components to know which `send()` calls exist, and XState's actor-context wiring (`createActorContext`, `Provider`, `useSelector`, `useActorRef`) adds a layer (file 2) that plain `useState`/Zustand don't need.

Scored 6.5: high marks for "all transitions in one file" (a real, citable property — see Explicitness below), moderate deduction because the actor/context plumbing and the event-vocabulary cross-referencing add touchpoints beyond what an equivalent Zustand or even plain `useReducer` implementation needs.

### Evidence: Explicitness / data-flow traceability

**Action traced**: user types a new todo and presses Enter → todo appears in the list (using the official TodoMVC machine, `examples/todomvc-react`).

Hops:

1. **[explicit]** `<input onKeyDown={...}>` in `Todos.tsx` calls `send({ type: 'newTodo.commit', value: e.target.value })` — direct call, no indirection.
2. **[explicit]** XState's actor receives the event, looks up the `'newTodo.commit'` handler on the current (root) state node — this is a config lookup (`on: { 'newTodo.commit': {...} }`), not a function call, but it's a single declared table the developer wrote.
3. **[explicit]** The `guard: ({ event }) => event.value.trim().length > 0` runs — if false, the event is a no-op (also explicit: visible in the same config block).
4. **[explicit]** `assign({ todo: '', todos: ({ context, event }) => [...context.todos, newTodo] })` runs — the new context is computed.
5. **[implicit]** The actor's internal microstep loop replaces the snapshot and notifies subscribers (`listeners.forEach`) — one shallow internal hop, same shape as Zustand's notification dispatch, not visible at the call site but documented and shallow.
6. **[explicit]** `TodosContext.useSelector((s) => s.context.todos)` in `Todos.tsx` — React re-renders because the selected slice changed. The dependency is declared at the call site.

Summary: **5 explicit hops, 1 implicit hop**. The explicit hops are *unusually* explicit compared to imperative state libraries — step 2 (event → transition lookup) and step 3 (guard) are declarative table lookups rather than function calls, which is a different *kind* of explicitness: you can see the entire transition table for a state in one place, but tracing "what happens when this event fires" requires reading a config object as a lookup table rather than following a call stack. This is XState's central trade-off: **the machine config is a complete, inspectable map of all transitions** (better than scattered `if` statements for *completeness*), but it's a layer of DSL indirection from "normal" imperative code that a `grep`-for-function-definition habit doesn't directly match — you grep for the event-name string instead.

Scored 7.5: docked from Zustand's 8.5 specifically for this DSL-indirection cost (transition lookup is a config-table traversal, not a function call you can "go to definition" on in the same way), but credited above plain `useReducer`/Redux for the guard step being a named, inspectable, side-effect-free predicate rather than buried inside a reducer's `switch` branch.

### Evidence: Convention strength

**Task selected**: "fetch data when entering a state" (the async-data-on-mount equivalent for a state machine).

The official docs (`stately.ai/docs/actors`) present a single canonical primitive — `invoke` with `fromPromise`, `onDone`/`onError` — and this is consistently the answer across the v5 docs. Within that, however, there are **four actor-logic creators** the docs present as siblings for "async work," each idiomatic for a different shape of operation:

1. **`fromPromise`** — one-shot fetch, the `onDone`/`onError` pattern shown above. The default recommendation for "fetch on entering a state."
2. **`fromCallback`** — for operations that need bidirectional messaging (`sendBack`/`receive`) or where promise rejection needs custom handling outside `onError`.
3. **`fromObservable`** — for streaming/continuous data sources.
4. **`fromTransition`** — reducer-style, for synchronous logic that still benefits from being modeled as a spawned actor.

Beyond actor-logic-creator choice, **when to reach for XState at all vs. `useState`/`useReducer`/Zustand for "data + loading + error" state has no canonical answer in the official docs** — `stately.ai/docs/xstate-react` documents the React hooks (`useMachine`, `useActor`, `useSelector`, `createActorContext`) without comparative guidance, and the "when to use XState" question is answered exclusively by third-party blog posts (e.g. dev.to's "useState vs useReducer vs XState" series, Makers Den's "State Management Trends in React 2025") that each draw the line differently — some recommend XState only for "3+ interdependent states," others for any async flow with retries, others only for genuinely multi-actor systems (auth + websocket + form wizard composition).

This is a sharper convention-strength gap than the within-XState actor-creator choice: **the ecosystem has one clear answer for "how do you fetch inside a machine"** (use `fromPromise` + `invoke`), but **no clear answer for "should this feature be a machine at all"** — which is the decision an agent actually needs to make first, every time, and currently has to infer from heuristics rather than docs.

Scored 4.5: the in-machine async pattern itself is conventional (1 clear primitive among 4 named alternatives for different async shapes — reasonable, not sprawling), but the upstream "XState or not" decision — which determines whether any of this applies — is undocumented by the framework itself and answered only by a scattered, non-authoritative blog corpus with materially different thresholds.

### Evidence: Token efficiency / boilerplate density

**Canonical reference used**: the official TodoMVC example in the `statelyai/xstate` monorepo, `examples/todomvc-react` (uses `xstate@^5.28.0`, `@xstate/react@^4.1.3` per its `package.json` — current core is 5.32.0, confirming the example targets a recent v5). This is the first-choice path per the research brief: a vetted reference implementation built to the TodoMVC spec by the framework's own maintainers.

Line counts (`wc -l`, excluding `.d.ts`/CSS/config):

| File | Lines | Purpose |
|---|---|---|
| `src/todosMachine.ts` | 135 | All state, events, transitions, `assign` logic |
| `src/App.tsx` | 31 | `createActorContext` + Provider wiring |
| `src/Todos.tsx` | 161 | List rendering, filter footer, localStorage persistence, URL hash sync |
| `src/Todo.tsx` | 171 | Per-item rendering, inline edit |
| `src/useHashChange.ts` | 9 | Hash-change hook |
| **Total** | **507** | |

For comparison, this corpus's Zustand review implements an equivalent (add/toggle/filter, no localStorage/hash-sync) todo app in **54 lines** across 2 files following the official Zustand style guide. Even accounting for the ~70-80 lines of localStorage + URL-hash-sync logic that the Zustand version omits, the XState TodoMVC is roughly **5-7x larger** for materially the same feature set. The bulk of the difference is not the machine file itself (135 lines is comparable to what a thorough `useReducer` reducer + action-type definitions would run) but the surrounding actor-context plumbing and the verbosity of `assign({...})` callback objects — every context update is a named-key object with a function value, vs. Zustand's direct `set((s) => ({...}))` spread.

The single-file `setup().createMachine()` counter shown in this review's State Management section is **~18 lines** for a two-action counter — compare to the Zustand equivalent at ~7 lines (`create<State>()((set) => ({ count: 0, increment: ..., decrement: ... }))`), or React's bare `useState`/`useReducer` at 1-3 lines. XState's per-feature floor is structurally higher because every transition requires declaring its triggering event, target/actions, and (for typed machines) a corresponding entry in the `events` union.

Scored 4.0: XState is the most token-expensive state-management approach in this corpus for small-to-medium features, by a wide and citable margin (the official reference implementation itself, not a freehand attempt, demonstrates this). This cost buys explicit transition-table completeness (see Explicitness/Convention evidence), but it is a real, measured cost.

### Evidence: Familiarity composite

Four proxies triangulated:

**1. First released**: 2018 (early `xstate` npm publishes; v5 — the API reviewed here — released December 2023 per the Stately blog "XState v5 is here"). ~8 years old overall, but the *current* idiomatic API (`setup()`, `createActor`, `fromPromise`) is only ~2.5 years old, meaning a meaningful fraction of pretraining-era examples use the v4 API (`Machine()`, `interpret()`, `services`, `withConfig`) which is renamed/restructured in v5.

**2. GitHub activity**: 29,693 stars, 1,362 forks (verified via GitHub API, 2026-06-09), `pushed_at: 2026-06-06` — actively maintained with recent commits. Compare to Zustand's 58,200 stars — XState has roughly half the GitHub footprint of the most popular React state library in this corpus.

**3. npm registry trend**: `xstate` core at ~21M downloads/month (npm download-stats API, 30-day window ending 2026-06-02), `@xstate/react` at ~13.5M-537K/day range across the last year showing a clear upward trend (239K/day in June 2025 to 537K/day in June 2026 — roughly 2x growth over 12 months). For scale comparison: Zustand sits at ~159M/month and Redux at ~141M/month in the same window — XState core is roughly an order of magnitude smaller by download volume than the most-downloaded state libraries in this corpus, though `@xstate/react`'s year-over-year growth rate is comparable to or steeper than Zustand's.

**4. Community volume**: XState is consistently present in "state management 2025/2026" comparison roundups (Makers Den, dev.to, Frontend Masters has a dedicated paid course "State Modeling in React with XState") — strong *niche* community presence specifically around the state-machine paradigm, but it is the "specialist" recommendation in these roundups rather than the default. Stack Overflow tag-volume could not be directly verified during this review (stackoverflow.com fetch blocked in this environment); GitHub Discussions activity (visible via the repo) shows steady but lower-volume traffic than mainstream state libraries.

**Triangulation**: XState is well-established (8 years), actively maintained, and has a real (if smaller) download base with positive trend — but it occupies a specialist niche relative to Zustand/Redux/Jotai, its current idiomatic API is comparatively young (v5, ~2.5 years), and its download volume is roughly an order of magnitude below the corpus's most familiar state libraries. Scored 6.0 — solidly "a model has seen this," but with materially less density and a live v4/v5 API-version split in what training data does exist.

### Evidence: Stability / convention durability

**v5 (December 2023)** was the last major rewrite, and it was substantial: `Machine()` → `createMachine()`, `interpret()` → `createActor()`, `withConfig()` → `provide()`, `withContext()` → `input`-based initialization, `services` → `actors`, action/guard signatures changed from positional args to a single `{ context, event }` object, `schema` → `types`, and `state.events`/`state.history`/`state.nextEvents`/`state.done` were all removed (migration guide: `stately.ai/docs/migration`). This is a near-total API renaming relative to v4 — any v4-era code or training data requires substantial rewriting, not incremental patching.

**Current state (v5.x series, now at 5.32.0 as of 2026-05-27)**: per `npm view xstate time`, the v5.x series has shipped roughly monthly minor/patch releases since late 2025 (5.25.0 → 5.32.0, December 2025 → May 2026) with no breaking changes to the core machine/actor API — additions like exporting `InspectedTransitionEvent` (5.32.0) are additive.

**`@xstate/react` had its own breaking major in mid-2025** (6.0.0, bumping its `xstate` peer dependency to `^5.20.0`), and 6.1.0 (2026-02-26, per `npm view @xstate/react time`) introduced a **behavioral** (not just type-level) change: `useActor`/`useSelector` now *throw* when the underlying actor reaches an error state, intended for React error-boundary integration. Code written against `@xstate/react` 5.x that relied on inspecting `state.matches('error')` without an error boundary will now see uncaught exceptions after upgrading to 6.1.0 — this is a real behavioral migration trap that is easy to miss since it's framed as an additive feature ("now throw... allowing errors to be caught") rather than a breaking change in the patch notes' framing.

`next_release` frontmatter: no name/status — no v6 of core `xstate` or further `@xstate/react` major is on the public roadmap as of this review.

**Stability penalty: no** — `stability_penalty: false`. The core v5 API (the one reviewed here) has been stable for ~2.5 years and the recent minor/patch series is additive-only. However, this "no penalty" verdict applies specifically to *new* code written against the current `setup()`/`createActor`/`fromPromise` API and current `@xstate/react` 6.1.x; it does **not** extend to the large body of v4-era and early-v5 tutorial content that still circulates, which requires the v4→v5 migration guide to update.

Scored 7.5: the core API is genuinely settled and the maintainers (Stately) are stable and active, but the v4→v5 rewrite was one of the more disruptive major-version transitions in this corpus's state-library set, and the `@xstate/react` 6.1.0 error-throwing behavioral change is exactly the kind of "quiet but breaking" change that erodes confidence that "how it's done today" code will behave identically after a routine `npm update`.

### Evidence: Ecosystem tooling facts

**DevTools / Inspection**
- `@statelyai/inspect` (npm, v0.7.1) — browser-based actor inspector; connects to running actors via `createActor(machine, { inspect: ... })` and visualizes state/transitions live. (https://www.npmjs.com/package/@statelyai/inspect)
- **Stately Studio** (stately.ai/editor) — visual editor/inspector for machines; can import/export XState v5 code. Free tier available, paid tiers for team features.
- XState VS Code extension (`statelyai.stately-vscode`, marketplace) — provides autocomplete, inline visualization, and `.xstate` snippet support. **As of this review, the extension's v5 support is incomplete** — the official docs (`stately.ai/docs/xstate-vscode-extension`) and Stately's own roadmap acknowledge v5 compatibility is "a priority" and "work is already underway," meaning the primary IDE tool lags ~2.5 years behind the current core API. (https://marketplace.visualstudio.com/items?itemName=statelyai.stately-vscode)

**Test utilities**
- No dedicated, current testing package. `@xstate/test` (last published as v0.5.1) is **explicitly deprecated** on npm: `npm view @xstate/test deprecated` returns `"Please use @xstate/graph instead."`
- Model-based testing utilities now live in `xstate/graph` (part of core `xstate`, `@xstate/graph` v3.0.4 standalone also exists) for generating test paths from a machine definition.
- The documented v5 testing pattern (`stately.ai/docs/testing`) is plain Vitest/Jest: `createActor(machine)`, `.send(...)`, assert on `.getSnapshot()` — no XState-specific assertion library.

**IDE / LSP support**
- TypeScript LSP: yes, full inference for `setup()`-typed machines (hover types, go-to-definition on context/event shapes) — native `.d.ts`, no separate types package.
- No standalone XState language server beyond the VS Code extension above.

**Summary checklist**:
- [x] Visual inspector / devtools (`@statelyai/inspect`, Stately Studio) — links above
- [x] TypeScript LSP (native types, strong inference for `setup()` machines)
- [ ] Dedicated test utility package — `@xstate/test` deprecated; replacement (`xstate/graph`) is a model-based-testing generator, not a general test-helper library
- [~] VS Code extension exists but **acknowledged-incomplete v5 support** as of this review
- [x] Multi-framework bindings (`@xstate/react`, `@xstate/vue`, `@xstate/svelte`, `@xstate/solid`) all on current major versions

Scored 6.5: the visual-tooling story (Stately Studio, `@statelyai/inspect`) is a genuine differentiator no other library in this corpus has, but the two most load-bearing "everyday" tools — the VS Code extension and a non-deprecated test-helper package — are both in an acknowledged gap state for the v5 API that's been current for 2.5 years.

## On the Horizon

### Next release
- **Name/version:** No announced v6 of core `xstate`. `@xstate/react` is at 6.1.0 (2026-02-26); no further major announced.
- **Status:** null — no alpha/beta/RFC for a core rewrite is publicly tracked.
- **What's changing:** Continued v5.x minor/patch releases (5.32.0 most recent, 2026-05-27) — additive only (e.g. new exported types). Stately's public roadmap priorities are tooling catch-up (VS Code extension v5 support, Stately Studio v5 feature parity for input/output/action params) rather than core API changes.
- **Anticipated impact:** Low for the reviewed API surface. The main open risk is downstream: the `@xstate/react` 6.1.0 error-boundary-throwing change (see Stability evidence) is a behavioral trap for code upgrading from 5.x without adding error boundaries.
- **Stability penalty:** no — see Stability evidence above; core v5 API has been stable since December 2023.

### AI-tooling investment
- **What exists:** Nothing XState-consumer-facing. The `statelyai/xstate` repo has `AGENTS.md`/`CLAUDE.md` files, but these are **contributor-facing** (instructions for AI agents working on the XState monorepo itself — "run `pnpm test`," "run `pnpm changeset`") and provide no guidance for an agent *using* XState in an application. No `llms.txt`, no official MCP server, no Boost-style curated guidelines, no AI-specific style guide. (Note: `@statelyai/agent` exists but is the inverse — a framework for *building LLM agents using XState as the orchestration layer* — not tooling to help an AI write XState code.)
- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter. With no tooling active, generating a `setup()`-based fetch machine produced correctly-typed events and `fromPromise` usage on the first attempt — the typed-events pattern is regular and well-represented enough in general training data. The recurring failure mode observed was unrelated to typing: writing a context-mutating action without `assign()`, which type-checks but is a silent no-op at runtime (see Compiler/build feedback evidence). No tooling exists to compare against for a "with vs. without" delta on this specific footgun.

---

**Key insight for next-gen framework design**: XState demonstrates that an explicit, enumerable transition table is a powerful correctness tool — `rg` for an event name across a 135-line machine file genuinely does answer "what can happen and what does it change," which is a stronger guarantee than grepping a Redux reducer's `switch` or a Zustand store's action methods. But this review's evidence also shows the costs are not hypothetical: 5-7x the lines of the simplest equivalent (Zustand), a convention vacuum around *when* to reach for a machine at all, and a silent-failure footgun (`assign`-less mutation) that the type system cannot catch.

The actionable takeaway is the one the previous version of this review already identified and this rewrite's evidence reinforces: **state-machine semantics are valuable as an opt-in primitive for the subset of state that is genuinely transition-shaped** (auth flows, wizards, anything with retries/timeouts/concurrent regions), not as the default unit of state. A next-gen framework's "normal" state primitive should look like Zustand's `create()` (cheap, ~7 lines, direct), with a machine/statechart escape hatch available for the minority of state that benefits from exhaustive transition enumeration — and that escape hatch should make `assign`-vs-direct-mutation a compile error, not a silent runtime no-op.
