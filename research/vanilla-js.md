---
name: "Vanilla JS"
category: "no-framework"
github_url: null
docs_url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
implementation_language: "JavaScript"
status: "active"
type_system_score: 2
compiler_feedback_score: 3
locality_score: 4
explicitness_score: 8.5
convention_strength_score: 1
token_efficiency_score: 4
familiarity_score: 10
stability_score: 9
tooling_score: 6
version: "ES2025"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No framework-specific AI tooling exists for vanilla JS by definition — it is the platform. The canonical exercise (TodoMVC add+toggle+count) was attempted twice: once with no extra context and once pointing the agent at https://developer.mozilla.org/en-US/docs/Web/JavaScript as a documentation reference. Without extra context the model produced working but idiosyncratic code (mixed innerHTML for initial render and textContent for incremental updates, ad-hoc event delegation). With MDN pointed at explicitly, no substantive difference was observed — the model's training already saturates MDN-level vanilla JS knowledge. The friction was not knowledge gaps; it was the absence of conventions forcing the agent to invent structure. No AI-tooling investment exists or would be coherent for 'vanilla JS' as a category: MDN itself does not publish llms.txt."
next_release:
  name: "ES2026"
  status: "announced"
  changes: "Temporal API (Stage 4 March 2026), Intl era/monthCode, and several other proposals secured for the ECMAScript 2026 specification. ES2025 (June 2025) added Iterator helpers, Promise.try, Set methods, Float16Array, JSON modules, RegExp.escape. Neither spec upgrade changes the DOM API surface or the rendering/event-handling patterns this review scores. ES2025 is the current ratified standard; ES2026 specification text is in draft at tc39.es/ecma262/2026/."
  anticipated_impact: "No rubric impact. New language features (Temporal, iterator helpers) improve developer ergonomics but do not change the locality, explicitness, convention-strength, or token-efficiency characteristics that define the vanilla-JS baseline. No breaking changes to existing DOM APIs anticipated — the web platform's backwards-compatibility guarantee is absolute."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
typescript_support: "none"
license: "N/A"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "imperative"
state_model: "mutable"
rendering_strategy: "direct-dom"
maintainer: "W3C/WHATWG/TC39"
first_released: "1995"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "This is a from-scratch rewrite of the prior review (null scores, old per-capability structure). Vanilla JS is not a versioned framework: 'version' tracks the current ECMAScript spec year (ES2025 ratified June 2025; ES2026 in draft). github_url is null because there is no single repo — the specification lives at tc39.es/ecma262 and the DOM at whatwg.org. Token efficiency evidence uses the canonical 1Marc/modern-todomvc-vanillajs reference (github.com/1Marc/modern-todomvc-vanillajs), which is maintained, widely cited, and builds to the same TodoMVC spec as every other framework's canonical reference."
---

# Vanilla JS

Vanilla JS is the baseline: plain browser APIs (`document.querySelector`, `addEventListener`, `innerHTML`/`textContent`, `fetch`, `localStorage`) with no framework layer. Every framework in this corpus is ultimately a layer on top of these APIs. Scoring it here establishes the floor against which every other entry is measured.

The "version" concept does not apply the same way as for a versioned library. The entry tracks the current ECMAScript specification year (ES2025, ratified June 2025 by the 129th Ecma General Assembly) and the current Living Standard DOM APIs maintained by WHATWG.

## State Management

### Philosophy & Mental Model

There is no built-in state philosophy. State is whatever variables the developer declares. Changing a variable does not update the UI; the developer is responsible for calling DOM methods to reflect every state change. This is the manual-everything baseline that every reactive framework exists to automate.

The two organizing approaches that emerge in practice are:

- **Flat variables + manual render calls**: Simple for small features, brittle at scale.
- **Module-scoped singleton with `EventTarget` pub/sub**: The modern idiomatic pattern for non-trivial vanilla apps — see `1Marc/modern-todomvc-vanillajs` (github.com/1Marc/modern-todomvc-vanillajs).

### Core Primitives

- **`let`/`const`/`var`** — primitive state; no automatic tracking.
- **Plain objects and arrays** — grouped mutable state; no reactivity.
- **`EventTarget` subclass** — the closest the platform offers to a reactive store: call `dispatchEvent(new CustomEvent('save'))` after every mutation, listeners re-render.
- **`localStorage` / `sessionStorage`** — persistence layer, not a reactive primitive.
- **`Proxy`** — enables DIY reactive wrappers, but writing one correctly is non-trivial and the result is not standardized.

### Update Mechanism

Manual. After every mutation the developer must explicitly update every DOM node that displays the changed value. Forgetting any node leaves the UI silently stale. The canonical modern pattern (from the reference TodoMVC) uses `EventTarget`:

```js
// store.js — TodoStore extends EventTarget
add({ title }) {
  this.todos.push({ title, completed: false, id: "id_" + Date.now() });
  this._save(); // calls dispatchEvent(new CustomEvent('save'))
}

// app.js
Todos.addEventListener("save", App.render);
```

`App.render()` rebuilds the entire list on each `save` event — coarse-grained but correct and simple.

### Derived State

Manual computation every time, or inline getters:

```js
this.all = (filter) =>
  filter === "active"   ? this.todos.filter(t => !t.completed)
  : filter === "completed" ? this.todos.filter(t => t.completed)
  : this.todos;
```

No memoization unless the developer implements it. No dependency tracking.

## Rendering

### Philosophy & Approach

Imperative direct-DOM manipulation. There is no virtual DOM, no compiler, no diffing algorithm — the developer calls DOM methods directly. Two broad strategies:

1. **Surgical updates** — `element.textContent = value`: fastest, but requires tracking every node.
2. **Full re-render via `replaceChildren`** — blows away the list and rebuilds from scratch on every change; simple but loses input focus/scroll position unless saved and restored manually.

The canonical reference uses strategy 2 with manual focus preservation:

```js
render() {
  App.saveFocus();
  App.$.list.replaceChildren(
    ...Todos.all(App.filter).map(todo => App.createTodoItem(todo))
  );
  App.restoreFocus();
  App.$.displayCount(Todos.all("active").length);
}
```

### Component Model

There is no component model. The common patterns are:

- **Factory functions** — `createTodoItem(todo)` returns a DOM node; no lifecycle, no props protocol.
- **Plain objects with methods** — `App = { $: { ...refs }, init(), render(), ... }`.
- **Web Components / `customElements.define`** — the platform's own component primitive; encapsulates shadow DOM and provides lifecycle callbacks, but adds ceremony and lacks reactive state.

## Event Handling

### Philosophy & Approach

Standard DOM events with `addEventListener`. No synthetic event system. Event delegation is an explicit pattern — the developer decides where to delegate.

```js
todoEvent(event, selector, handler) {
  delegate(App.$.list, selector, event, (e) => {
    let $el = e.target.closest("[data-id]");
    handler(Todos.get($el.dataset.id), $el, e);
  });
}
```

The `delegate` helper in the reference implementation is 4 lines and covers the common case.

### Memory Management

`addEventListener` requires matching `removeEventListener` with the same function reference to clean up. `AbortController` is the modern solution for bulk cleanup:

```js
const controller = new AbortController();
button.addEventListener("click", handler, { signal: controller.signal });
form.addEventListener("submit", handler2, { signal: controller.signal });
controller.abort(); // removes both
```

Without discipline, abandoned listeners cause memory leaks.

---

## Rubric Evidence

### Evidence: Type-system integration

**Categorical fact: `none` (for pure JS) / `community-types` (for TS-over-vanilla).**

Vanilla JS has no type system. The two practical paths are:

**Path A — pure JavaScript, no types.** Zero type safety. Typos in property names, passing wrong argument types, calling non-existent methods — all silent until runtime. This is the `typescript_support: "none"` reality for a pure vanilla JS project.

**Path B — TypeScript with `// @ts-check` + JSDoc, or full `.ts` files with `tsc --noEmit`.** The TypeScript compiler can type-check plain `.js` files when `allowJs: true` and `checkJs: true` are set in `tsconfig.json`. This gives you the `tsserver`/`typescript-language-server` error experience without committing to TypeScript syntax. The DOM types (`lib.dom.d.ts`) that ship with TypeScript are maintained by Microsoft and cover the browser API surface comprehensively.

A deliberate type error using JSDoc annotations:

```js
// @ts-check

/**
 * @param {HTMLInputElement} input
 * @returns {string}
 */
function getValue(input) {
  return input.valueAsNumber; // ← returns number, declared return type is string
}
```

Error from `tsc --noEmit`:

```
error TS2322: Type 'number' is not assignable to type 'string'.
```

The error is accurate and actionable. The limitation is that these annotations must be added manually — vanilla JS ships no types with it. DOM types come from TypeScript's bundled `lib.dom.d.ts`; they are not a separate `@types/` package but are community-maintained in the TypeScript repo rather than by the TC39/WHATWG standardization bodies.

**Score rationale: 2.0.** Pure vanilla JS has no type system at all (floor case). The TS-over-vanilla path achieves reasonable coverage but requires the developer to opt in explicitly (no types by default, no enforcement, no build step required but recommended). The `typescript_support` field is set to `none` because vanilla JS ships no types — the TS path is an externally applied layer, not a feature of vanilla JS itself. Score 2 rather than 0 reflects that the opt-in path is real and practically accessible without changing language.

**No documentation friction** locating the `checkJs`/`allowJs` tsconfig pattern — TypeScript's own docs cover it at `typescriptlang.org/docs/handbook/type-checking-javascript-files.html`.

### Evidence: Compiler/build feedback quality

**There is no compiler for vanilla JS.** There is no build step. The developer's feedback loop is:

1. **Browser DevTools console** — runtime errors after the fact.
2. **`tsc --noEmit`** (opt-in) — static feedback before runtime, but only if the project has TypeScript configured.
3. **ESLint** — linting for code quality, not type errors.

**Deliberately-broken runtime example** — a common vanilla JS mistake, calling a method on a possibly-null element:

```js
// No null check:
document.getElementById('nonexistent').textContent = 'Hello';
```

**Browser DevTools console output (Chrome/Firefox):**

```
Uncaught TypeError: Cannot set properties of null (setting 'textContent')
    at app.js:3
```

The error identifies the file and line. It does not tell you *why* the element is null (selector typo? not-yet-mounted? wrong ID?). You must trace that yourself.

**Same mistake with `tsc --noEmit` and `strictNullChecks: true`:**

```
error TS18047: 'document.getElementById('nonexistent')' is possibly 'null'.
```

TypeScript catches this before runtime, and the message is actionable. But this only applies if the project has opted into TypeScript tooling.

**Assessment:** Without TypeScript, the feedback loop is entirely runtime, in the browser console, after the code has already executed. The browser error messages are accurate but post-hoc — there is no pre-execution feedback pass. With TypeScript (`tsc --noEmit`), the story improves substantially, but the opt-in gap is large: most vanilla JS projects don't use TypeScript. A project with zero build tooling has zero pre-runtime type or pattern checking.

**Score rationale: 3.0.** The floor (no tooling at all) scores a 1–2. The TS-over-vanilla path is real and useful, enough to push to 3. It can't score higher because the opt-in gap is large, the baseline experience is entirely post-hoc runtime errors, and there is no framework-level compile step that could catch framework-usage mistakes (because there is no framework).

### Evidence: Locality of behavior

**Traced feature: "add a todo, see it appear in the list and the active count update in the footer."** Using the canonical `1Marc/modern-todomvc-vanillajs` reference (github.com/1Marc/modern-todomvc-vanillajs, accessed 2026-06-09).

Touchpoints required to understand or change this feature end to end:

1. `index.html` (69 lines) — `<template>` for the markup structure; `data-todo` attribute convention for DOM targeting.
2. `js/app.js` (140 lines) — `App.$.input` keyup listener calls `Todos.add(...)`, then `App.render()` is triggered via the `save` event.
3. `js/store.js` (71 lines) — `add({ title })` mutates `this.todos`, calls `this._save()` which dispatches the `save` event.
4. `js/helpers.js` (13 lines) — `insertHTML`, `replaceHTML`, `delegate` utilities used in `createTodoItem` and rendering.

**Count: 4 files** — but the distribution is unusual compared to framework equivalents. There is no router file, no reducer file, no constants file, no separate component file. The entire application architecture is in these 4 files, with the largest being `app.js` at 140 lines covering both the "store connection" and "render logic" responsibilities that frameworks typically split.

**The locality paradox for vanilla JS:** Feature locality looks good (4 files) because there are no framework-mandated abstractions requiring additional files. But within each file, concerns are not separated by convention: `app.js` contains DOM querying, event binding, render logic, and focus management all interleaved. A developer changing the "active count display" must read 140 lines of app.js to find the relevant section. There's no "`footer.jsx` is responsible for the count" signal — the developer must know where to look.

**Score rationale: 4.0.** Low file count inflates apparent locality. The absence of enforced separation means each file is a large multi-concern blob, and tracing a feature within a file requires reading more prose than a framework equivalent where the file has a single declared responsibility. Score reflects: better than heavily-layered frameworks (fewer files), worse than component-based frameworks (no per-concern file boundaries within app.js).

### Evidence: Explicitness / data-flow traceability

**Traced: clicking "toggle all" checkbox from event to DOM update**, using the canonical `1Marc/modern-todomvc-vanillajs`.

**Hops:**

1. `App.$.toggleAll.addEventListener("click", ...)` in `app.js` — explicit `addEventListener` binding. **Explicit.**
2. Inside the handler: `Todos.toggleAll()` — explicit function call. **Explicit.**
3. `toggleAll()` in `store.js` sets `this.todos = this.todos.map(...)`, then calls `this._save()`. **Explicit.**
4. `_save()` calls `window.localStorage.setItem(...)` then `this.dispatchEvent(new CustomEvent("save"))`. **Explicit.**
5. `Todos.addEventListener("save", App.render)` was registered in `App.init()` — the `save` event dispatches and invokes `App.render`. This is the **one semi-implicit hop**: the event dispatch routes through the EventTarget listener table. It is not magic — `addEventListener` is standard and the connection is in the same `init()` function — but it's a non-local jump a reader must trace back to `init()` to understand.
6. `App.render()` calls `App.$.list.replaceChildren(...)`, rebuilding the list, then `App.$.displayCount(...)`. **Explicit.**

**Tally: 5 explicit hops, 1 semi-implicit hop (CustomEvent dispatch → listener invocation).** The total hop count (6) is low and every hop is a direct function call or a standard DOM API — there is no framework scheduler, no reactive graph traversal, no virtual DOM diffing between trigger and render. The developer can read every line of the call chain without consulting framework internals.

**Contrast:** Frameworks with signals or reactive stores add one implicit "dependency graph walk" hop between state write and DOM update. React's `dispatch` → `reconciler` → re-render is two implicit hops. Vanilla JS has fewer implicit hops than any framework — but only because the developer wrote the explicit hops themselves.

**Score rationale: 8.5.** Explicitness is vanilla JS's defining strength. Everything is a function call or a DOM API. The one semi-implicit hop (EventTarget listener dispatch) is minimal and standard. Score does not reach 9–10 only because the EventTarget pattern requires the reader to know where listeners were registered (which may be in a different function, requiring cross-file search), and because the lack of conventions means some vanilla codebases use much more implicit patterns (global mutation, inline `innerHTML` with interpolated callbacks) that score lower on this dimension.

### Evidence: Convention strength

**Canonical task probed: "fetch data and display a list when the page loads."** Surveyed MDN, popular vanilla JS tutorials, the 2025 Stack Overflow top JavaScript answers, and the broader ecosystem to count distinct idiomatic-looking approaches in active use.

1. **`fetch` + `.then()` chain, set `innerHTML` on resolve** — the oldest idiom; still present in the majority of MDN examples and Stack Overflow answers. Mixes template strings into innerHTML (XSS risk).
2. **`async function init()` + `await fetch()` + `document.createElement` loop** — modern async/await; avoids innerHTML; verbose but safer; no shared convention on how to structure `init`.
3. **`async function init()` + `await fetch()` + template literal set via `innerHTML` with a `DOMParser` or `template` element for sanitization** — a hybrid pattern; documented by some security-focused guides but not by others.
4. **Module-scoped singleton store + `EventTarget` + `render()` function** — the pattern exemplified by `1Marc/modern-todomvc-vanillajs`; clearly the best-practice modern idiom, but not documented in any official guide (MDN has no "recommended app structure").
5. **Global variables + `DOMContentLoaded` + procedural script** — still common in educational contexts and simple pages; no module system; completely valid.
6. **`XMLHttpRequest`** — deprecated in new code but common in legacy codebases and still in many tutorials and SO answers because the questions are from 2012–2018.
7. **Web Component with `connectedCallback` + `fetch`** — standards-based encapsulation for a data-fetching component; a seventh distinct idiom for component-oriented vanilla JS.

**Count: at least 6–7 distinct, actively-circulating, idiomatic-looking approaches.** Unlike React (where low convention strength reflects a framework philosophy of "UI library, not opinionated about everything"), vanilla JS has low convention strength because there is no framework at all — every pattern is equally "official." MDN documents browser APIs, not application architecture. There is no styleguide, no "idiomatic vanilla JS" document analogous to Vue's style guide or React's Thinking in React.

**Documentation friction note:** Locating a single authoritative source for "the right way to structure a vanilla JS app" was impossible — because no such source exists. MDN provides API references; the closest thing to an architectural recommendation is the TodoMVC reference implementation, which is maintained by one person and is not an official standard. This absence is itself the evidence for the score.

**Score rationale: 1.0.** The lowest possible score is appropriate for a "no-framework" baseline. There are no enforced conventions, no official styleguide, no framework CLI that scaffolds a canonical structure. Every project invents its own patterns. An agent generating vanilla JS has no canonical signal to prefer one approach over another.

### Evidence: Token efficiency / boilerplate density

**Source: canonical reference implementation — `1Marc/modern-todomvc-vanillajs`, `github.com/1Marc/modern-todomvc-vanillajs` (accessed 2026-06-09).** This is the most widely-cited modern vanilla JS TodoMVC implementation; the author wrote it explicitly to demonstrate how little code a modern vanilla JS app requires compared to the 2016 official TodoMVC vanilla-es6 example. It targets the identical TodoMVC spec used by all other framework references in this corpus. Taking the TodoMVC-first path per the protocol: this is a vetted, publicly maintained reference, not a freehand attempt.

Note on the official `tastejs/todomvc` vanilla examples: the repo also contains `examples/javascript-es5` and `examples/javascript-es6`, but both use webpack and older patterns. The `1Marc/modern-todomvc-vanillajs` example is the more representative modern reference (no build tools, current browser APIs, module syntax).

Line counts:

| File | Lines | Role |
|---|---|---|
| `js/app.js` | 140 | All UI logic: DOM refs, event binding, render, focus save/restore |
| `js/store.js` | 71 | State store: CRUD mutations, localStorage persistence, EventTarget pub/sub |
| `js/helpers.js` | 13 | Utilities: `delegate`, `insertHTML`, `replaceHTML`, `getURLHash` |
| `index.html` | 69 | Markup: form, list, footer, filter links |
| **Total** | **293** | |

**Observations:**

- 293 lines for the full TodoMVC spec (add, toggle, edit in place, delete, toggle all, filter, clear completed, active count, localStorage persistence).
- This is notably lower than the React canonical reference (312 lines) and achieves the same spec. The vanilla advantage: no component files, no constant files, no reducer — everything is in 3 JS files.
- The efficiency comes with a cost: `app.js` is a 140-line multi-concern module. React's 312 lines are split across 8 files with single-responsibility boundaries. The vanilla implementation is token-efficient but locality-poor within each file.
- **Boilerplate nature differs:** vanilla's lines are mostly *logic* (event handlers, DOM queries, conditional rendering decisions). React's overhead is structural (imports, component function wrappers, hook call syntax, prop destructuring). Vanilla has less structural overhead but requires writing explicit DOM manipulation that frameworks handle implicitly.
- **Full re-render on every change** — `App.render()` rebuilds the entire list via `replaceChildren` on every state mutation. This is simple but means 293 lines handle no incremental reconciliation; a production app requiring stable focus, animations, or large lists would need significantly more code.

**Score rationale: 4.0.** Raw line count is competitive with React for a simple app, but token efficiency for the general case is low because every feature requires explicit DOM manipulation code that frameworks generate automatically. Adding a new feature (e.g., due dates) would require writing DOM creation + event binding + render updates + store mutations — all manually. In a framework, the new feature is mostly the new state and a template update. Score 4 rather than 3: vanilla JS is not as verbose as it is often caricatured for simple apps; the 293-line reference is real. Score does not reach 5: the manual-DOM overhead grows superlinearly with feature complexity, and the absence of a component model means each new UI element costs the same verbosity as the first.

### Evidence: Familiarity composite

**Four proxies:**

1. **Age-weighted community volume.** JavaScript was first released in 1995 (31 years ago); it is the most-discussed topic on Stack Overflow by total question count — over 2.5 million questions tagged `javascript` as of 2025-2026. The 2025 Stack Overflow Developer Survey reports JavaScript as the most-used programming language at 66% of respondents (13th consecutive year). This is the deepest pretraining corpus of any technology in this review set, by a wide margin.

2. **GitHub activity.** There is no single GitHub repo for vanilla JS (the spec lives at github.com/tc39/ecma262 and github.com/whatwg/html). The proxy here is the sum of activity across all vanilla-JS-reliant projects — which is the entire web platform. Structurally, this is a maximum-signal data point: AI models were trained on vastly more vanilla JS than any framework, because every framework tutorial, example, and SO answer contains vanilla JS alongside the framework code.

3. **Registry trend direction.** `npm_package: null` — there is no npm package. This is a structural undercount that should be called out: the entire npm ecosystem is built on top of vanilla JS, so every npm download implicitly signals vanilla JS usage. The direction is strongly positive and the signal is everywhere.

4. **`first_released`: 1995.** The oldest technology in this corpus by over a decade. Age-weighting strongly favors vanilla JS for pretraining coverage: 31 years of documentation, tutorials, blog posts, Stack Overflow Q&A, and example code.

**Triangulation:** All four proxies point at the same ceiling. JavaScript is universally familiar to AI models — it is the language all four major browser engines implement, the language nearly all web tutorials start from, and the language underlying every JavaScript framework the model has ever seen. There is no plausible scenario in which a frontier model knows React idioms but not vanilla JS. The familiarity ceiling is unambiguously 10.

**Score rationale: 10.0.** The maximum score. No other technology in this corpus has broader or deeper pretraining coverage.

**No documentation friction** — finding usage statistics was straightforward via Stack Overflow's developer survey and tag pages.

### Evidence: Stability / convention durability

**ECMAScript evolves slowly and carefully.** The TC39 process requires Stage 4 (two independent implementations in browsers, test262 test suite, specification text complete) before inclusion in the annual spec. Breaking changes are essentially impossible — the web's backwards-compatibility guarantee means existing JavaScript code written in 1995 still runs in today's browsers.

**DOM/Web APIs are even more stable.** WHATWG's Living Standard approach makes additive-only changes; APIs are never removed from browsers once shipped to avoid breaking existing pages. `addEventListener`, `querySelector`, `fetch`, `localStorage` — all present and unchanged for the duration of any project's lifetime.

**ES2025 changelog (June 2025):** Iterator helpers, `Promise.try`, new Set methods (`intersection`, `union`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, `isDisjointFrom`), `Float16Array`, JSON modules, `RegExp.escape`. All additive. Zero breaking changes.

**ES2026 draft status (next_release):** Temporal API (Stage 4 since March 2026), Intl era/monthCode. Still additive. No breaking changes.

**Citation:** tc39.es/ecma262/2026/multipage/ (ES2026 draft), 262.ecma-international.org/ (ES2025 final).

**Stability penalty:** None (`stability_penalty: false`). The ES2026 additions are improvements, not deprecations or breaking changes. This contrasts sharply with framework entries where a major version bump or architecture change triggers a stability penalty.

**Score rationale: 9.0.** Vanilla JS scores as high as any technology in this corpus for stability. The one deduction from 10: the *convention landscape* for vanilla JS is unstable not because the platform breaks, but because there are no conventions to stabilize. The "right way" to structure a vanilla JS app in 2020 was different from 2016, and different again in 2025. The platform APIs are stable; the ecosystem's practices around them are not. Score 9 rather than 10 reflects this gap between platform stability (perfect) and convention durability (low, because conventions don't exist in the first place).

### Evidence: Ecosystem tooling facts

**Devtools:**
- [x] Browser DevTools (Chrome, Firefox, Safari, Edge) — built-in, no installation required. Elements panel, console, network, performance profiler, memory profiler, sources debugger with sourcemap support. This is the best-in-class debugging experience for browser code: no framework plugin required, everything is directly inspectable.
- [ ] Framework-specific devtools — none, by definition.
- [ ] Component tree viewer — not applicable (no component model).
- [ ] State inspector — not applicable (no framework state management).

**Test utilities:**
- [x] `jsdom` (via Jest or standalone) — provides a DOM implementation for Node.js test environments. Widely used; actively maintained.
- [x] `@testing-library/dom` — framework-agnostic DOM testing utilities; works with vanilla JS.
- [x] Playwright / Cypress / Puppeteer — end-to-end testing tools that run against real browsers; fully compatible with vanilla JS (no framework adapter needed).
- [x] Web Test Runner (`@web/test-runner`) — runs tests in a real browser, no jsdom approximation needed; well-suited for vanilla JS Web Components.
- [ ] Component-level unit test utilities — not applicable (no component model).

**IDE/LSP support:**
- [x] `typescript-language-server` (github.com/typescript-language-server/typescript-language-server) — provides JS/TS language intelligence (autocomplete, hover types, go-to-definition, find-references) for vanilla JavaScript in VS Code, Neovim, Emacs, and any editor that implements LSP. Ships as the JS/TS backend in VS Code's built-in JS support.
- [x] VS Code built-in JavaScript language support — powered by `tsserver`; works on plain `.js` files without any `tsconfig.json` for basic intellisense.
- [x] ESLint — static analysis for code quality and common mistakes; widely configured for vanilla JS projects.
- [x] Prettier / Biome — code formatting; both work on plain JS with no configuration.

**What's missing compared to framework entries:**
- No framework-specific DevTools panel (no component inspector, no store viewer, no render timing tree).
- No HMR / hot module replacement without adding a build tool like Vite (which is optional and external to vanilla JS itself).
- No type-checked template syntax (JSX/SFC tooling); DOM manipulation errors only surface at runtime unless TypeScript is configured.

**Score rationale: 6.0.** Browser DevTools are genuinely excellent and available with zero setup — a real advantage. The TypeScript LSP path for type checking is accessible. Testing tools (Playwright, jest+jsdom) are first-class. The deductions from a higher score: no framework-specific devtools, no HMR by default, no component-level isolation testing utilities (because there's no component model), and the type-checking story requires opt-in setup that most vanilla JS projects don't do. Score 6 reflects "solid general platform tooling, no framework-layer tooling, opt-in type support."

---

## On the Horizon

### Next release

- **Name/version:** ES2026 (draft at tc39.es/ecma262/2026/multipage/)
- **Status:** announced
- **What's changing:** Temporal API (final — Stage 4 as of March 2026 TC39 meeting), Intl era/monthCode. ES2025 (the current ratified standard) added Iterator helpers, `Promise.try`, Set methods, `Float16Array`, JSON modules, and `RegExp.escape`. Neither ES2025 nor ES2026 touch the DOM API surface, event model, or state management patterns.
- **Anticipated impact:** Zero rubric impact. New language features improve ergonomics (Temporal is a long-overdue replacement for `Date`) but do not change the locality, explicitness, convention-strength, or token-efficiency evidence in this review. The scoring dimensions are about the DOM/event/state interaction patterns, which are governed by WHATWG Living Standards that evolve additive-only.
- **Stability penalty:** No — the backwards-compatibility guarantee of the web platform is absolute. See `next_release.stability_penalty: false` in frontmatter.

### AI-tooling investment

- **What exists:** None, by design. MDN Web Docs does not publish an `llms.txt`. There is no MCP server for "the browser platform." There are no curated AI-facing guidelines for vanilla JS as a category — MDN is the reference and it is comprehensive enough that AI models training on MDN content directly is the baseline.
- **Observed delta:** Tested the canonical TodoMVC exercise with and without MDN explicitly loaded as context. No measurable difference in code quality or idiom correctness — the model's pretraining already saturates MDN-level vanilla JS knowledge (consistent with the familiarity score of 10.0). The meaningful friction in the exercise was not knowledge gaps; it was the absence of conventions. The agent produced correct code in both conditions but invented different structures each time (different file layout, different event wiring approach) because there is no canonical signal to converge on. This is the real AI-tooling story for vanilla JS: the platform knowledge is there; the convention deficit means the agent must make arbitrary architectural choices, producing inconsistent output that is correct but not idiomatic to any shared standard.
