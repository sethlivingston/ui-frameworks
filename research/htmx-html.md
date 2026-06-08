---
name: "htmx + HTML"
category: "utility-library"
github_url: "https://github.com/bigskysoftware/htmx"
docs_url: "https://htmx.org/docs/"
implementation_language: "JavaScript"
status: "active"
type_system_score: 2
compiler_feedback_score: 2.5
locality_score: 9.5
explicitness_score: 8
convention_strength_score: 8
token_efficiency_score: 9
familiarity_score: 6.5
stability_score: 7.5
tooling_score: 5
version: "2.0.10"
type: "Hypermedia / Progressive Enhancement Library"
npm_package: "htmx.org"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No first-party AI tooling exists for htmx (no MCP server, no Boost-style guideline package, no llms.txt). The closest analogue is the community VS Code extensions that provide attribute IntelliSense (htmx-tags, HTMX Attributes, HTMX IntelliSense — see Tooling evidence). Ran the canonical 'add + toggle a todo' slice (the same slice cited in Token-efficiency evidence, modeled on https://github.com/rajasegar/todomvc-htmx) once cold and once after loading https://htmx.org/docs/#triggers and https://htmx.org/docs/#swapping into context. Cold, the model wrote a plausible `hx-post`/`hx-target` pair but defaulted to `hx-swap=\"innerHTML\"` for the toggle (replacing the `<li>`'s contents rather than the `<li>` itself), which breaks the `completed` class toggle that TodoMVC's CSS depends on — a real but subtle bug that only manifests visually. After loading the two doc sections, the model produced `hx-target=\"closest li\"` + `hx-swap=\"outerHTML\"`, matching the canonical repo's pattern exactly. This is a 'docs-in-context produce idiomatic code' delta rather than an AI-tooling delta — htmx has no agent-specific tooling to evaluate, which is itself the finding, and it's a sharper version of the same finding the Web Components review made: a four-attribute surface still has enough non-obvious interaction (which swap mode preserves which DOM node identity) that pretraining alone produces a plausible-looking but subtly wrong answer."
next_release:
  name: "htmx 4.0 (beta)"
  status: "beta"
  changes: "Replaces the XMLHttpRequest transport with the Fetch API (enabling streamed/chunked response handling), and converts htmx's historically *implicit* attribute-inheritance model into an *explicit* one via an `:inherited` modifier (e.g. `hx-target:inherited=\"#div\"`) — the htmx 2.x behavior where `hx-target` on a parent silently applied to every descendant becomes something a reader has to opt into and can grep for. The project has stated htmx 2.0 'will be supported in perpetuity' and that 4.0 ships an opt-in config flag to restore 2.x implicit-inheritance behavior, explicitly to remove upgrade pressure. Beta 4 shipped 2026-05-22; release candidates are slated for May/June 2026 with a final release 'late summer.'"
  anticipated_impact: "If `:inherited` ships as designed, it directly strengthens this review's Explicitness and Locality findings — inheritance, currently the one piece of htmx behavior that requires reading *up* the DOM tree to fully understand a single element's behavior (see Explicitness evidence), becomes visible at the point of use. The fetch() migration is largely a transport-layer change invisible to the `hx-*` attribute surface this review scores, though streaming responses could open new canonical patterns worth re-checking in a follow-on pass."
  stability_penalty: false
components:
  - "htmx"
  - "html"
supersedes: null
superseded_by: null
typescript_support: "community-types"
license: "BSD-2-Clause"
runtime: "browser"
capabilities:
  state_management: false
  rendering: false
  event_handling: true
paradigm: "declarative"
rendering_strategy: "server-side"
maintainer: "Big Sky Software / Community (BDFL: Carson Gross)"
first_released: "2020"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Combo file per CLAUDE.md's combo-file convention: htmx has no rendering or component model of its own — it is a ~14KB attribute-driven extension of HTML's own request/response/swap model, and HTML is the only 'component model' it has. Scoring it standalone would manufacture rendering/state-management dimensions that don't exist for it. Note: research/htmx.md is a pre-9-dimension-rubric review (all *_score fields null, predates the ebc2a30 rubric migration) that AGENTIC-DEV-RANKINGS.md currently cites with a different (pre-migration, non-flat) scoring scheme — that file is queued for the from-scratch rewrite pass (V2-PHASE-B item 3) and is left untouched here as the pre-migration historical artifact; this combo file is the new, rubric-conformant entry for the htmx+HTML pairing and should be the one synthesis docs draw from going forward."
---

# htmx + HTML

> Reviewed as a pairing because htmx is not a framework with its own rendering or
> component model — it is a small (~14KB gzipped) JavaScript library that extends
> HTML's own attribute and request/response vocabulary. The unit a developer
> actually experiences is "HTML with `hx-*` attributes sprinkled in, talking to a
> server that returns HTML fragments." That unit is what's scored here.

## Philosophy & Mental Model

htmx's founding question is: **"What if HTML had finished what it started?"** The
original web let `<a>` and `<form>` make requests, on `click`/`submit` only, via
`GET`/`POST` only, always replacing the whole page. htmx removes those four
arbitrary constraints — **any element**, **any event**, **any HTTP verb**, **any
swap target** — without inventing a new templating language, component model, or
client-side state container.

- **State lives on the server.** The browser holds whatever HTML is currently in
  the DOM and nothing else. There is no client-side store, no hydration step, no
  serialization boundary between "data" and "view" — because there is no separate
  data representation on the client at all.
- **Hypermedia as the engine of application state (HATEOAS).** Every server
  response is simultaneously content *and* the next set of available actions
  (`<button hx-delete="/todos/3">`); the server drives the interaction graph, not
  a client-side router.
- **This is a genuine paradigm fork, not a feature.** Reviewing htmx means
  reviewing a *hypermedia-driven application* (HDA) — a hybrid of MPA simplicity,
  SPA-like UX (no full-page reloads), and REST-ful architecture — against
  frameworks that assume a client-side data model. Where the rubric below scores
  "state management" or "rendering" dimensions, the honest answer is frequently
  "this doesn't exist here, and that absence is the design."

## State Management

### Philosophy & Mental Model
- **There is no client-side state management** — not a gap, the thesis. State
  lives in the database/session/cache on the server; the DOM *is* the view of
  that state, refreshed by swapping in new HTML fragments.
- This eliminates an entire category of bugs (client/server state divergence,
  stale caches, serialization mismatches) by removing the category's precondition.
- The cost is symmetrical: anything that benefits from instant, no-round-trip
  feedback (drag-reordering previews, optimistic UI, offline-first) needs either a
  server round trip per interaction or a drop into hand-written JavaScript /
  companion libraries (Alpine.js, `_hyperscript`, `hx-*` extensions).

### Core Primitives
- **The DOM itself** is the only state container.
- **`hx-*` attributes** declare what triggers a request, where the response lands,
  and how it's swapped in — there is no separate "store" or "signal" primitive to
  learn.
- **Server-rendered fragments** are the unit of update — not components, not
  virtual DOM nodes, not signals.

### Update Mechanism
A user action triggers an HTTP request (declared via `hx-get`/`hx-post`/`hx-put`/
`hx-patch`/`hx-delete`); the server computes the new state and returns the *already
rendered* HTML fragment representing it; htmx swaps that fragment into the
specified target:

```html
<button hx-patch="/todos/3" hx-target="closest li" hx-swap="outerHTML">
  Toggle
</button>
```

There is no separate "update state, then re-render" step on the client — the
response IS the new state, pre-rendered.

### Read Pattern
N/A on the client — there is nothing to subscribe to. "Reading state" means the
server querying its database and rendering HTML, which is a server-side concern
entirely outside htmx's surface.

### Reactivity & Granularity
Granularity is whatever `hx-target`/`hx-swap` declare, fragment by fragment — there
is no framework-level diffing or dependency tracking. A `hx-swap="outerHTML"` on a
single `<li>` updates exactly that node and nothing else; a careless `hx-target` on
a parent container re-renders a whole subtree. This is **manual, declarative
granularity** — the developer states the blast radius per interaction rather than
the framework inferring it.

### Async Handling
Every interaction *is* async by construction — there's no sync/async distinction to
manage. `hx-indicator` declares a loading-state element; `hx-trigger` modifiers
(`delay:`, `throttle:`, `once`) and `hx-sync` handle debouncing and request
race-conditions declaratively:

```html
<input hx-get="/search" hx-trigger="keyup changed delay:300ms"
       hx-target="#results" hx-indicator="#spinner">
```

### Derived State
Computed entirely server-side — "derived state" in the client-state sense doesn't
exist. If the UI needs an "items left" counter, the server computes it and renders
it as part of the response fragment (see the canonical TodoMVC's `item-count.pug`
partial, re-rendered and re-swapped alongside every todo mutation).

### Developer Experience
- **Boilerplate:** Low on the client (a handful of attributes); the cost is shifted
  to the server, which now needs fragment-rendering routes for every interaction —
  see Locality evidence for the concrete touchpoint count.
- **DevTools:** Browser Network tab is the primary tool — every interaction is a
  visible HTTP request/response pair. The `htmx:*` event system
  (`htmx:beforeRequest`, `htmx:afterSwap`, etc.) is inspectable via
  `addEventListener` and a small `hx-on:htmx:*` inline-handler syntax; there is no
  dedicated state-inspection devtools panel because there is no client state to
  inspect.
- **Debugging:** `htmx.logAll()` traces every internal event to the console — a
  blunt but complete instrument, given the library's small surface.
- **Time travel:** No — meaningless without client-side state history.

## Rendering

### Philosophy & Approach
**Server-side rendering, swapped over the wire.** There is no virtual DOM, no
diffing, no reconciliation algorithm — htmx asks the server for a finished HTML
fragment and inserts it verbatim using one of ~10 swap strategies
(`innerHTML`, `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`,
`delete`, `none`, plus `morph` via the idiomorph extension for DOM-preserving
swaps).

### Update Strategy
Entirely request-driven: a trigger fires (click, input, custom event, `load`,
`revealed`, `intersect`, polling interval), htmx issues the declared HTTP request,
and on response, swaps the returned markup into the declared target. No scheduler,
no batching model to reason about — one request maps to one swap.

### Reconciliation
**None, by default** — htmx replaces DOM nodes wholesale per the chosen swap mode;
it does not diff old vs. new content. The `morph` swap (via the optional idiomorph
extension, now folded toward core in 2.x-era tooling) adds DOM-preserving
morphing for cases where node identity matters (focus, animation state, form
input values mid-edit).

### Templating & Syntax
**Plain HTML plus `hx-*` attributes** — no new templating DSL on the client side.
Server-side templating is whatever the backend stack already uses (Jinja, ERB,
Blade, Pug, templ, etc.):

```html
<button hx-post="/save" hx-target="#result" hx-swap="outerHTML">Save</button>
```

### Component Model
There is no client-side component model. The unit of reuse is a **server-rendered
HTML partial/fragment** — a template the backend can render both as part of a full
page and standalone as a swap target's replacement. This is a meaningfully
different unit than a React/Vue/Svelte component: it has no client lifecycle, no
props in the JS sense, and no client-side identity beyond a DOM id/selector.

### Performance Optimizations
- `hx-boost` progressively enhances normal links/forms into AJAX requests without
  attribute-by-attribute rewrites.
- Out-of-band swaps (`hx-swap-oob`) let a single response update multiple
  unrelated DOM regions in one round trip (e.g., update a todo item *and* the
  "items left" counter from one POST response — exactly the pattern the canonical
  TodoMVC reference uses, concatenating two rendered partials into one response
  body).
- `hx-trigger` modifiers (`throttle:`, `delay:`, `once`, `changed`) prevent
  redundant requests declaratively, without `useMemo`/`useCallback`-style manual
  memoization machinery.

### Developer Experience
- **Learning curve:** Low for the htmx surface itself (~20-31 attributes
  documented at https://htmx.org/reference/); the real learning curve is
  architectural — thinking in server-rendered fragments instead of client state is
  a genuine mental-model shift for developers coming from SPA frameworks.
- **DevTools:** Network tab + `htmx.logAll()`; no component-tree inspector exists
  because there's no component tree.
- **Hot reload:** Whatever the backend's dev server provides (e.g., Express +
  nodemon, Django's auto-reloader) — htmx itself has no opinion or tooling here.

## Event Handling

### Philosophy & Approach
Standard **native DOM events** drive everything — `hx-trigger` simply names the
event (`click`, `submit`, `keyup`, `mouseenter`, or any custom `CustomEvent`) that
should fire a request. No synthetic event system, no virtual event delegation layer
to reason about; it's the platform's own event model, declared rather than
imperatively bound.

### Event Binding
Declared inline as an attribute value — the binding *is* the behavior declaration:

```html
<input hx-get="/search" hx-trigger="keyup changed delay:300ms" hx-target="#results">
```

### Event Flow
Standard DOM bubbling/capturing — htmx adds a parallel custom-event system
(`htmx:beforeRequest`, `htmx:afterSwap`, `htmx:responseError`, etc., documented at
https://htmx.org/events/) that bubbles the same way and can be intercepted with
`hx-on:htmx:before-request="...; if (...) event.preventDefault()"` to cancel a
pending request.

### Event Object
Handlers (when written — most interactions need none) receive the **native
`Event`/`CustomEvent`** object; htmx-specific events carry a `detail` payload
documented per-event (e.g. `detail.xhr`, `detail.target`, `detail.successful`).
No wrapper/synthetic object — what you get is what the platform gives you.

### Common Patterns
- **Passing data to handlers:** via `hx-vals`/`hx-include` (declared, serialized
  into the request) rather than closures capturing component state.
- **Accessing "component" state:** there is none on the client; the server holds
  it and re-renders.
- **Preventing default:** `hx-on:htmx:before-request="event.preventDefault()"` or,
  for non-htmx-managed native events, plain `onsubmit="event.preventDefault()"` —
  same platform mechanism, no framework indirection.

### Performance Considerations
- htmx attaches one delegated listener type per trigger event at the document
  level internally — developers don't need to hand-roll delegation.
- No manual cleanup is required for htmx-managed bindings (htmx removes its own
  listeners when elements are removed from the DOM); hand-written
  `addEventListener` calls in companion `_hyperscript`/Alpine code carry the usual
  native-DOM cleanup obligations.

### Developer Experience
- **Debugging:** `htmx.logAll()`, browser Network/Console tabs, and the
  `htmx:*` custom-event stream cover the whole surface — there is no separate
  "event system" to debug beyond the DOM's own.
- **Type safety:** None natively (see Type-system evidence) — `hx-trigger` strings
  and event names are untyped attribute values, validated only at runtime.

## Rubric Evidence

### Evidence: Type-system integration
**Categorical fact: community-types.** htmx ships **no native TypeScript types**
(implementation language is plain JavaScript with JSDoc annotations) and there is
no canonical `@types/htmx.org` DefinitelyTyped package — the official install docs'
suggested `npm i --save-dev @types/htmx.org` command (referenced in
[htmx discussion #2453](https://github.com/bigskysoftware/htmx/discussions/2453))
points at a package that doesn't actually exist on npm. The 2.0.10 changelog entry
notes the project "restored missing TypeScript definitions," indicating the
JSDoc-derived types have been a moving target even for the library's own JS API.
Three **community** packages fill the gap for attribute-level typing:
[htmx-types](https://npmx.dev/package/htmx-types) (typed `hx-*` attributes +
top-level `htmx` object), [typed-htmx](https://www.npmjs.com/package/typed-htmx)
(JSX-flavored attribute typings for React/Astro/etc. interop), and
[typescript-htmx-types](https://github.com/leevigraham/typescript-htmx-types) (WIP).

**Sample type "error":** because `hx-*` attributes are plain HTML attribute
strings, there is no compile-time check on them at all — a typo in a target
selector is syntactically valid HTML and TypeScript has nothing to say about it:

```html
<!-- compiles, lints, and runs without any diagnostic -->
<input hx-get="/search" hx-target="#rezults">
<div id="results">...</div>
```

The mismatch (`#rezults` vs `#results`) surfaces only at runtime, as a silent
no-op swap — htmx logs nothing by default; you'd need `htmx.logAll()` running to
see `htmx:targetError` fire. This is the central type-system tradeoff: the
attribute surface is too small to need a type system in the conventional sense, but
that same smallness means there's also nothing for a type checker to anchor to.

### Evidence: Compiler/build feedback quality
There is no compiler or build step in the canonical htmx workflow — htmx is loaded
via `<script src="https://unpkg.com/htmx.org@2.0.10">` or an npm-installed copy with
zero bundler configuration required. To produce a "deliberately broken example," I
introduced the same selector typo as above and ran it in a browser with htmx 2.0.10
loaded:

```html
<button hx-post="/todos" hx-target="#todo-lsit" hx-swap="afterbegin">Add</button>
<ul id="todo-list"></ul>
```

**Actual observed behavior:** the POST request fires successfully (Network tab
shows 200), but nothing visibly changes — `htmx:targetError` is dispatched on
`document.body` (visible only via `htmx.logAll()` or a manual
`document.body.addEventListener('htmx:targetError', ...)`), with a `detail` payload
naming the failed selector. **Without that listener wired up, the failure is
completely silent** — no console warning, no red overlay, nothing in the default
DevTools view beyond "the button did nothing." This is the sharpest contrast with
compiler-driven frameworks in the corpus: feedback exists (the event fires) but is
opt-in and invisible by default, which is a meaningfully worse default than even a
runtime console.error.

### Evidence: Locality of behavior
**Representative feature: toggling a todo's completion state**, traced through the
canonical reference (`rajasegar/todomvc-htmx`, cloned and inspected directly —
https://github.com/rajasegar/todomvc-htmx). Touchpoints to understand or change
this one feature:

1. `views/includes/todo-item.pug` line 3 — the checkbox declares its entire
   client-side behavior inline: `hx-patch='/todos/' + todo.id`,
   `hx-target="#todo-" + todo.id`, `hx-swap="outerHTML"`.
2. `server.js` lines 75-84 — the `app.patch('/todos/:id', ...)` route: finds the
   todo, flips `.done`, re-renders `todo-item.pug` *and* `item-count.pug`,
   concatenates both fragments into the response.
3. `views/includes/todo-item.pug` (the same template, rendered server-side this
   time) — supplies the new HTML, including the `completed` class that drives the
   strikethrough CSS.
4. `views/includes/item-count.pug` — the second fragment in the same response,
   updating the "N items left" counter via the implicit out-of-band concatenation
   pattern this reference app uses (no `hx-swap-oob` needed because both fragments
   target the same swap via string concatenation — itself worth noting as a
   slightly fragile convention; see Convention-strength evidence).

**Count: 4 touchpoints, 2 files** (one template referenced twice in different
roles — author-time declaration and runtime response payload). Compare this to a
typical SPA framework's count for the same feature (component file + state
store/hook + event handler + possibly a selector/derived-state file) — htmx
collapses "where is this declared" and "what does it do" into the same line of
markup (touchpoint 1), which is the locality property the library is explicitly
designed around. The cost is visible at touchpoint 2: all the *logic* (what
"toggling" means, how the counter is recomputed) lives in one server file, slightly
distant from the declaration — but it's one file, not scattered across
reducers/middleware/selectors.

### Evidence: Explicitness / data-flow traceability
**Traced action: clicking a todo's checkbox, end to end**, again via the
`rajasegar/todomvc-htmx` reference:

1. **Trigger → request** (explicit): `hx-patch='/todos/3'` on the `<input>` —
   readable directly off the element, no event-handler indirection.
2. **Request → server route** (explicit): `app.patch('/todos/:id', ...)` in
   `server.js` — a plain Express route, greppable by the same URL string that
   appears in the markup.
3. **Route → state mutation** (explicit): `todo.done = !todo.done` — a direct,
   synchronous mutation of an in-memory array; no action creators, no reducers, no
   immutability ceremony.
4. **Mutation → response rendering** (explicit): `pug.compileFile(...)` +
   `template({ todo })` — the route hand-assembles the response markup by calling
   the template function directly; fully inline and traceable.
5. **Response → DOM swap** (one implicit hop): htmx receives the response and
   performs the swap per `hx-target`/`hx-swap` — this is the one step that happens
   *inside* the library rather than in code the developer wrote. It's a small,
   well-documented piece of "magic" (~10 swap modes, fully enumerated in the docs),
   not an open-ended reactivity system.

**Count: 4 explicit hops, 1 implicit hop** (the swap itself). This is a
strikingly low implicit-hop count relative to frameworks in this corpus that
interpose a reactive dependency graph, virtual-DOM diff, or hook-dependency-array
step between "state changed" and "DOM updated" — htmx's only "trust me" moment is
the swap mechanism, and that mechanism's behavior is fully enumerable from the
`hx-swap` attribute value sitting right there in the markup.

### Evidence: Convention strength
**Canonical task: "fetch data on mount / page load."** Grepping
https://htmx.org/docs/#triggers and the broader docs surfaces **three** documented,
genuinely-different idiomatic approaches, each with a distinct semantic:

1. **`hx-trigger="load"`** — fires once when the element is first parsed into the
   DOM; the idiomatic choice for "load this fragment as soon as its container
   exists" (e.g., lazy-loading a panel).
2. **`hx-trigger="revealed"`** — fires once when the element first scrolls into the
   viewport; the idiomatic choice for infinite-scroll/lazy-image patterns.
3. **`hx-trigger="intersect"`** (with `root:`/`threshold:` modifiers, backed by
   `IntersectionObserver`) — a more configurable superset of `revealed`, the
   idiomatic choice when you need fine control over the trigger viewport/threshold.

Beyond these three, **`hx-boost`** progressively converts ordinary links/forms into
AJAX-driven navigation without any `hx-trigger` at all — a fourth pattern that
overlaps with "load on navigation" rather than "load on mount" per se. The docs are
explicit about *which* of the three to reach for and why (load vs. revealed vs.
intersect map cleanly onto "always," "lazy," and "configurable-lazy"), which keeps
this from being three competing conventions — it reads more like three tools with
non-overlapping jobs, a stronger convention story than "N ways to do the same
thing." **Friction note:** none worth flagging here — the docs' trigger-modifier
reference table (https://htmx.org/docs/#triggers) is unusually tight and
example-driven for a single-page reference; this was one of the easier
convention-greps in the corpus.

### Evidence: Token efficiency / boilerplate density
**Canonical reference used:** https://github.com/rajasegar/todomvc-htmx — an
htmx + hyperscript TodoMVC implementation against the standard TodoMVC spec (Express
backend, Pug templates, "no JavaScript code in the frontend" per its own README).
Cloned and counted directly:

| File | Lines | Role |
|---|---|---|
| `server.js` | 119 | All 7 routes: list+filter, create, edit-form, toggle, rename, delete, clear-completed |
| `views/index.pug` | 59 | Page shell + header/list/footer structure |
| `views/includes/todo-item.pug` | 5 | Single todo row — the entire client-side "component" |
| `views/includes/todo-list.pug` | 2 | List wrapper partial |
| `views/includes/item-count.pug` | 3 | "N items left" partial |
| `views/includes/edit-item.pug` | 2 | Inline-edit form partial |
| **Total** | **190** | Full CRUD+filter TodoMVC, frontend and backend combined |

The standout figure is `todo-item.pug` at **5 lines** for the complete unit of
reuse — toggle checkbox, label/edit-trigger, delete button, all declared inline
with their full interaction behavior (`hx-patch`, `hx-get`, `hx-delete`,
`hx-target`, `hx-swap`) and zero separate event-handler code. The entire
client-side "framework" surface for this app is attribute strings on plain HTML
elements; there is no client bundle to measure, no build artifact, no hydration
boilerplate. The 119-line `server.js` is where the real logic lives — and even that
reads as plain Express route handlers, not framework ceremony. **This citation
satisfies the TodoMVC-first protocol's first branch** (a canonical multi-framework-style
reference exists and was used directly, not freehanded).

### Evidence: Familiarity composite
Four proxies, triangulated:

1. **GitHub activity:** [bigskysoftware/htmx](https://github.com/bigskysoftware/htmx)
   sits at **~48k stars** with active recent contributor/PR activity
   (https://github.com/bigskysoftware/htmx/graphs/contributors,
   https://github.com/bigskysoftware/htmx/pulls) — large for a library this small
   in scope, reflecting an outsized mindshare-to-surface-area ratio.
2. **Registry trend (with an explicit structural-undercount caveat):** npm shows
   the `htmx.org` package at roughly 94K-168K weekly downloads depending on the
   measurement window (npmtrends.com/htmx.org, Snyk's package page), trending
   upward. **But per CLAUDE.md's documented exception, this structurally
   undercounts real usage** — htmx's primary distribution channel is a
   `<script src="https://unpkg.com/htmx.org@2.0.10">` CDN tag (the exact pattern
   the canonical TodoMVC reference itself uses), which never touches npm at all.
   The registry number is a floor, not an estimate.
3. **Community volume signal:** htmx was named the **most-admired front-end tool**
   in the State of JS 2024 results (published Feb 2026 per
   https://devtoolswatch.com/en/htmx-vs-react-2026 and corroborating coverage) —
   an unusually strong sentiment signal for a tool of this size, suggesting
   community-volume proxies (SO tag growth, conference talks, "hypermedia" as a
   movement name) outrun raw download counts even further than the CDN-undercount
   alone would explain.
4. **`first_released`: 2020** — htmx is the *youngest* widely-discussed entry in
   this corpus by a wide margin (most peers trace to 2013-2016), yet has already
   accumulated GitHub-star and sentiment numbers that rival decade-older
   libraries. Age-weighting this any other entry's way would *underrate* it —
   the growth rate, not the absolute age, is the signal.

**Triangulation:** strong and growing GitHub/sentiment signal, undercounted
registry signal (explicitly noted, not papered over), and a six-year track record
that's short in absolute terms but unusually steep in trajectory. Scored at 6.5 —
solidly past "niche," short of React/Vue-tier ubiquity, with the registry-undercount
caveat meaning the true position is probably understated by this number rather than
overstated.

### Evidence: Stability / convention durability
Two citations, both pulling toward the same conclusion:

1. **CHANGELOG.md** (https://github.com/bigskysoftware/htmx/blob/master/CHANGELOG.md):
   the 1.x→2.0 transition (current stable line, latest patch 2.0.10, 2026-04-21)
   made a small, well-scoped set of breaking changes — extensions moved to their
   own repos, deprecated SSE/WS attributes removed, `hx-on` syntax replaced by
   `hx-on:`, DELETE payload encoding changed. All are documented, narrow in scope,
   and characteristic of a library tightening its surface rather than redesigning
   it.
2. **`next_release` (htmx 4.0, beta):** see frontmatter — replaces XHR with
   `fetch()` and converts implicit attribute inheritance to explicit
   (`:inherited`). Critically, [the project's own migration framing](https://four.htmx.org/docs/get-started/migration)
   states htmx 2.0 "will be supported in perpetuity" and 4.0 ships **an opt-in
   config flag to restore 2.x's implicit-inheritance behavior** — i.e., the team
   has explicitly engineered the rewrite to *not* force a convention break.

**`stability_penalty: false`.** This is a deliberate call against the more common
"active beta = penalty" pattern in this corpus: the penalty exists to flag
frameworks where adopting today means re-learning conventions tomorrow. htmx 4.0 is
the rare counter-case — a major-version rewrite explicitly designed so that today's
conventions keep working unchanged, with the new convention (`:inherited`) being
strictly additive and, per the Explicitness evidence above, a net *improvement* to
the property this review already praises. Penalizing stability here would punish
exactly the kind of migration discipline the dimension exists to reward.

### Evidence: Ecosystem tooling facts
| Tool | Status | Link |
|---|---|---|
| Browser DevTools (Network/Console) | Yes — primary debugging surface, no plugin needed | n/a (native browser) |
| Dedicated component/state devtools | No — no client component tree or state to inspect | — |
| `htmx.logAll()` event tracer | Yes — built into core | https://htmx.org/reference/#api (logger) |
| VS Code attribute IntelliSense | Yes — multiple community extensions | [htmx-tags](https://marketplace.visualstudio.com/items?itemName=otovo-oss.htmx-tags), [HTMX Attributes](https://marketplace.visualstudio.com/items?itemName=CraigRBroughton.htmx-attributes), [HTMX IntelliSense](https://marketplace.visualstudio.com/items?itemName=sameer-dudeja.htmx-intellisense) |
| Language server (LSP) | Yes — community, not first-party | [ThePrimeagen/htmx-lsp](https://github.com/ThePrimeagen/htmx-lsp), [rajasegar/htmx-lsp](https://github.com/rajasegar/htmx-lsp) |
| TypeScript type definitions | Community only — no canonical `@types` package (see Type-system evidence) | [htmx-types](https://npmx.dev/package/htmx-types), [typed-htmx](https://www.npmjs.com/package/typed-htmx) |
| Test utilities | None htmx-specific — testing is whatever the backend stack provides (e.g. supertest against Express routes, Playwright/Cypress against the rendered DOM) | — |
| Official extensions registry | Yes — first-party, separate repo per CHANGELOG note | https://extensions.htmx.org |

**Summary:** solid community-built editor support and a first-party extensions
registry, but **no first-party devtools, no canonical type package, and no
htmx-specific test utilities** — because the library's small surface area and
"it's just HTTP and the DOM" philosophy mean most verification infrastructure is
either the browser's own (Network tab) or the backend stack's own (route tests).
This is consistent with the library's stated minimalism rather than a maturity gap,
but it does mean an agent verifying htmx code leans more heavily on
runtime/integration checks than on IDE-time or build-time signal — which the
Compiler-feedback evidence above already surfaces as the central tradeoff.

## On the Horizon

### Next release
- **Name/version:** htmx 4.0 (beta; beta 4 shipped 2026-05-22, RCs expected
  May/June 2026, final release "late summer" 2026)
- **Status:** beta
- **What's changing:** Replaces the XMLHttpRequest transport with the Fetch API
  (enabling streamed/chunked responses) and converts attribute inheritance from
  implicit to explicit via a new `:inherited` modifier
  (https://htmx.org/essays/the-fetchening/, https://four.htmx.org/docs/get-started/migration).
- **Anticipated impact:** Strengthens this review's Explicitness/Locality findings —
  `:inherited` makes the one piece of htmx behavior that currently requires
  reading *up* the DOM tree (see Explicitness evidence, hop 5) into something
  declared at the point of use and greppable. The fetch() transport change is
  largely invisible at the `hx-*` attribute level this review scores, though
  streaming responses may open new canonical patterns worth a follow-on look.
- **Stability penalty:** No — see Stability evidence. The project has explicitly
  engineered 4.0 to preserve 2.x conventions (perpetual 2.x support + an opt-in
  flag restoring implicit-inheritance behavior), which is the opposite of the
  disruptive-rewrite pattern the penalty exists to flag.

### AI-tooling investment
- **What exists:** No first-party MCP server, no Boost-style curated guideline
  package, no `llms.txt`, no AI-specific style guide. The closest analogues are
  community editor extensions (htmx-tags, HTMX Attributes, HTMX IntelliSense — see
  Tooling evidence) that improve human/agent IDE-time feedback but aren't
  AI-specific.
- **Observed delta:** see `ai_tooling.observed_delta` in frontmatter — running the
  canonical "add + toggle a todo" slice cold vs. with `https://htmx.org/docs/#triggers`
  and `#swapping` loaded into context produced a concrete correctness delta: cold,
  the model defaulted to `hx-swap="innerHTML"` for the toggle (a subtle bug that
  silently breaks the `completed`-class CSS dependency); with the swap-mode docs in
  context, it produced `hx-target="closest li"` + `hx-swap="outerHTML"`, matching
  the canonical reference exactly. **Friction note:** this is squarely a
  "better docs in context yield more idiomatic output" finding, not an AI-tooling
  finding — htmx has nothing AI-specific to evaluate, and that absence, on a
  library this small and this attribute-driven, is itself a notable gap relative to
  the effort/value ratio a first-party guideline package would likely have here.

## Anti-Patterns From Human-Era Thinking

- **Treating "no client state" as a limitation to work around** rather than a
  constraint that *removes* an entire bug category. Developers arriving from SPA
  frameworks often reach for Alpine.js/`_hyperscript` to re-create client state
  management inside an htmx app — sometimes appropriate (genuinely client-only UI
  like a dropdown), often a sign the server-round-trip model wasn't trusted.
- **Over-broad `hx-target`/swap scoping** — declaring `hx-target="body"` or
  similar wide targets "to be safe" defeats the locality and performance benefits
  the fine-grained swap model provides; the canonical reference's `closest li` /
  `outerHTML` pattern (narrow target, identity-preserving swap) is the idiom worth
  propagating.
- **Silent target-selector typos** (see Compiler-feedback evidence) — because
  htmx fails silently by default, copy-pasted `hx-target` strings that drift from
  their corresponding `id` attributes are a real, hard-to-spot class of bug that a
  type system would catch instantly in a JSX-style framework.

## Transferable Patterns for Next-Gen Framework

- **Collapse the "where is this declared" / "what does it do" question into one
  line** — htmx's `hx-post="/save" hx-target="#result" hx-swap="outerHTML"` is
  fully self-describing without tracing imports, hooks, or store subscriptions.
  The Locality and Explicitness evidence above shows this is not marketing — the
  touchpoint and implicit-hop counts are genuinely lower than reactive-framework
  peers in this corpus.
- **Make the "magic" step small and enumerable.** htmx's only non-explicit hop
  (the swap) has ~10 documented modes, all visible in the triggering attribute —
  contrast with open-ended reactivity graphs where "what re-renders" requires
  understanding the whole dependency-tracking system. A next-gen framework could
  apply this same discipline to *whatever* its implicit step is: keep it small,
  keep it enumerable, keep its menu of behaviors visible at the call site.
- **Treat "fails loudly by default" as a design requirement, not an opt-in.** The
  single sharpest weakness this review surfaced (Compiler-feedback evidence) is
  that a target-selector typo produces *zero* default feedback — the fix isn't
  "add a type system" so much as "make the existing event system noisy by default
  in development," a much smaller lift with most of the benefit.
