---
name: "Web Components"
category: "web-components-library"
github_url: "https://github.com/WICG/webcomponents"
docs_url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_components"
implementation_language: "JavaScript"
status: "active"
type_system_score: 4.5
compiler_feedback_score: 4.5
locality_score: 8.5
explicitness_score: 8
convention_strength_score: 4
token_efficiency_score: 5
familiarity_score: 6.5
stability_score: 7.5
tooling_score: 5.5
version: "Custom Elements v1 / Shadow DOM v1 (living standard)"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No platform-specific tooling exists to test a delta against (see AI-tooling investment below) — the closest analogue is MDN's web-components-examples repo and webcomponents.guide, both general docs rather than agent-facing tooling. Ran the canonical add+toggle slice (see Token-efficiency evidence) once cold and once after loading https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements into context. Cold, the model produced a `connectedCallback` that re-attached event listeners on every reconnection (a documented footgun — MDN explicitly warns connectedCallback can fire more than once) and used `innerHTML` inside `attributeChangedCallback` without the customary `#root` shadow-root indirection. After loading the MDN guide, the model added the idempotency guard unprompted and used `attachShadow({mode:'open'})` + `shadowRoot.querySelector` consistent with the guide's own examples — one fewer correction round-trip. This is a 'better docs in context produce more idiomatic code' delta, not an AI-tooling delta — there is no AI-specific tooling to evaluate, which is itself the finding."
next_release:
  name: "Scoped Custom Element Registries"
  status: "announced"
  changes: "Ships in Chrome/Edge 146 (~March 2026) and has positive signals from Safari (shipped) and Gecko; lets a shadow root attach its own CustomElementRegistry via `attachShadow({ customElementRegistry })`, so two independently-authored components can both define `<my-button>` without colliding in the global `customElements` registry."
  anticipated_impact: "Directly addresses the single most-cited structural weakness of native Web Components versus wrapper libraries like Lit/Stencil: the global, define-once `customElements.define()` registry that makes composing components from multiple third-party sources fragile (see Convention-strength and Locality evidence). Once broadly shipped, this closes a real gap between 'native' and 'wrapper-library' component composition stories — a positive, convention-strengthening change rather than a disruptive one."
  stability_penalty: false
components:
  - "web-components"
  - "html"
supersedes: null
superseded_by: null
typescript_support: "native"
license: "N/A"
runtime: "browser"
capabilities:
  state_management: false
  rendering: false
  event_handling: false
paradigm: "imperative"
state_model: "mutable"
rendering_strategy: "direct-dom"
maintainer: "WHATWG/W3C/WICG (browser vendors)"
first_released: "2011"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Combo file for the same structural reason as htmx+HTML and Alpine+HTML: native Web Components (Custom Elements, Shadow DOM, HTML Templates, ES Modules) have no coherent standalone story apart from the HTML/DOM platform they extend. This is explicitly the 'baseline' entry in the web-components family — Lit (research/lit.md) and Stencil (research/stencil.md) are full alternatives that wrap these same primitives with ergonomic and compile-time layers, and are reviewed standalone because they're substitutes for each other and for vanilla Web Components, not implementation details of this review."
---

# Web Components + HTML

> **Framing note:** \"Web Components\" is not a framework, library, or even a single
> spec — it's an umbrella term (coined ~2011, standardized across several WHATWG/W3C
> specs: Custom Elements v1, Shadow DOM v1, HTML `<template>`, ES Modules) for a set of
> browser-native primitives that let you define new HTML elements with encapsulated
> structure, style, and behavior. Used "vanilla" — without Lit, Stencil, or another
> wrapper — they're the substrate every web-components *library* sits on, and the
> direct browser-platform alternative to reaching for one. This review scores that
> vanilla experience: what an agent gets when it writes `class extends HTMLElement`
> directly against the platform, with nothing between it and the browser.

## State Management

### Philosophy & Mental Model

- **There is no state management layer.** Custom Elements are classes extending `HTMLElement`; whatever state they hold is private instance fields (`#count = 0`) or — per the canonical reference implementation's central thesis — **attributes/properties on the element itself**, making the DOM the source of truth rather than a view over separately-held JS state.
- **"Store the state in the DOM"** is a real, documented, and increasingly-promoted idiom (see `johnfactotum/todomvc`, cited in Token-efficiency evidence below, and `webcomponents.guide`): rather than `state = {todos: [...]}; render(state)`, you represent each todo as a `<todo-item description="..." completed>` element, and *the element list itself* is the model. Adding an item is `todos.append(document.createElement('todo-item'))`; nothing more.
- **Reflected attributes** (`observedAttributes` + `attributeChangedCallback`) are the platform's only built-in change-notification primitive — a coarse, string-based pub/sub between the DOM and your class.
- Mental model: closer to "the element *is* the state, the DOM *is* the store" than to any framework's state/view split. This is philosophically distinct from React/Vue/Svelte's "JS state, rendered view" model — and from Lit's, which still keeps reactive properties as the primary state surface and treats the DOM as derived output.

### Core Primitives

- **`class extends HTMLElement`** — the only component primitive; defined once via `customElements.define('tag-name', MyClass)`.
- **Private class fields (`#x`)** — instance-scoped state, plain JS, no reactivity.
- **`static observedAttributes`** + **`attributeChangedCallback(name, oldValue, newValue)`** — the platform's declarative "what should I react to" mechanism; purely string-typed.
- **`CustomEvent`** — the platform's pub/sub primitive for cross-component communication (`dispatchEvent(new CustomEvent('change', { detail, bubbles: true, composed: true }))`).
- **`MutationObserver`** — watches DOM subtree changes; the closest thing to a reactive subscription the platform offers, and (per the canonical reference) usable as a genuine state-change notification system when state lives in the DOM.
- **`localStorage`/`sessionStorage`** — the only built-in persistence primitive; serialization is manual (or, in the DOM-as-state idiom, `innerHTML` round-tripping).

### Update Mechanism

Two idiomatic patterns coexist, and the gap between them is the central state-design decision an agent must make per-project:

**Class-field idiom** (state lives in JS, DOM is rendered from it — closer to the "vanilla JS" baseline reviewed separately):
```js
class Counter extends HTMLElement {
  #count = 0
  connectedCallback() {
    this.shadowRoot.querySelector('button')
      .addEventListener('click', () => { this.#count++; this.#render() })
    this.#render()
  }
  #render() { this.shadowRoot.querySelector('span').textContent = this.#count }
}
```

**DOM-as-state idiom** (state lives in attributes; the element's own attribute setter *is* the update — directly from the canonical reference implementation, `johnfactotum/todomvc`):
```js
this.#root.querySelector('#checkbox').addEventListener('click', () => {
  if (this.hasAttribute('completed')) this.removeAttribute('completed')
  else this.setAttribute('completed', '')
})
// attributeChangedCallback then projects the attribute into rendered output —
// the *write* and the *render trigger* are the same statement.
```
Both are ordinary, steppable, synchronous calls — no proxies, no compiler rewrites, no batching semantics to learn. The second pattern is more idiomatically "platform-native" but far less familiar to agents trained primarily on framework-shaped (state-then-render) code.

### Read Pattern

- **`this.getAttribute(name)` / `this.hasAttribute(name)`** for the DOM-as-state idiom; reflected as **getter/setter properties** by convention (`get completed() { return this.hasAttribute('completed') }`) for ergonomic JS-side access — but the platform does not generate these for you; you write them by hand, every time, for every attribute.
- **Private fields** for the class-field idiom — direct property access, no subscription machinery.
- **No selector/derived-read primitive** exists; `computed`-equivalent values are plain getter functions recomputed on every access (see Derived State).

### Reactivity & Granularity

- **None, automatically.** `attributeChangedCallback` fires on attribute mutation, but updating *rendered output* from that callback is something you write by hand, every time — there is no dependency tracking, no diffing, no "what re-renders" question the platform answers for you.
- Granularity is **whatever you implement**: the canonical reference's `attributeChangedCallback` does a single targeted `textContent`/`ariaChecked` write per changed attribute — genuinely fine-grained, but only because the author hand-wired exactly that.
- **`MutationObserver`** can substitute for a subscription system (observe `childList`/`attributes`, react to changes) — the canonical reference uses one to detect todo add/remove/toggle and recompute the footer counts, which is a legitimately elegant DOM-native pattern, but it's also a pattern an agent has to be *taught* rather than one it can derive from "how React/Vue/Svelte do it."

### Async Handling

- **No built-in primitives.** `connectedCallback` is the documented place to kick off a `fetch` (MDN: "connectedCallback is the ideal place for fetching data... from that moment you can be sure it's available in the DOM" — `https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements`), but loading/error/data state, request deduplication, and abort-on-disconnect are entirely manual:
```js
async connectedCallback() {
  if (this.#controller) return // guard against re-invocation — MDN explicitly warns this fires more than once
  this.#controller = new AbortController()
  try {
    const res = await fetch(this.getAttribute('src'), { signal: this.#controller.signal })
    this.#data = await res.json()
    this.#render()
  } catch (e) { if (e.name !== 'AbortError') this.#renderError(e) }
}
disconnectedCallback() { this.#controller?.abort(); this.#controller = null }
```
- This is the same shape of manual loading/error/abort bookkeeping documented in the Vanilla JS review (`research/vanilla-js.md`) — Web Components add a *lifecycle hook to anchor it to* (a real, if modest, improvement) but no async primitives of their own.

### Derived State

- **Plain getter functions**, recomputed on every read — no memoization, no dependency tracking:
```js
get remaining() {
  return [...this.querySelectorAll('todo-item')].filter(el => !el.hasAttribute('completed')).length
}
```
- The canonical reference computes derived counts (`active`, `completed`, `total`) inline inside its `MutationObserver` callback, recomputing from a live DOM query each time — correct, but an agent has to recognize "recompute from `querySelectorAll` on every relevant mutation" as the idiom; nothing in the platform suggests it.

### Developer Experience

- **Boilerplate: high.** Every attribute needs a manually-written reflecting getter/setter; every event needs explicit `addEventListener`/cleanup; there is no batch-update, no `setState`-equivalent.
- **DevTools:** Browser DevTools' Elements panel shows custom element tags and (with "Show user-agent shadow DOM" enabled) shadow roots — but there is no state inspector, no "what changed and why" view, no time-travel. You're back to `console.log` and breakpoints (see Ecosystem tooling facts).
- **Debugging:** Entirely manual; no framework-shaped abstraction to leak through, which is a genuine *strength* for traceability (see Explicitness evidence) but means zero specialized tooling support.
- **Time travel:** No, and nothing platform-native to build it from beyond `MutationObserver` + manual snapshotting.

## Rendering

### Philosophy & Approach

- **Direct DOM manipulation through a standardized component shell.** Custom Elements don't add a rendering strategy — they add a *lifecycle* (`connectedCallback`/`disconnectedCallback`/`attributeChangedCallback`/`adoptedCallback`) and an *encapsulation boundary* (Shadow DOM) around the same imperative DOM APIs the Vanilla JS review documents.
- **Declarative authoring, imperative updates**: you can author initial structure declaratively via `<template>` + Shadow DOM, but updating that structure in response to state change is, again, manual `textContent`/`setAttribute`/`classList` calls — there's no reactive binding from data to template.

### Update Strategy

- **Manual, hook-anchored.** `attributeChangedCallback` and `connectedCallback` are the *only* platform-provided triggers; everything inside them — what to update, how much, in what order — is hand-written.
- **`<template>` + `cloneNode(true)`** is the platform-native templating primitive: parse once, stamp many times, with inert content (scripts don't run, images don't load) until cloned into the live DOM — a genuine, useful, standards-based answer to "how do I avoid `innerHTML` reparses on every render."

### Reconciliation

- **None.** No diffing, no virtual DOM, no keyed-list reconciliation. The canonical reference sidesteps the entire problem by making *DOM mutation* the state-change operation — `item.remove()` instead of "recompute list, diff, patch" — which is elegant when state naturally maps to elements (lists of records) and a non-starter when it doesn't (computed aggregates, cross-cutting derived views).
- For anything that doesn't fit the DOM-as-state mold, you're writing the same manual reconciliation loops documented in `research/vanilla-js.md` — Web Components don't change that calculus, they just give the resulting code a standardized class shape to live in.

### Templating & Syntax

- **`<template>` element** (inert, clonable, the platform's actual templating primitive) + **Shadow DOM** (`attachShadow({ mode: 'open' | 'closed' })`) for style/structure encapsulation — this pairing *is* the idiomatic native answer, used directly in the canonical reference:
```html
<template id="todo-item-template">
  <style>:host([completed]) span { text-decoration: line-through }</style>
  <span id="span"></span>
  <button title="Delete">×</button>
</template>
```
```js
customElements.define('todo-item', class extends HTMLElement {
  #root = this.attachShadow({ mode: 'closed' })
  constructor() {
    super()
    const tpl = document.querySelector('#todo-item-template')
    this.#root.append(tpl.content.cloneNode(true))
  }
})
```
- **Declarative Shadow DOM** (`<template shadowrootmode="open">`, standardized and shipped across Chromium/Safari/Firefox since ~2024) lets you express the shadow tree in server-rendered HTML directly — closing a long-standing SSR gap, and worth knowing as current-not-experimental.
- No JSX, no compiled templates, no expression syntax — `${}` interpolation only exists if you build it yourself with template literals (the same `html` tagged-template pattern documented in the Vanilla JS review).

### Component Model

- **The component model *is* the platform's element model**: a Custom Element is a real `HTMLElement` subclass, usable anywhere HTML is — in any framework, in plain markup, server-rendered with Declarative Shadow DOM, copy-pasted between unrelated projects. This cross-framework portability is Web Components' single most distinctive, durable property, and it's a platform guarantee, not a library promise.
- **Props pattern**: attributes (always strings) reflected to/from properties (any JS value) — by hand, with no generated boilerplate:
```js
get value() { return Number(this.getAttribute('value')) || 0 }
set value(v) { this.setAttribute('value', String(v)) }
```
This string/object reflection seam is a well-known, frequently-cited friction point (complex props — arrays, objects, callbacks — don't reflect to attributes at all; you assign them as properties directly, `el.items = [...]`, breaking the "it's just HTML" illusion the moment data gets non-trivial).
- **Slots** (`<slot>`, `<slot name="...">`) are the platform's native composition/children mechanism — directly analogous to React's `children` or Vue's default/named slots, but standards-based and usable from plain HTML.

### Performance Optimizations

- **`<template>` cloning** avoids re-parsing markup on every instantiation (a real, measurable win over `innerHTML`-per-render).
- **Shadow DOM style scoping** avoids the global-CSS-cascade performance and correctness problems that plague large vanilla apps.
- Everything else — virtualization, batching, memoized derived reads — is exactly as manual as in plain Vanilla JS; Custom Elements don't change the performance-optimization calculus, they just give you a standardized place to put the optimized code.

### Developer Experience

- **Learning curve:** medium — the lifecycle callbacks (`connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`, `adoptedCallback`) and Shadow DOM's style/event-retargeting semantics (`composed: true`, `:host`, `::slotted()`) are genuinely new concepts beyond plain DOM scripting, each with their own gotchas (MDN explicitly documents that `connectedCallback` "can be called more than once" — a recurring, easy-to-miss footgun for anyone writing fetch-on-mount code).
- **DevTools:** browser-native only (see Ecosystem tooling facts) — no component tree, no state inspector.
- **Hot reload:** none, natively; depends entirely on whatever build tooling (Vite, etc.) you bolt on.

## Event Handling

### Philosophy & Approach

- **Standard DOM events, plus one platform addition: `CustomEvent` + Shadow DOM event retargeting/composition.** This *is* the foundation the Vanilla JS review documents, with two genuinely new wrinkles: (1) events crossing a shadow boundary are **retargeted** (`event.target` appears as the host element from outside the shadow tree, preserving encapsulation), and (2) the **`composed: true`** flag on `CustomEvent` controls whether an event can cross shadow boundaries at all — a real, must-understand-to-use-correctly platform concept with no framework analogue to lean on.

### Event Binding

- **`addEventListener`**, exactly as in plain DOM scripting — typically wired up in `connectedCallback` (when the element enters the DOM and its shadow tree exists) and torn down in `disconnectedCallback`:
```js
connectedCallback() {
  this.#root.querySelector('button').addEventListener('click', this.#onClick)
}
disconnectedCallback() {
  this.#root.querySelector('button').removeEventListener('click', this.#onClick)
}
```
- **Custom events for cross-component communication** — the platform's actual answer to "how does a child tell a parent something happened":
```js
this.dispatchEvent(new CustomEvent('todo-toggled', {
  detail: { id: this.id, completed: this.hasAttribute('completed') },
  bubbles: true, composed: true   // composed: true required to escape this element's shadow root
}))
```

### Event Flow

- **Standard capture/target/bubble**, exactly as documented for native DOM events — plus **shadow-boundary retargeting**: an event dispatched inside a shadow root and observed from outside it reports `event.target` as the *host* element, not the internal element that actually fired it (a deliberate encapsulation feature, and a real source of "why is `e.target` not what I expected" confusion for anyone coming from non-shadow-DOM code).
- `stopPropagation()`/`stopImmediatePropagation()`/`preventDefault()` work identically to native DOM events — no platform-specific override.

### Event Object

- **Native `Event`/`CustomEvent`** — no synthetic wrapper, no framework-specific event pooling or normalization. What you get is exactly the browser's object, with `event.detail` as the one Custom-Event-specific addition carrying your payload.

### Common Patterns

- **Passing data to handlers**: via `CustomEvent.detail` (cross-component) or closures/data attributes (within-component) — identical to the patterns documented in `research/vanilla-js.md`.
- **Accessing component state in handlers**: arrow-function class fields (`#onClick = () => { this.#count++ }`) preserve `this` binding — the idiomatic native pattern, used throughout the canonical reference.
- **Preventing default**: `event.preventDefault()`, identical to native DOM.

### Performance Considerations

- **Identical concerns to Vanilla JS** — manual listener cleanup in `disconnectedCallback`, event delegation for large lists, the same memory-leak risks — Web Components add a *lifecycle anchor point* for cleanup (a real, modest improvement: `disconnectedCallback` is a natural, well-known place to call `removeEventListener`) but no automation.

### Developer Experience

- **Debugging:** browser DevTools' "Event Listener Breakpoints" and the Elements panel's event-listener badge work on Custom Elements exactly as on native ones — no degradation, no enhancement.
- **Type safety:** `CustomEvent<T>` is generic over `detail`, but — as the Type-system evidence below shows concretely — `addEventListener`'s overloads are keyed to `HTMLElementEventMap`, which has no entry for your custom event names, so the type system actively fights you at exactly the moment you're using the platform's own recommended cross-component-communication primitive.

## Rubric Evidence

### Evidence: Type-system integration
**Categorical: native** (TypeScript ships `lib.dom.d.ts` with full `HTMLElement`/`CustomEvent`/`ShadowRoot` typings — no separate `@types` package, no community fork required).

Sample type errors from a deliberately-broken 20-line snippet (`npx tsc --strict --target ES2022 --lib ES2022,DOM --noEmit`, TypeScript 5.7):
```
bad.ts(6,5): error TS2531: Object is possibly 'null'.
  // this.shadowRoot.innerHTML — shadowRoot is `ShadowRoot | null` until you narrow it
bad.ts(18,4): error TS2769: No overload matches this call.
  Argument of type '"count-changed"' is not assignable to parameter of type 'keyof ElementEventMap'.
  Type '(e: CustomEvent<{ count: number }>) => void' is not assignable to type 'EventListener'.
    Types of parameters 'e' and 'evt' are incompatible.
      Type 'Event' is missing the following properties from type 'CustomEvent<...>': detail, initCustomEvent
bad.ts(19,30): error TS2339: Property 'toUpperCase' does not exist on type 'number'.
```
This is a real, structural finding, not a snippet artifact: **the platform's own `addEventListener` typings have no slot for custom event names** (`ElementEventMap` is a closed, browser-defined map), so the moment you use `CustomEvent` — the platform's *documented, idiomatic* cross-component-communication primitive — `tsc` forces you to either cast (`as EventListener`) or hand-author a `declare global { interface HTMLElementEventMap { 'count-changed': CustomEvent<{count:number}> } }` augmentation. Wrapper libraries (Lit, Stencil) paper over exactly this seam with decorators/codegen; vanilla Web Components leave it as a known, documented (if under-advertised) friction point. The `shadowRoot` nullability catch, by contrast, is exactly the kind of real, useful guard rail strict TS provides for free.

### Evidence: Compiler/build feedback quality
There is no framework compiler — "build feedback" *is* `tsc`'s feedback against `lib.dom.d.ts` (above) plus the browser's own runtime errors. A representative runtime failure — forgetting `customElements.define()` before use:
```
Uncaught (in promise) TypeError: Failed to construct 'HTMLElement': Please use the 'new' operator
```
or referencing an undefined custom element:
```html
<todo-item></todo-item>  <!-- renders as an inert, unstyled HTMLUnknownElement; no error at all -->
```
This second case is the deliberately-broken example's most instructive failure mode: **a misspelled or not-yet-defined custom element tag produces *no error whatsoever*** — it silently becomes a featureless `HTMLUnknownElement` that renders its children as plain inline content. `customElements.whenDefined(name)` exists to detect this programmatically, but nothing surfaces it by default — an agent (or human) staring at "my component just isn't showing up" gets zero direct signal pointing at the typo. This is a genuine, sharp-edged gap relative to frameworks whose compilers reject unknown component references at build time.

### Evidence: Locality of behavior
Traced the canonical reference's `todo-item` feature (toggle-complete + inline-edit + delete) end to end. Touchpoints required to understand or change it, all living in **one file** (`index.html`, the canonical reference is deliberately single-file):
1. The `<template id="todo-item-template">` markup block (structure)
2. The `<style>` block *inside* that template (Shadow-DOM-scoped CSS — `:host([completed])`, `:host([editing])` state-driven selectors)
3. The `customElements.define('todo-item', class extends HTMLElement {...})` class body (behavior: constructor wiring, `attributeChangedCallback`)
4. The attribute-as-state contract (`completed`, `editing`, `description` — declared in `static observedAttributes`, read via `getAttribute`/`hasAttribute`, *and* referenced in the CSS selectors above — a single naming vocabulary spanning all three)

**Count: 4 touchpoints, 1 file.** This is a genuinely strong locality result — markup, style, and behavior for one encapsulated unit sit physically adjacent, connected only by a shared, greppable attribute-name vocabulary (no indirection through a separate selector/store/reducer layer). The cost: that vocabulary is *convention*, not compiler-enforced — nothing stops attribute name drift between the `static observedAttributes` array, the `getAttribute` calls, and the CSS selectors (see Convention-strength evidence for how this plays out at scale).

### Evidence: Explicitness / data-flow traceability
Traced one user action — clicking a todo's checkbox — from trigger to visual update, in the canonical reference (`johnfactotum/todomvc`):
1. **Click → listener** (explicit): `addEventListener('click', ...)` registered in the constructor — directly steppable.
2. **Listener → attribute write** (explicit): `this.setAttribute('completed', '')` / `removeAttribute('completed')` — an ordinary method call, no indirection.
3. **Attribute write → `attributeChangedCallback`** (semi-implicit, but *documented platform contract*, not framework magic): the browser invokes this callback because `'completed'` is listed in `static observedAttributes` — one named, spec'd hop, greppable by searching for the attribute name across exactly three sites (the array, the callback's `switch`, and the CSS).
4. **`attributeChangedCallback` → DOM write** (explicit): `this.#root.querySelector('#checkbox').ariaChecked = ...` — direct, steppable property assignment.
5. **CSS state selectors → visual change** (declarative, but *visible in the same file*, not hidden behind a runtime style-computation layer): `:host([completed]) span { text-decoration: line-through }` fires automatically off the same attribute, zero JS involved.

**Count: 4 explicit hops, 1 semi-implicit (but spec-documented, not framework-invented) hop.** This compares very favorably to virtual-DOM frameworks' "state set → scheduler → reconciler → committer → DOM" chains — there is exactly one non-directly-steppable link, and it's a *named platform contract* (`observedAttributes`/`attributeChangedCallback`) you can read the spec for, not opaque internal framework machinery.

### Evidence: Convention strength
Grepped docs/examples/blog posts for "how do you fetch data on mount in a Custom Element" — found **at least four materially different idiomatic-looking answers**, with no canonical ranking among them:
1. **`connectedCallback` + manual guard** (MDN's own documented recommendation, `developer.mozilla.org/.../Using_custom_elements`) — "ideal place for fetching data" but explicitly warned to potentially fire more than once, requiring a hand-rolled idempotency guard that *no two examples write identically*.
2. **`attributeChangedCallback` keyed off a `src`/`url` attribute** (Frontend Masters' "Fetching Data" lesson and several blog tutorials) — fetch triggers on attribute change rather than connection, a meaningfully different lifecycle binding with different re-fetch semantics.
3. **Constructor-time fetch** — explicitly *discouraged* by the spec ("the spec recommends developers implement custom element setup in `connectedCallback` rather than the constructor" — `webcomponents.guide`/Lifecycle Reference) yet still appears in a non-trivial fraction of community tutorials and Stack Overflow answers predating that guidance solidifying.
4. **Lazy-load via `IntersectionObserver` inside `connectedCallback`** — a "performance-conscious" variant promoted in several 2024-2025 web.dev/Smashing Magazine articles, layering a second observer pattern on top of the lifecycle hook.

This is a genuinely **wide spread for a single canonical task**, and it's a direct, structural consequence of the platform providing *lifecycle hooks* but no *data-layer convention* — every wrapper library (Lit's `willUpdate`, Stencil's `componentWillLoad`) narrows this to one blessed answer; vanilla Web Components leave the choice, and its footguns, entirely to the author. **Documentation friction note**: locating MDN's specific "fire more than once" warning took three searches across MDN, webcomponents.guide, and a Salesforce LWC doc that turned out to describe a *different* (LWC-specific) lifecycle — the canonical platform guidance is correct but not prominently cross-linked from the tutorials that most directly contradict it.

### Evidence: Token efficiency / boilerplate density
**Used a canonical reference implementation**: `johnfactotum/todomvc` (`https://github.com/johnfactotum/todomvc`), explicitly written and presented as a from-scratch TodoMVC built on native Web Components + `<template>` + `MutationObserver` — no framework, no build step, single HTML file. The author's own framing (quoted in the README) doubles as useful primary-source evidence about the platform's idioms: *"Unlike most TodoMVC examples, there isn't a 'store' where you have a bunch of `addTodo()`, `removeTodo()` methods... Everything lives directly in the DOM."*

Measured directly (`awk` between `<script>`/`</script>` tags, `wc -l` on the whole file):
| Section | Lines | Role |
|---|---|---|
| `<style>` (page-level CSS) | 124 | Layout/theming |
| `<template id="todo-item-template">` incl. its scoped `<style>` | ~70 | Per-item structure + Shadow-DOM-scoped style |
| `<script>` (all JS: class definition, event wiring, persistence, filter routing) | **112** | Full app behavior |
| **Total file** | **338** | Single-file app |

The author's own count — "**101 lines of code in vanilla JavaScript**, 1kb minified+gzipped" — nearly matches the 112-line measurement above (the small gap is attributable to counting conventions around blank lines/braces). **For comparison**, the Preact TodoMVC canonical reference (cited in `research/preact.md`) runs 335 lines of *JS alone*, across six files, for the same spec — roughly **3x** the JS volume vanilla Web Components needed, though Preact's reference also wires up routing, model persistence, and a virtual-DOM render layer the native version gets "for free" by keeping state in the DOM. This is a meaningfully apples-to-apples comparison point: both are author-vetted, spec-identical references, and the gap is structural (DOM-as-model vs. JS-model-then-render), not idiomatic sloppiness on either side.

### Evidence: Familiarity composite
Four proxies, triangulated for a *platform API* rather than a single library/package (no single `npm_package` exists for "Web Components" — they ship in every evergreen browser):
- **`first_released`: ~2011** (term coined at Fronteers Conference; Custom Elements v1 and Shadow DOM v1 standardized and shipped across Chromium/Firefox/Safari by ~2018-2020) — over a decade of platform presence, meaning a deep, broad training-data footprint spanning multiple API revisions (v0 → v1 churn is itself a documented historical wrinkle agents may surface stale v0 syntax from).
- **GitHub activity**: the spec incubation repo `WICG/webcomponents` — 4,489 stars, pushed 2025-12-09, 204 open issues (`https://github.com/WICG/webcomponents`); MDN's `mdn/web-components-examples` — 3,361 stars, pushed 2026-01-13 (`https://github.com/mdn/web-components-examples`) — both active, current, healthy.
- **Registry trend** (proxy via the ecosystem's most-downloaded *wrapper*, since the platform itself has no package): `lit` — 25.4M downloads/month (`api.npmjs.org`, 2026-05-04 to 2026-06-02); the **legacy polyfill** `@webcomponents/webcomponentsjs` — 1.28M/month, roughly flat year-over-year (34.6K/day → 42.7K/day average), indicating the legacy-browser support tail persists but isn't shrinking dramatically — itself a signal that "ship Custom Elements without a polyfill" still isn't universally safe to assume, three-plus years after broad native support landed.
- **SO/community volume**: "web components" and "custom elements" remain perennial top-level Stack Overflow tags with steady, multi-year question volume; MDN's Web Components docs are a consistently top-ranked search result for "how do I make a reusable HTML element," giving the corpus broad surface area — but, as the Convention-strength evidence shows, that corpus is *fragmented* across multiple non-canonical idioms rather than converged on one.

Triangulation: old (12+ years), broadly platform-supported, steadily-documented, but — unlike a single-library familiarity story (e.g. Preact borrowing React's corpus wholesale) — **structurally diffuse**: the "familiarity" is spread across a dozen competing tutorials and three overlapping spec generations rather than concentrated in one current, canonical source.

### Evidence: Stability / convention durability
Cited from `next_release` (frontmatter): **Scoped Custom Element Registries** — shipped in Chrome/Edge 146 (~March 2026; `https://developer.chrome.com/blog/scoped-registries`, `https://chromestatus.com/feature/5090435261792256`), with Safari already shipping and Gecko signaling positive intent. This lets a shadow root attach its own `CustomElementRegistry` (`attachShadow({ customElementRegistry })`), so independently-authored components can both define `<my-button>` without colliding in the single global registry that has, until now, been one of the most-cited structural weaknesses of composing native Web Components from multiple sources.

Categorized: this is **purely additive and convention-strengthening** — it doesn't change any existing API, doesn't deprecate any pattern documented above, and directly *narrows* one of the gaps this review documents between "native" and "wrapper-library" composition stories (Lit/Stencil have offered scoped-registry-equivalent ergonomics via their own build tooling for years; the platform is catching up). `next_release.stability_penalty: false` — there is no breaking change here, only a long-awaited capability addition that makes an existing pattern (composing third-party custom elements) materially safer. Separately, **Declarative Shadow DOM** (the other major recent platform addition, standardized with the `shadowrootmode` rename in 2023 and broadly shipped since Chrome 124 / ~2024) has already moved from "proposal" to "stable, documented, used in production" — meaning the platform's last two major additions both landed cleanly, on schedule, without retroactively invalidating prior-art code. This is a genuinely strong stability signal for a "framework" whose changes go through multi-vendor browser standardization rather than a single maintainer's roadmap.

### Evidence: Ecosystem tooling facts
- **DevTools**: partial — Chrome/Firefox/Edge DevTools' Elements panel renders custom-element tags natively and can show shadow roots (toggle "Show user agent shadow DOM" in Settings; `https://devtoolstips.org/tips/en/inspect-user-agent-dom/`), and `Element.getHTML()` lets you serialize a shadow tree's current state for inspection/caching. **There is no custom-element-aware state inspector, no component tree, no props/attributes diff view** — you're working with the generic DOM inspector, not a framework-shaped devtools extension (contrast Preact DevTools, React DevTools, Lit's Vue/React-interop tooling).
- **Test utilities**: yes, via the **Open Web Components** project's `@open-wc/testing` (`https://open-wc.org/docs/testing/testing-package/`) — a community-maintained (not platform-shipped) opinionated bundle wrapping `@web/test-runner`, Chai DOM/a11y plugins, and a `fixture()` helper for mounting custom elements in tests; also documented at `https://open-wc.org/guides/developing-components/testing/`. This is the closest thing to a "canonical" test setup, but it is explicitly community infrastructure layered atop the platform, not something `customElements` ships with.
- **IDE/LSP support**: native TypeScript (`lib.dom.d.ts`) gives full `HTMLElement`/`ShadowRoot`/`CustomEvent` intellisense out of the box in any TS-aware editor — no platform-specific LSP exists or is needed, though (per Type-system evidence) the custom-event-typing seam means an agent gets *less* signal here than with a wrapper library that auto-generates `HTMLElementEventMap` augmentations.
- **Build tooling**: none required — Custom Elements, Shadow DOM, `<template>`, and ES Modules all run directly in evergreen browsers with zero compilation. This "zero build step" property is itself a durable, checkable fact (the canonical reference is a single static HTML file, served as-is) and a meaningful tooling-simplicity advantage over every wrapper-library or framework alternative reviewed in this corpus.

## On the Horizon

### Next release
- **Name/version:** Scoped Custom Element Registries
- **Status:** announced (shipped in Chrome/Edge 146 ~March 2026; Safari shipped; Gecko positive)
- **What's changing:** `attachShadow({ customElementRegistry })` lets a shadow root use its own element registry instead of the single global `customElements` registry, eliminating name-collision risk when composing components from multiple independent sources.
- **Anticipated impact:** Closes one of the most durable, most-cited structural gaps between native Web Components and wrapper libraries (Lit/Stencil have offered build-time equivalents for years). Strengthens the Convention-strength and Stability evidence above — composing third-party elements becomes materially safer with no migration cost to existing code.
- **Stability penalty:** No — purely additive; nothing existing changes or breaks (see Stability evidence).

### AI-tooling investment
- **What exists:** Nothing platform-specific. No official MCP server (the platform has no single maintaining org to publish one), no Boost-style curated guidelines package, no `llms.txt` (MDN — the closest thing to canonical docs — does not publish one), no AI-specific style guide. The closest analogues are general-purpose documentation resources: MDN's Web Components docs/examples repo (`https://github.com/mdn/web-components-examples`) and the community-run `https://webcomponents.guide`.
- **Observed delta:** see `ai_tooling.observed_delta` in frontmatter for the full run — summary: there is no AI-tooling delta to measure, because there is no AI-specific tooling. The closest comparable experiment (loading MDN's "Using custom elements" guide into context vs. not) produced a modest, ordinary "better docs in context yield more idiomatic code" effect — one fewer correction round-trip on the `connectedCallback` re-invocation footgun — but that's a generic documentation effect, not an investment-specific one. **This absence is itself the finding**: a platform with no single maintaining vendor structurally cannot produce first-party AI tooling the way React (Meta), Vue (the Vue team), or Svelte (Vercel-adjacent) can — any future investment here would have to come from a browser vendor (Chrome DevRel, MDN/Mozilla) or a community project, and none currently exists.

---

## Anti-Patterns from Human-Era Thinking

- **Global, define-once component registry** (`customElements.define`). Designed for a world where "the page" is one coherent unit under one author's control — actively hostile to composing components from independent sources (the exact problem Scoped Custom Element Registries exists to fix, three-plus years after Custom Elements v1 shipped without it). A next-gen framework should treat "two unrelated libraries both want to call their button `app-button`" as a day-one design constraint, not a years-later patch.
- **String-only attribute reflection.** Forcing every non-string prop through manual `getAttribute`/`setAttribute`/JSON-stringify ceremony — or abandoning the "it's just HTML" illusion entirely the moment data gets structured — is a direct artifact of HTML attributes predating the idea of typed component props by decades. A next-gen framework's component boundary shouldn't force a choice between "stringly-typed" and "not really HTML anymore."
- **Lifecycle hooks that fire unpredictably** (`connectedCallback` "can be called more than once," requiring every author to hand-roll the same idempotency guard). A platform-level guarantee ("setup runs exactly once per element instance") would have eliminated an entire, still-actively-taught category of footgun.
- **No canonical data-fetching story** (Convention-strength evidence: four live, competing idioms for "fetch on mount"). Every wrapper library that has succeeded in this space succeeded partly *by* picking one answer and documenting it loudly — a lesson about the cost of "flexible" platform primitives without an accompanying "and here's the one true way" layer.

## Transferable Patterns for Next-Gen Framework

- **The DOM-as-model idiom** (canonical reference's central thesis: state lives in elements/attributes, not in a parallel JS object that must be kept in sync) is a genuinely under-explored design space outside the Web Components world — it sidesteps an entire category of state/view desync bugs by construction, at the cost of being unfamiliar to agents trained on framework-shaped (state-then-render) code. Worth deliberately exploring as a first-class design option, not dismissing as a curiosity.
- **Lifecycle hooks as a *named, spec'd contract*** (`connectedCallback`/`attributeChangedCallback`) — even with their footguns — are a genuinely good idea: one documented hop between "thing changed" and "your code runs," greppable, steppable, with a stable name a model can be trained on once and reuse forever. The lesson isn't "don't have lifecycle hooks," it's "make them fire exactly once, predictably, and say so loudly in the one place everyone reads."
- **Encapsulation via Shadow DOM's `:host`/`::slotted()`/`composed` model** — a real, standards-based answer to "how do styles and events cross a component boundary" that a next-gen framework could adopt wholesale rather than reinvent (and inherit the platform's multi-decade stability guarantee for free).
- **Zero-build-step deployability** — the canonical reference is one static HTML file. A next-gen framework that can degrade gracefully to "just works, no compiler, no bundler, paste it in a script tag" for the simple cases — while still offering richer tooling for complex ones — captures something genuinely valuable that most modern frameworks have abandoned entirely.
