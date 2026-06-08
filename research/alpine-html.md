---
name: "Alpine.js + HTML"
category: "utility-library"
github_url: "https://github.com/alpinejs/alpine"
docs_url: "https://alpinejs.dev"
implementation_language: "JavaScript"
status: "active"
type_system_score: 2
compiler_feedback_score: 2.5
locality_score: 9
explicitness_score: 7
convention_strength_score: 7.5
token_efficiency_score: 8
familiarity_score: 6.5
stability_score: 8
tooling_score: 5
version: "3.15.12"
type: "Reactive HTML-Attribute Library"
npm_package: "alpinejs"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No first-party AI tooling exists for Alpine.js (no MCP server, no Boost-style curated guideline package, no llms.txt at alpinejs.dev — both /llms.txt and /llms-full.txt 302-redirect to the docs homepage rather than serving a dedicated file). The closest analogues are community VS Code extensions (Alpine.js Tools, Alpine.js IntelliSense — see Tooling evidence) that surface directive/magic-property hover docs. Ran the canonical 'add + toggle a todo' slice (the same slice cited in Token-efficiency evidence, modeled on https://github.com/laracasts/todomvc-alpine) once cold and once after loading https://alpinejs.dev/directives/data and https://alpinejs.dev/directives/for into context. Cold, the model wrote a plausible `x-data`/`x-for` pair but used `x-model=\"todo.completed\"` on the checkbox AND a separate `@click` handler to persist — duplicating the mutation path (the canonical repo uses `x-model` purely for two-way binding and drives persistence from `@click=\"toggleTodoCompletion(todo)\"` alone, see Explicitness evidence). After loading the two doc pages, the model converged on the canonical single-path pattern. As with htmx, this is a 'docs-in-context produce idiomatic code' delta rather than an AI-tooling delta — Alpine has no agent-specific tooling to evaluate, and that absence is itself the finding: a ~15-directive surface is small enough to memorize but still has enough non-obvious interaction (which directive owns the write path) that pretraining alone produces plausible-but-redundant code."
next_release:
  name: "Alpine.js v3.x (continuing maintenance line)"
  status: null
  changes: "No public v4 roadmap, RFC, or announced rewrite was found as of this review (searched GitHub releases, the official blog, and community trackers). Alpine has shipped steady minor/patch releases through v3.15.x for several years (e.g. v3.15.9 in February 2026, v3.15.11 in April 2026, v3.15.12 in late April 2026 — see https://github.com/alpinejs/alpine/releases) consisting of bug fixes, plugin refinements (x-anchor, x-sort, morph, focus-trap), and small additive features, with no breaking-change signal."
  anticipated_impact: "None anticipated for the dimensions scored here — the project has been in a quiet, additive-only maintenance groove on the v3 line since 2021 (see Stability evidence for the v2->v3 transition, which is the only major churn event in the project's history). A reader should expect today's `x-data`/`x-on`/`x-bind` surface to still be the canonical surface in 6-12 months."
  stability_penalty: false
components:
  - "alpinejs"
  - "html"
supersedes: null
superseded_by: null
typescript_support: "community-types"
license: "MIT"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "declarative"
state_model: "reactive-properties"
rendering_strategy: "direct-dom"
maintainer: "Caleb Porzio / Community"
first_released: "2019"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Combo file per CLAUDE.md's combo-file convention: Alpine.js has no rendering pipeline, virtual DOM, or component-file model of its own — it is a ~7-15KB library that turns HTML attributes (`x-data`, `x-on`, `x-bind`, `x-for`, `x-show`, ...) into a reactive layer over the DOM that's already there. HTML is the templating language, the component boundary, and the 'render target' all at once; scoring Alpine standalone would manufacture a rendering/component-model story that doesn't exist independent of the markup it annotates. Note: research/alpine.md is a pre-9-dimension-rubric standalone review (all *_score fields null, predates the ebc2a30 rubric migration, and predates the combo-file convention) — it is being retired (deleted) as a follow-up to this review per the user's decision that CLAUDE.md's own convention means Alpine shouldn't have a standalone entry at all. supersedes/superseded_by are intentionally left null here: this file does not preserve alpine.md as a historical artifact (it won't persist), it simply replaces it as the corpus's only Alpine entry going forward."
---

# Alpine.js + HTML

> Reviewed as a pairing because Alpine.js is not a framework with its own rendering
> pipeline or component-file model — it is a small (~7.1KB gzipped core,
> ~15KB with common plugins) JavaScript library that turns plain HTML attributes
> into a reactive layer wrapped around the DOM that's already on the page. The unit
> a developer actually experiences is "server-rendered (or static) HTML with
> `x-*` attributes sprinkled in, reactive entirely client-side." That unit is what's
> scored here.

## Philosophy & Mental Model

Alpine's founding pitch, in its own words, is **"Vue/React-like reactivity without
the complexity"** — or, as its creator Caleb Porzio puts it, "a rugged, minimal
framework for composing JavaScript behavior directly in your markup." It targets
the same territory jQuery once owned: dropdowns, modals, tabs, accordions, inline
form validation — interaction that doesn't justify a build step, a router, or a
client-side data model, but is too stateful for plain HTML/CSS alone.

- **State lives in the markup, scoped to the DOM subtree that declares it.**
  `x-data="{ open: false }"` on a `<div>` creates a reactive object whose
  lifetime and visibility are exactly the lifetime and visibility of that `<div>`.
  There is no separate store file, no provider tree, no prop-drilling — the
  component *is* the element.
- **Locality of behavior is the explicit design thesis**, not a side effect.
  Alpine's docs and Porzio's talks repeatedly invoke Tailwind's "locality of
  behavior" argument (https://htmx.org/essays/locality-of-behaviour/, an essay
  Alpine's own ecosystem cites approvingly): the claim that co-locating what an
  element *does* with what an element *is* — in the same tag — produces more
  maintainable systems than separating concerns into distant files, because a
  reader never has to leave the markup to know what will happen.
- **Proxy-based fine-grained reactivity** (the same `Proxy`-trap mechanism Vue 3
  popularized): mutate a plain JS object (`count++`, `todos.push(...)`) and every
  expression that reads that path re-evaluates and patches only the DOM nodes that
  depend on it. No virtual DOM, no diffing, no explicit subscription.
- **Progressive enhancement over replacement**: Alpine assumes HTML is already on
  the page (server-rendered, static, or templated by anything) and adds behavior
  to it — it does not generate markup from a JS-side template the way React/Vue
  do. This is the same hypermedia-friendly posture as htmx, and the two are
  frequently paired (htmx swaps server-rendered fragments in; Alpine adds the
  small client-side interactivity layer — dropdown state, optimistic toggles —
  that doesn't need a round trip).

## State Management

### Philosophy & Mental Model
- State is **mutable, local-by-default, and declared inline**. `x-data="{ count: 0 }"`
  on an element creates a plain JS object; Alpine wraps it in a `Proxy` and tracks
  which DOM expressions read which properties.
- Scope nests like the DOM does: a child element's `x-data` merges with (and can
  shadow) its ancestor's. There's no global store unless you reach for `Alpine.store()`.
- This is the mirror image of Redux/Zustand-style centralization: instead of one
  source of truth threaded through a component tree, Alpine distributes truth to
  the elements that own it, and gives you an explicit escape hatch (`Alpine.store`)
  for the cases that genuinely need to be global (dark-mode toggle, auth state).

### Core Primitives
- **`x-data`** — declares a reactive scope and its initial state, as a plain object
  literal or a function reference (`Alpine.data('counter', () => ({...}))`) for
  reuse across multiple elements.
- **`Alpine.store(name, {...})`** — a single global reactive object, accessed
  anywhere via `$store.name`.
- **`$el` / `$refs` / `$watch` / `$dispatch` / `$nextTick` / `$persist`** — "magic
  properties" that fill the gaps a component-file framework would otherwise need
  separate APIs for (element refs, change observers, custom-event dispatch,
  post-render callbacks, localStorage-backed persistence via the official
  Persist plugin).
- **Plugins** (Mask, Intersect, Focus, Collapse, Anchor, Morph, Sort, Persist) —
  officially maintained, separately versioned add-ons for the 20% of cases the
  15-directive core doesn't cover. https://alpinejs.dev/plugins

### Update Mechanism
Direct mutation — no setter function, no dispatch, no immutability convention:

```html
<div x-data="{ count: 0 }">
  <button @click="count++">Increment</button>
  <span x-text="count"></span>
</div>
```

```html
<div x-data="{ todos: [] }">
  <button @click="todos.push({ id: Date.now(), body: 'New', completed: false })">
    Add
  </button>
</div>
```

Reactivity is **Proxy-based** (`alpinejs/alpine/packages/alpinejs/src/reactivity.js`
wraps `x-data` objects in `Alpine.reactive`, which — outside of testing — is
literally Vue 3's `@vue/reactivity` package, an explicit dependency Alpine credits
in its source and docs). Mutating any tracked path (`todos.push`, `user.name = 'x'`,
`count++`) schedules a re-evaluation of every expression that read that path.

### Read Pattern
Expressions are written **directly in the markup** as plain JavaScript, evaluated
against the nearest `x-data` scope (and any ancestor scopes it inherits from):

```html
<div x-data="{ open: false }">
  <button @click="open = ! open" x-text="open ? 'Close' : 'Open'"></button>
  <div x-show="open" x-transition>Panel content</div>
</div>
```

There is no selector layer, no hook, no `connect()` — the binding *is* the
attribute. `x-text`, `x-html`, `:class`, `x-show`, `x-if` all read directly from
scope; `x-model` adds two-way binding for form controls.

### Reactivity & Granularity
- **Expression-level, not component-level.** Because each `x-text`/`x-show`/`:class`
  is its own tracked expression (mirroring Vue 3's effect system), only the DOM
  nodes whose expressions read a changed path are touched — there's no
  component-wide re-render to opt out of, and therefore no `memo`/`useMemo`-style
  manual optimization vocabulary to learn.
- This is the same fine-grained model SolidJS and Vue 3 use, delivered without a
  compile step — the cost is that Alpine evaluates these expressions via `new
  Function(...)` at runtime (see Compiler-feedback evidence for what that costs you
  in error quality).

### Async Handling
No async primitives, middleware, or query layer — `x-init` (or an `init()` method
on the `x-data` object) plus `await fetch(...)` is the documented canonical
pattern, taken verbatim from https://alpinejs.dev/directives/init:

```html
<div x-data="{ posts: [] }"
     x-init="posts = await (await fetch('/posts')).json()">
  <template x-for="post in posts" :key="post.id">
    <h2 x-text="post.title"></h2>
  </template>
</div>
```

There's no loading/error-state convention beyond what you write by hand
(`x-data="{ posts: [], loading: true }"` plus a `try/finally` in `init()`).
Anything resembling TanStack Query's cache/retry/dedupe machinery is out of
scope — Alpine assumes you'll either reach for a dedicated data layer or that your
data needs are simple enough not to need one.

### Derived State
**JavaScript getters on the `x-data` object** — the documented idiom, taken
directly from the canonical TodoMVC reference (see Token-efficiency evidence):

```javascript
Alpine.data('todos', () => ({
  todos: [],
  filter: 'all',
  get active()    { return this.todos.filter(t => !t.completed) },
  get completed() { return this.todos.filter(t =>  t.completed) },
  get filteredTodos() {
    return { all: this.todos, active: this.active, completed: this.completed }[this.filter]
  },
}))
```

Getters re-run (and their dependent DOM patches) whenever a path they read
changes — no `useMemo`, `computed()`, or `createMemo` wrapper needed; the
Proxy-based dependency tracking covers getters for free.

### Developer Experience
- **Boilerplate:** low for the 80% case (toggle, dropdown, tab) — often a single
  `x-data` plus one or two directives on the same element, zero separate files.
  Rises for anything stateful enough to need `Alpine.data()` extraction, at which
  point it converges toward "a plain JS object with methods," which is itself low
  ceremony compared to reducer/action/selector triads.
- **DevTools:** community-maintained Chrome/Firefox extension
  (https://github.com/alpine-collective/alpinejs-devtools, "inspired by Vue
  devtools") shows component tree, live `x-data` state, and event firing — not
  first-party, and noticeably thinner than React/Vue/Redux DevTools (no
  time-travel, no action log).
- **Debugging:** `$el`, `console.log` inside expressions, and `Alpine.raw()` /
  `Alpine.reactive()` introspection in devtools cover most needs; there is no
  action-replay or diff view because there's no action concept to replay.
- **Time travel:** no — there's no action log to travel through; state is just a
  mutated object.

## Rendering

### Philosophy & Approach
**Direct DOM manipulation, driven by attribute directives evaluated against
already-present markup** — there is no virtual DOM, no diffing, no template
compiler producing render functions. Alpine walks the DOM tree it's given, finds
`x-*` attributes, and wires up live bindings between expression results and the
specific DOM nodes/attributes/text the directive targets.

### Update Strategy
Reactive and automatic, scheduled via microtask batching (`queueMicrotask` /
`Alpine.nextTick`) so that multiple synchronous mutations in one tick produce one
DOM patch round, not one per mutation. A render is triggered purely by a tracked
property being read by an active expression and then written to — there's no
separate "trigger a render" call.

### Reconciliation
**No diffing in the virtual-DOM sense** — each directive maintains a direct,
persistent binding to the DOM node(s) it was attached to, so "reconciliation" is
really "re-evaluate this one expression and patch this one binding." The one place
real reconciliation-like work happens is `x-for`, which keys list items
(`<template x-for="todo in todos" :key="todo.id">`) and adds/removes/reorders DOM
nodes to match the new array — conceptually similar to React's keyed-list
diffing, but scoped to a single `<template>` rather than a whole subtree.

### Templating & Syntax
**Plain HTML with attributes** — no JSX, no template-string DSL, no separate
file format. The directive vocabulary deliberately mirrors Vue's (`x-on`/`@` ~
`v-on`/`@`, `x-bind`/`:` ~ `v-bind`/`:`, `x-for` ~ `v-for`, `x-show` ~ `v-show`),
which Alpine's own docs describe as intentional — "if you know Vue, you basically
know Alpine."

```html
<div x-data="{ open: false }">
  <button @click="open = true">Expand</button>
  <span x-show="open" x-transition.duration.500ms>Now you see me</span>
</div>
```

### Component Model
There is no component-file concept — **the element with `x-data` *is* the
component**, and its boundary is exactly the DOM subtree it's declared on.
Reuse happens through `Alpine.data('name', factoryFn)` (referenced by name from
multiple elements) or through templating-engine partials (Blade `@include`, Twig
`{% include %}`, plain `<template>` + JS) at the HTML layer — Alpine has no
opinion about how the HTML gets assembled, only about what happens to it once
it's in the DOM.

```html
<div x-data="counter">
  <button @click="decrement">-</button>
  <span x-text="count"></span>
  <button @click="increment">+</button>
</div>
```
```javascript
Alpine.data('counter', () => ({
  count: 0,
  increment() { this.count++ },
  decrement() { this.count-- },
}))
```

### Performance Optimizations
- **`x-show` vs `x-if`** — the documented choice between "hide via CSS, keep in
  DOM" (cheap toggles, animatable) and "remove/recreate from DOM" (heavier state,
  rarely-shown content) is the main manual lever a developer needs to reach for.
- **`x-cloak`** prevents flash-of-unstyled-content before Alpine initializes.
- **`x-for` keys** (`:key="todo.id"`) are required for correct list patching,
  exactly as in Vue/React — Alpine's docs call this out explicitly.
- Beyond that: there is no `memo`equivalent to learn, because there's no
  component-level render to memoize against — the fine-grained model means
  "what re-runs" is already minimal by construction.

### Developer Experience
- **Learning curve:** easy — Alpine's own pitch is "15 attributes, 6 properties,
  2 methods... the entire API." A developer who knows any HTML and a little JS is
  productive within the hour; a Vue developer is productive within minutes.
- **DevTools:** see State Management above (community extension, thinner than
  mainstream framework devtools).
- **Hot reload:** none in the framework-tooling sense — because there's no build
  step, "hot reload" is just your normal static-file/server-template reload
  workflow; editing an `x-data` expression and refreshing the page *is* the loop.

## Event Handling

### Philosophy & Approach
**Thin sugar over native DOM events, bound inline in the markup.** `x-on:click`
(or its `@click` shorthand) attaches a real `addEventListener`; there's no
synthetic event system, no event pooling, no delegation layer imposed on you —
Alpine hands you the native `Event` object and gets out of the way.

### Event Binding
```html
<button @click="open = ! open">Toggle</button>
<input @keyup.enter="addTodo" x-model="newTodo">
<form @submit.prevent="save">...</form>
```

Modifiers (`.prevent`, `.stop`, `.outside`, `.window`, `.document`, `.debounce`,
`.throttle`, `.once`, `.self`, key-name modifiers like `.enter`/`.escape`) are
chained directly onto the directive — the same dot-chaining convention Vue uses,
and the documented idiom for `preventDefault`/`stopPropagation`/debouncing rather
than calling those methods by hand inside the expression.

### Event Flow
Standard native bubbling/capturing — Alpine doesn't intercept or alter
propagation. `.stop` is sugar for `event.stopPropagation()`; `.outside` (click
outside the element) and `.window`/`.document` (bind to those targets instead of
the element) are the only Alpine-specific additions to the native model, and both
are documented as syntactic shortcuts for patterns you'd otherwise hand-write with
`addEventListener` + a manual contains-check.

### Event Object
Handlers receive the **native** `Event` (or `KeyboardEvent`/`SubmitEvent`/etc.)
directly as `$event`:

```html
<input @input="search = $event.target.value">
<form @submit="console.log($event.target.elements)">
```

No wrapper, no synthetic-event lifecycle quirks to learn — what you get is exactly
what `addEventListener` would have handed you.

### Common Patterns
**Passing data to handlers** — closures over the loop variable, same as any JS:
```html
<template x-for="todo in todos">
  <button @click="deleteTodo(todo)">Delete</button>
</template>
```

**Accessing component state** — `this` inside methods, or direct expression
access for inline handlers (both reach the same `x-data` scope):
```html
<button @click="count++">+</button>
<button @click="reset()">Reset</button>
```

**Preventing default** — `.prevent`/`.stop` modifiers (idiomatic) or
`$event.preventDefault()` inline (equivalent, more verbose); docs consistently use
the modifier form.

### Performance Considerations
- No event delegation is applied automatically — each `@click` is its own
  listener, exactly as if you'd called `addEventListener` yourself. For very large
  lists this is a real, documented tradeoff (the community routinely recommends
  `x-data` scoping at the list-item level rather than thousands of individually
  bound handlers at the leaf level).
- **Cleanup is automatic** for elements removed via `x-if`/`x-for`/Alpine's own
  DOM mutation — Alpine's `MutationObserver`-driven lifecycle tears down listeners
  and `$watch` effects when their elements leave the DOM, which removes an entire
  category of manual-cleanup bugs common in hand-rolled jQuery/vanilla code.

### Developer Experience
- **Debugging:** native browser event inspection (`getEventListeners($0)` in
  Chrome devtools) works unmodified, because the listeners *are* native — no
  synthetic-event indirection to see through.
- **Type safety:** none by default — `$event` is typed as `any` in plain HTML;
  community TypeScript layers (see Type-system evidence) can improve this for
  `x-data` factory functions but not for inline-markup expressions, which remain
  outside any type checker's reach.

## Rubric Evidence

### Evidence: Type-system integration
**Categorical fact: community-types, and structurally limited even with them.**
Alpine ships no first-party TypeScript types, and — more fundamentally — the bulk
of an Alpine app's logic lives as **string expressions inside HTML attributes**,
which are evaluated via `new Function(...)` at runtime and are invisible to any
static type checker no matter what types exist for the JS side. Community efforts
(`@nxtlvlsoftware/alpine-typescript`, https://github.com/NxtLvLSoftware/alpine-typescript;
`@leanadmin/alpine-typescript`) provide typed `Alpine.data()` factories and
`AlpineComponent` base classes for the *extracted-to-`.ts`-file* portion of an app
— but the project's own GitHub issue tracker confirms the gap at the framework
level: "Add TypeScript typings for better intellisense and TypeScript support"
(https://github.com/alpinejs/alpine/issues/2199) remains open, and a maintainer
discussion on bundling concludes "Alpine has no way for components to be defined in
a type-safe way" in the general (markup-expression) case.

**Sample type error (or rather, the lack of one):** writing
`<div x-data="{ count: 0 }"><span x-text="cuont"></span></div>` — a typo'd property
name inside an attribute string — produces **zero static feedback of any kind**: no
red squiggle, no build error, no type error. The first signal a developer gets is
a blank `<span>` at runtime (Alpine logs nothing for "expression referenced an
undefined property" because `undefined` is a perfectly valid JS expression result).
Compare this to JSX/Vue SFC `<template>` compilation, where a typo'd binding is at
minimum a "Cannot find name" diagnostic in the editor before the page ever loads.

### Evidence: Compiler/build feedback quality
**There is no compiler — the deliberately-broken example surfaces as a runtime
console warning, sometimes only in dev, sometimes not at all.** Took the canonical
TodoMVC reference (see Token-efficiency evidence) and broke it two ways:

1. **Malformed expression** — changed `x-text="active.length"` to
   `x-text="active.length("` (stray paren). Browser console shows:
   ```
   Alpine Expression Error: Unexpected token ')'

   Expression: "active.length("

   <strong x-text="active.length(" __x-inspect…></strong>
   ```
   This *is* actionable — it names the broken expression and points at the exact
   element — but it is a **runtime** message that only appears once that code path
   executes (i.e., once the bound value is read), not a build-time or load-time
   diagnostic. A typo in an `x-show` on a rarely-visible element could ship to
   production silently.

2. **Reference to an undefined method** — changed `@click="addTodo"` to
   `@click="addTodoo"`. Result: **total silence**. No console message, no error,
   nothing — clicking the button simply does nothing, because Alpine evaluates
   `addTodoo` as `undefined` and a click handler bound to `undefined` is a no-op
   in Alpine's expression evaluator. This is the more dangerous failure mode: a
   typo that produces *no signal whatsoever*, only an app that silently doesn't work.

This is structurally the same ceiling htmx hits (string-attribute expressions
evaluated at runtime with no compile step) but slightly worse in the silent-failure
case, because htmx's worst case is "wrong swap target → visible DOM bug," while
Alpine's worst case is "handler reference typo → nothing happens, nothing logged."

### Evidence: Locality of behavior
**Traced the "toggle a todo's completed state" feature** in the canonical
laracasts/todomvc-alpine reference (https://github.com/laracasts/todomvc-alpine).
Touchpoints required to understand or change this one feature:

1. `index.html` line ~58 — the `<input x-model="todo.completed" @click="toggleTodoCompletion(todo)" type="checkbox">` element: binding, handler wiring, and the `:class="{ completed: todo.completed }"` visual consequence on the parent `<li>` are *all on the same handful of lines*, one file.
2. `js/todos.js` — the `toggleTodoCompletion(todo)` method (4 lines: flip the flag, persist).
3. `js/todos.js` — `window.todoStore.save()` (the localStorage persistence helper the method calls).

**Count: 2 files, 3 touchpoints**, and two of the three are in the same file
adjacent to each other. This is markedly tighter than a typical React/Redux todo
(component file + reducer/slice + selector + possibly a separate types file —
commonly 4-6 touchpoints across 3-4 files), and is the direct, demonstrable payoff
of the "locality of behavior" thesis Alpine's docs explicitly argue from. It's
slightly looser than htmx's equivalent trace (htmx's swap-target wiring lives
entirely in the markup with no companion JS file at all) because Alpine's
`x-data` factory function is, by convention, extracted to a `.js` file once it
grows past trivial size — the framework doesn't *require* that extraction, but the
canonical reference does it, and that's the idiom a reader should expect to meet
in the wild.

### Evidence: Explicitness / data-flow traceability
**Traced "click the checkbox to mark a todo complete" end-to-end**, same reference
implementation:

1. User clicks `<input x-model="todo.completed" @click="toggleTodoCompletion(todo)">`
   — **explicit**: two bindings on one element, both visible at the point of
   interaction (`x-model` for the checked-state two-way binding; `@click` for the
   side-effecting handler).
2. `@click` fires `toggleTodoCompletion(todo)` — **explicit**: a named method call
   you can grep for and find in `js/todos.js`, receiving the exact `todo` object
   the loop iteration closed over.
3. The method does `todo.completed = !todo.completed; this.save()` — **explicit**:
   direct mutation, then an explicit named call to the persistence helper. No
   action object, no dispatch, no reducer indirection.
4. Mutating `todo.completed` triggers Alpine's Proxy trap — **implicit**: this is
   the one genuinely "magic" hop. Nothing in the source names which DOM nodes will
   re-evaluate; that's resolved by Alpine's dependency-tracking machinery
   (borrowed from `@vue/reactivity`) at runtime, the same way Vue 3's or SolidJS's
   reactivity is implicit.
5. The `:class="{ completed: todo.completed }"` and `x-text="active.length"`
   expressions re-evaluate and patch their bound DOM nodes — **implicit** in the
   same sense as #4 (you don't see *which* expressions re-ran without devtools or
   instrumentation), but **traceable**: grep for `todo.completed` and you find
   every expression that reads it, because they're all string literals in the
   markup, not hidden behind selector/connector indirection.

**Count: 3 explicit hops, 2 implicit hops** (both implicit hops are the *same*
underlying mechanism — proxy-trap dependency tracking — encountered twice). This
is a notably shallower implicit surface than React+Redux (action creator → dispatch
→ reducer → store → selector → connected-component re-render is 4-5 hops, several
genuinely hidden behind `connect`/hook indirection) and roughly comparable to
Vue 3's Options/Composition API, which uses the same underlying reactivity
primitive. The grep-ability of hop #5 (every dependent expression is a literal
string you can search for) is a meaningful mitigation that frameworks separating
template from logic into different files don't offer as cheaply.

### Evidence: Convention strength
**Grepped for "fetch data on load" patterns** across the official docs
(https://alpinejs.dev/directives/init, the Alpine.js "Async" community discussions,
and the top TodoMVC-style reference repos surfaced by search). Found exactly
**one** documented canonical idiom — `x-init` (or an equivalent `init()` method on
the `x-data` object) plus inline `await fetch(...)`:

```html
<div x-data="{ posts: [] }"
     x-init="posts = await (await fetch('/posts')).json()">
```

— quoted verbatim from https://alpinejs.dev/directives/init, which is the only
location in the official docs that demonstrates data-loading. The "Async" pattern
doesn't fork into multiple competing idioms the way, say, React's data-fetching
landscape does (`useEffect` vs. React Query vs. Server Components vs. `use()`):
there is no Alpine-native query/cache layer to compete with the inline-`await`
idiom, so the ecosystem hasn't grown alternatives to disagree about. The only
*variation* observed across community examples is cosmetic — whether the fetch
call sits in `x-init="..."` directly or is extracted into an `init()` method (both
are explicitly documented as equivalent, with `init()` simply running first). That
counts as **one idiom with a stylistic choice**, not competing conventions — a
noticeably tighter convention surface than most full frameworks exhibit, likely
*because* the API surface is small enough that there's nowhere for divergent
idioms to grow.

**Documentation-friction note:** locating this required checking three sources
(directive reference, an "Async Alpine" community blog post, and the canonical
TodoMVC reference's `js/todos.js`) before being confident the `x-init` + `await
fetch` pattern wasn't one of several competing approaches — the official docs
don't have a dedicated "fetching data" guide page the way React/Vue/Svelte do, so
the canonical idiom has to be triangulated from a directive-reference example
rather than read off a task-oriented guide.

### Evidence: Token efficiency / boilerplate density
**Used a canonical reference implementation** — `laracasts/todomvc-alpine`
(https://github.com/laracasts/todomvc-alpine), authored by Jeffrey Way (Laracasts)
and listed among Alpine's community examples. This is a complete TodoMVC build
(add, edit, delete, toggle, toggle-all, filter by all/active/completed, clear
completed, localStorage persistence) implementing the standard TodoMVC spec
(https://todomvc.com).

- `index.html`: **151 lines** (markup + `x-data`/`x-for`/`x-model`/`x-show`/
  `:class` bindings — no separate template language)
- `js/todos.js`: **102 lines** (the `Alpine.data`-equivalent factory object: state,
  4 getters for derived collections, 8 methods, plus an 8-line `localStorage`
  persistence helper)
- **Total: 253 lines, 2 files, zero build configuration** (loaded via a single
  `<script src=".../alpine.min.js" defer>` CDN tag — no bundler, no JSX transform,
  no `package.json` build step required to run it)

For comparison, the React TodoMVC reference on todomvc.com
(https://github.com/tastejs/todomvc/tree/master/examples/react) runs to several
hundred lines spread across 7-9 component/hook/util files plus a build
configuration — Alpine's count is meaningfully lower *and* concentrated in two
files a reader can hold in their head at once. The gap is the direct, measurable
expression of "no separate component-file ceremony, no build step, behavior
co-located with markup."

### Evidence: Familiarity composite
Four proxies, triangulated:

- **`first_released`: 2019** (v1; v3 — the version in continuous use today —
  shipped in 2021). Six-plus years in the wild, long enough to have settled
  conventions and accumulated a substantial corpus of blog posts, Laracasts
  tutorials, and Stack Overflow questions that an LLM's pretraining would plausibly
  have seen many times over.
- **GitHub activity: 31.7k stars, 1.4k forks** on `alpinejs/alpine`
  (https://github.com/alpinejs/alpine, fetched 2026-06), with releases shipping on
  a steady monthly-ish cadence through v3.15.x in 2026
  (https://github.com/alpinejs/alpine/releases) — an actively maintained project,
  not a frozen one.
- **Registry trend: upward but structurally undercounted.** npm-trends data shows
  `alpinejs` weekly downloads in the 200K-270K range as of early-to-mid 2026
  (https://npmtrends.com/alpinejs, https://npmtrends.com/alpinejs-vs-preact —
  showing v3.14.x at ~272K/week), an order of magnitude above the package's
  earlier-tracked baseline. **But — exactly the structural-undercount case CLAUDE.md
  flags for htmx applies here too**: Alpine is overwhelmingly distributed via
  `<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js">` —
  the officially documented "quick start" install method
  (https://alpinejs.dev/essentials/installation) — which never touches the npm
  registry at all. The true install-base is best read off CDN hit counts (not
  publicly aggregated) and the GitHub star/fork numbers above, both of which
  suggest meaningfully heavier real-world usage than the registry alone implies —
  Laravel's own Jetstream/Breeze starter kits and the broader "HTML-over-the-wire"
  (Hotwire/htmx-adjacent) ecosystem ship Alpine by default, a distribution channel
  invisible to npm download counts.
- **Community volume**: the directive vocabulary's deliberate mirroring of Vue's
  (`@click`~`v-on:click`, `:class`~`v-bind:class`, `x-for`~`v-for`) means an LLM's
  Vue-trained intuitions transfer with high fidelity — a meaningful familiarity
  multiplier beyond Alpine's own raw documentation volume, and the explicit reason
  Alpine's own docs invoke "if you know Vue, you know Alpine" as their pitch.

These triangulate to a **mid-to-upper familiarity score**: well-known,
actively-discussed, syntactically transferable from a much larger ecosystem (Vue),
but smaller in absolute community volume than React/Vue/Angular and with a
registry signal that understates real usage.

### Evidence: Stability / convention durability
**The only major churn event in Alpine's history is the 2021 v2->v3 rewrite**,
and the project's own upgrade guide (https://alpinejs.dev/upgrade-guide) frames it
as low-disruption: *"Upgrading from Alpine V2 to V3 should be fairly painless. In
many cases, NOTHING has to be done to your codebase to use V3."* The breaking
changes it does list are narrow and mechanical — `$el` now refers to the current
element rather than the root component, `x-spread` renamed to `x-bind`, `.away`
renamed to `.outside`, transition syntax unified under `x-transition`. None of
these touch the core mental model (inline reactive state, directive-driven DOM
binding); they're naming/scoping cleanups, not architectural breaks.

**Since that 2021 transition, Alpine has shipped nothing but additive, backward-
compatible minor/patch releases on the v3 line** — v3.15.9 (Feb 2026), v3.15.11
(Apr 2026), v3.15.12 (late Apr 2026) — consisting of bug fixes (dialog/focus
handling, `x-trap` scrollbar conflicts, morph `$refs` regressions), small new
modifiers (`x-anchor.noflip`), and plugin refinements
(https://github.com/alpinejs/alpine/releases). **No public v4 roadmap, RFC, or
rewrite announcement exists** as of this review (checked GitHub releases, the
official blog, and community release-trackers) — see `next_release` in
frontmatter, which records `status: null` and `stability_penalty: false` for
exactly this reason: there is no upcoming release to track because the project is
in a quiet, additive-only maintenance groove that has held continuously since 2021.
A reader can reasonably expect the `x-data`/`x-on`/`x-bind`/`x-for` surface
documented here to be unchanged in 6-12 months.

### Evidence: Ecosystem tooling facts
- **Browser DevTools**: community-maintained, not first-party —
  [alpinejs-devtools](https://github.com/alpine-collective/alpinejs-devtools)
  (Chrome/Firefox, "inspired by Vue Devtools") shows the component tree and live
  `x-data` state; a paid alternative,
  [Alpine.js DevTools Pro](https://alpinejs.pro/), adds event monitoring and store
  inspection. Neither is maintained by the `alpinejs` org itself, and both are
  visibly thinner than React/Vue/Redux DevTools (no time-travel, no action
  replay — there's no action concept to replay).
- **Test utilities**: no Alpine-specific testing library exists; the documented
  approach (https://alpinejs.dev/advanced/csp — and community guides) is to test
  through the rendered DOM with standard tools (Cypress, Playwright, Testing
  Library's DOM queries) — exactly as you would test plain HTML+JS, which is
  consistent with Alpine's "it's just the DOM" philosophy but means there's no
  Alpine-aware assertion vocabulary (`wrapper.vm.count` style) the way Vue Test
  Utils provides.
- **IDE/LSP support**: community-only.
  [Alpine.js Tools](https://connorontheweb.com/alpine-js-tools-vs-code) (VS Code) —
  syntax highlighting inside directive strings, hover docs for directives/magic
  properties, completions across HTML/Blade/Twig/EJS/Nunjucks; older
  [Alpine.js IntelliSense](https://marketplace.visualstudio.com/items?itemName=adrianwilczynski.alpine-js-intellisense)
  and [alpine-intellisense](https://github.com/pcbowers/alpine-intellisense)
  cover snippets/completions. None of these are LSP-grade type-aware tooling —
  they're snippet/hover layers over what is, to the editor, just a string
  attribute; no extension provides "go to definition" from an `x-data` expression
  to its backing JS, the way a Vue SFC's `<script>`/`<template>` linkage does.
- **Net**: real, actively-maintained community tooling exists across all three
  categories, but none of it is first-party, and all of it tops out below the
  mainstream-framework baseline (Vue/React/Svelte devtools+LSP+test-utils, all
  first-party and deeply integrated).

## On the Horizon

### Next release
- **Name/version:** Alpine.js v3.x (continuing maintenance line — see `next_release` in frontmatter)
- **Status:** `null` — no alpha/beta/RFC/announced major version exists to track
- **What's changing:** Routine additive minor/patch releases (latest: v3.15.12,
  late April 2026) — bug fixes, small new modifiers, plugin refinements. No
  breaking changes signaled. https://github.com/alpinejs/alpine/releases
- **Anticipated impact:** None on the rubric evidence above — the project has held
  a stable, additive-only posture on v3 since the 2021 v2->v3 transition (the only
  major churn event in its history; see Stability evidence), and nothing in its
  release cadence or public communications suggests that's changing.
- **Stability penalty:** No — see Stability evidence; this is the steadiest
  possible posture (active maintenance, zero announced breaking changes, multi-year
  track record of backward compatibility on the current major version).

### AI-tooling investment
- **What exists:** Nothing first-party. No official MCP server (the "alpine-mcp"
  result that surfaces in MCP-server searches is an unrelated browser-automation
  tool, not an Alpine.js framework integration), no Boost-style curated guideline
  package, no `llms.txt`/`llms-full.txt` (both paths 302-redirect to the docs
  homepage rather than serving a dedicated machine-readable file — checked
  directly against `https://alpinejs.dev/llms.txt` and `/llms-full.txt`), no
  AI-specific style guide. The only AI-adjacent surface is the same general-purpose
  documentation a human developer would read.
- **Observed delta:** see `ai_tooling.observed_delta` in frontmatter — running the
  canonical "add + toggle a todo" slice cold vs. with `directives/data` and
  `directives/for` loaded into context produced a real correction (the model
  collapsed a duplicated `x-model`+`@click` write-path into the canonical
  single-path pattern once docs were in context). This is a docs-in-context effect,
  not an AI-tooling effect — Alpine has no agent-specific tooling to evaluate, and
  that absence is itself the data point worth recording: a small, memorizable API
  surface still has enough non-obvious interaction (which directive owns the
  mutation path) that pretraining alone produces plausible-but-redundant code.

**Documentation-friction note (consolidated):** Two friction points surfaced
during this review, both noted inline above: (1) the canonical "fetch on load"
idiom required triangulating across three sources because the official docs lack a
dedicated data-fetching guide (Convention-strength evidence); (2) confirming the
absence of a public v4 roadmap required checking GitHub releases, the blog, and
community trackers directly, since there's no single "what's next" page (Stability
evidence). Neither was severe — Alpine's documentation is otherwise compact and the
small API surface limits how lost a reader can get — but both required more
hopping than a task-oriented "Guides" section would have, which is itself a minor
signal about where Alpine's docs invest (directive reference depth) versus where
they don't (task-oriented walkthroughs).
