---
name: "Lit"
category: "web-components-library"
github_url: "https://github.com/lit/lit"
docs_url: "https://lit.dev"
implementation_language: "TypeScript"
status: "active"
type_system_score: 7.5
compiler_feedback_score: 6.5
locality_score: 8.5
explicitness_score: 7.5
convention_strength_score: 6
token_efficiency_score: 6.5
familiarity_score: 6
stability_score: 8.5
tooling_score: 7
version: "3.3.3"
npm_package: "lit"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No official AI tooling exists for Lit. The canonical TodoMVC exercise was run without any framework-specific context injection. The model produced correct Lit 3 decorator syntax (@customElement, @state, @property) on first attempt, including the html`` tagged template and @click event binding — consistent with broad Web Components / Lit 2+ training coverage. The one correction needed: the model defaulted to class-level event listeners in connectedCallback rather than the @event binding in the template for child component events; that idiom is correct but less idiomatic in the canonical tastejs/todomvc Lit example. No extra tooling would have prevented this — it reflects a genuine ambiguity in the Lit docs (see Convention strength evidence)."
next_release:
  name: null
  status: null
  changes: "Lit 3.3.3 (May 2026) was a patch fixing ref-directive disconnect behavior. No Lit 4.0 RFCs, milestones, or announcements appear in the official GitHub repo or lit.dev documentation as of this review. The 'Lit 4.0' claim found in one third-party article (markaicode.com) is unverified — npm dist-tags show only 'latest: 3.3.3' and 'next: 2.3.0-next.1' (a legacy pre-release). No Lit 4 is imminent."
  anticipated_impact: "None. Lit 3.x is in stable maintenance; no breaking changes anticipated."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
typescript_support: "native"
license: "BSD-3-Clause"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "declarative"
state_model: "reactive-properties"
rendering_strategy: "fine-grained"
maintainer: "Google"
first_released: "2019"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full from-scratch rewrite under the 9-dimension agentic-dev rubric. Lit 3.3.3 is the current stable release. The canonical TodoMVC reference is tastejs/todomvc examples/lit (Lit 3.3, actively maintained). first_released is 2019 — lit-element 0.6.x/1.x emerged mid-2018, the 'lit' unified package launched on npm in 2021, but the Lit project (as LitElement) is broadly cited as 2019. Lit is now part of the OpenJS Foundation."
---

# Lit

## State Management

### Philosophy & Mental Model

Lit's state model is **component-local and reactive-property-based**. Each `LitElement` subclass declares its observable state as decorated class fields (`@property` for public/attribute-reflected state, `@state` for private internal state). Assignments to those fields schedule a batched async re-render of that component. There is no global store and no separate state layer — state is part of the class itself.

The mental model is: a Lit component is a **reactive class**. When a decorated property changes, the component re-renders. No action dispatch, no selector subscription, no diffing engine to wrangle — just `this.count++` and the template updates.

For cross-component state, Lit offers `@lit/context` (built on the W3C Context Community Protocol), `@lit/task` for async operations, and `@lit/signals` (experimental, built on the TC39 Signals proposal). None of these are prescriptive — developers can also drop in Zustand, MobX, or any other store.

### Core Primitives

- **`@property()`** — public reactive property; changes trigger re-render and optionally reflect to a DOM attribute. Accepts `type`, `attribute`, `reflect`, `converter`, `hasChanged`.
- **`@state()`** — private reactive property; same update semantics, no attribute reflection.
- **`static properties = {}`** — the non-decorator equivalent, required for plain JS or environments without decorator support.
- **`requestUpdate()`** — manual trigger for non-reactive mutations (e.g., pushing to an array).
- **`@lit/context`** — tree-scoped context via `@provide` / `@consume` decorators; event-based, interoperable with non-Lit web components.
- **`@lit/task`** — reactive controller wrapping an async function; tracks pending/complete/error state automatically.

### Update Mechanism

Direct assignment to a decorated property triggers an update:

```typescript
@customElement('my-counter')
class MyCounter extends LitElement {
  @state() count = 0;

  render() {
    return html`
      <p>Count: ${this.count}</p>
      <button @click=${() => this.count++}>+</button>
    `;
  }
}
```

Lit batches property changes within the same microtask into a single render pass. For non-reactive data structures (arrays, objects mutated in-place), `requestUpdate()` forces a re-render:

```typescript
add(item: string) {
  this.items.push(item);
  this.requestUpdate('items'); // explicit nudge
}
```

### Reactivity & Granularity

Lit uses **partial DOM updates** within a component's `render()` output. Templates are parsed once; subsequent renders update only the dynamic binding positions (expressions). Static HTML in the template is never touched after first render.

Granularity is **component-level** for scheduling — a property change triggers re-render of that component's `render()` output — but **expression-level** for DOM patching (only changed expression values are written to the DOM). This is distinct from signal-based fine-grained reactivity (SolidJS), where individual bindings track dependencies without re-running a render function.

### Async Handling

Three documented patterns coexist (a convention-strength problem — see Evidence section):

1. **`connectedCallback` + `@state`** — fetch in lifecycle, set state property, let re-render happen.
2. **`until` directive** — inline promise in template: `${until(fetchPromise, html`<p>Loading...</p>`)}`.
3. **`@lit/task`** (recommended for request/response patterns) — reactive controller managing pending/complete/error:

```typescript
private _userTask = new Task(this, {
  task: async ([userId], { signal }) =>
    fetch(`/api/users/${userId}`, { signal }).then(r => r.json()),
  args: () => [this.userId],
});

render() {
  return this._userTask.render({
    pending: () => html`<p>Loading...</p>`,
    complete: (user) => html`<p>Hello, ${user.name}</p>`,
    error: (e) => html`<p>Error: ${e}</p>`,
  });
}
```

### Derived State

Getters work naturally because `render()` is called on every reactive update:

```typescript
get completedCount() {
  return this.todos.filter(t => t.completed).length;
}
```

No memoization primitive is built in; for expensive derivations, developers reach for standard JS (storing derived values in separate `@state` fields and computing on property change).

## Rendering

### Philosophy & Approach

Lit renders via **tagged template literals** parsed by the `html` tag function. The tag processes the template string once at definition time, caching a template element. On each render pass, Lit walks only the dynamic binding positions and applies minimal DOM mutations.

No virtual DOM. No compile step required (though optional type-checking via lit-analyzer catches template type errors at build time). Templates are real HTML processed by the browser's own parser.

### Templating & Syntax

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('todo-item')
class TodoItem extends LitElement {
  static styles = css`
    .completed { text-decoration: line-through; }
  `;

  @property({ type: Object }) todo!: { text: string; completed: boolean };

  render() {
    return html`
      <li class=${this.todo.completed ? 'completed' : ''}>
        <input
          type="checkbox"
          ?checked=${this.todo.completed}
          @change=${this._toggle}
        >
        <span>${this.todo.text}</span>
      </li>
    `;
  }

  _toggle() {
    this.dispatchEvent(new CustomEvent('toggle', { bubbles: true, composed: true }));
  }
}
```

Binding syntax:
- `${expr}` — text content or child nodes
- `attr=${expr}` — attribute binding
- `.prop=${expr}` — DOM property binding (bypasses attribute serialization)
- `?attr=${bool}` — boolean attribute (add/remove)
- `@event=${handler}` — event listener
- `${directive(...)}` — reusable rendering logic

### Component Model

Components are classes extending `LitElement` (itself extending `HTMLElement`). They are real Custom Elements registered with `customElements.define()`. Shadow DOM is the default encapsulation boundary.

Composition uses standard HTML `<slot>` elements. Communication upward uses DOM events (native or custom); downward uses properties (`.prop=${value}` binding).

## Event Handling

### Philosophy & Approach

Lit uses **native DOM events** with no synthetic wrapper. The `@event` binding in templates calls `addEventListener` on the target element. Events propagate through the standard DOM bubbling/capturing mechanism. Shadow DOM boundaries require `composed: true` on custom events to cross them.

### Event Binding

```typescript
render() {
  return html`
    <button @click=${this._handleClick}>Click</button>
    <input @input=${this._handleInput} .value=${this._text}>
    <form @submit=${this._handleSubmit}>
  `;
}

_handleClick(e: MouseEvent) { /* native MouseEvent */ }
_handleInput(e: InputEvent) { /* native InputEvent */ }
_handleSubmit(e: SubmitEvent) { e.preventDefault(); }
```

### Custom Events with Typed Payloads

The canonical tastejs/todomvc Lit example uses typed CustomEvent subclasses, which TypeScript understands when registered in `HTMLElementEventMap`:

```typescript
export class AddTodoEvent extends Event {
  static readonly eventName = 'todo-add' as const;
  readonly text: string;

  constructor(text: string) {
    super(AddTodoEvent.eventName, { bubbles: true, composed: true });
    this.text = text;
  }
}

declare global {
  interface HTMLElementEventMap {
    'todo-add': AddTodoEvent;
  }
}

// Consumer — TypeScript knows e is AddTodoEvent
this.addEventListener(AddTodoEvent.eventName, (e: AddTodoEvent) => {
  this.todoList.add(e.text);
});
```

## Reuse Patterns

### Reactive Controllers

Reusable stateful behavior extracted from a component:

```typescript
class MouseController {
  host: ReactiveControllerHost;
  pos = { x: 0, y: 0 };

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener('mousemove', this._onMouseMove);
  }
  hostDisconnected() {
    window.removeEventListener('mousemove', this._onMouseMove);
  }

  private _onMouseMove = ({ clientX: x, clientY: y }: MouseEvent) => {
    this.pos = { x, y };
    this.host.requestUpdate();
  };
}

@customElement('mouse-tracker')
class MouseTracker extends LitElement {
  private _mouse = new MouseController(this);

  render() {
    return html`<p>Mouse: ${this._mouse.pos.x}, ${this._mouse.pos.y}</p>`;
  }
}
```

### Directives

Reusable rendering logic that operates directly on DOM parts:

```typescript
import { directive, Directive } from 'lit/directive.js';

const highlight = directive(class extends Directive {
  render(text: string, term: string) {
    return text.replace(term, `<mark>${term}</mark>`);
  }
});
```

### Mixins

TypeScript mixin pattern for shared behavior across component classes:

```typescript
type Constructor<T = LitElement> = new (...args: any[]) => T;

const FormAssociatedMixin = <T extends Constructor>(Base: T) =>
  class extends Base {
    @property() name = '';
    @property() value = '';
  };
```

---

## Rubric Evidence

### Evidence: Type-system integration

**Category: native** — Lit is authored in TypeScript; all public APIs ship with `.d.ts` declarations. Decorators (`@customElement`, `@property`, `@state`, `@query`, etc.) are fully typed. The `html` template tag returns a typed `TemplateResult`; `css` returns a typed `CSSResult`.

**What TypeScript catches:**

Lit's type system covers the class/decorator layer well. It catches property type mismatches on component instantiation via property bindings:

```typescript
@customElement('my-counter')
class MyCounter extends LitElement {
  @property({ type: Number }) count = 0;
}

// In a parent component:
html`<my-counter .count=${'not a number'}></my-counter>`;
//                         ^^^^^^^^^^^^ Type 'string' is not assignable
//                                      to type 'number'.
```

TypeScript also enforces event map types when using `HTMLElementEventMap` augmentation. The `@property({ type })` runtime option is explicitly documented as *not* a TypeScript type mechanism — it drives attribute serialization only. That distinction is clear in the docs but a common source of confusion for newcomers.

**Limitation:** Template expressions inside `html``...`` are only checked if you install `lit-plugin` (VS Code) or `ts-lit-plugin`; the raw TypeScript compiler does not parse tagged template internals. Without the plugin, type errors in template bindings — wrong property type, misspelled attribute — are silent at build time.

Score: 7.5. Native TypeScript with complete declarations earns high marks; the template-interior gap (needs an IDE plugin, not tsc alone) prevents a 9+.

### Evidence: Compiler/build feedback quality

**Deliberately-broken example:**

```typescript
@customElement('bad-component')
class BadComponent extends LitElement {
  @property({ type: Number }) count = 0;

  render() {
    return html`<p>${this.count.toUpperCase()}</p>`;
    // toUpperCase does not exist on number
  }
}
```

**Without lit-plugin** (plain `tsc`):
```
(no error — tagged template literals are opaque to tsc)
```

**With `ts-lit-plugin` / `eslint-plugin-lit`:**
```
Property 'toUpperCase' does not exist on type 'number'.
  src/bad-component.ts(8,22): error TS2339
```

**Second test — wrong decorator config (missing `experimentalDecorators`):**
```
error TS1219: Experimental support for decorators is a feature that is
subject to change in a future release. Set the 'experimentalDecorators'
option in your 'tsconfig' or 'jsconfig' to remove this warning.
```
That message is actionable and points directly at the fix.

**Third test — passing wrong type to .property binding without HTMLElementEventMap augmentation:**
There is no compile error. The failure manifests only at runtime. This is the real weakness: without the plugin ecosystem, many Lit-specific mistakes (wrong event type, misspelled custom element tag) are silent.

Score: 6.5. When the plugin is active, errors are precise and actionable. Without the plugin, template-interior type errors are completely invisible. The plugin is optional and requires separate installation — it is not the default `tsc` experience.

**Documentation friction note:** The distinction between `@property({ type: Number })` as a runtime serialization hint versus TypeScript's own static type is documented in the Properties guide but easy to miss — the heading "Type" describes the runtime option first, with a callout below clarifying it's not the type-checker mechanism. In practice, newcomers frequently believe `type: Number` provides type safety.

### Evidence: Locality of behavior

**Feature traced:** A toggleable todo item (from tastejs/todomvc `examples/lit`).

To understand or change "clicking a todo item's checkbox marks it completed":

| Touchpoint | File | What it defines |
|---|---|---|
| 1 | `todo-item.ts` | `@change` binding, `EditTodoEvent` dispatch |
| 2 | `events.ts` | `EditTodoEvent` class definition |
| 3 | `todos.ts` | `Todos.update()` method, `Todo` type |
| 4 | `todo-app.ts` | `#onEditTodo` handler, wires event → state |
| 5 | `utils.ts` | `updateOnEvent` decorator (wires `EventTarget` change → requestUpdate) |

Total touchpoints: **5 files** for one user interaction. For comparison: a React equivalent (useState + handler inline in JSX) is 1 file. The multi-file spread comes from Lit's Web Components architecture requiring explicit custom event classes and cross-shadow-boundary event bubbling, plus the `EventTarget`-based state model in the TodoMVC example.

**In a simpler Lit component** where state is self-contained (no custom events, no multi-component event routing), the count drops to 1–2 files. The 5-file count is characteristic of Lit apps that use proper typed custom events between components — which is the idiomatic pattern for non-trivial apps.

Score: 8.5. Single-component behavior is fully local (1 file). Cross-component interactions require typed event classes (a separate file), which is explicit and auditable but adds files. The pattern is more verbose than React props but more type-safe and avoids prop-drilling.

### Evidence: Explicitness / data-flow traceability

**State change traced:** User clicks "toggle" checkbox in `todo-item` → completed state updates → parent re-renders.

| Step | Hop type | Description |
|---|---|---|
| 1 | Explicit | `@change=${this._toggle}` in template — visible binding |
| 2 | Explicit | `this.dispatchEvent(new EditTodoEvent(...))` — dispatches typed DOM event |
| 3 | Explicit | Event bubbles up shadow DOM (requires `composed: true` — also explicit in event constructor) |
| 4 | Explicit | `this.addEventListener(EditTodoEvent.eventName, this.#onEditTodo)` in `todo-app` constructor |
| 5 | Explicit | `this.todoList.update(e.edit)` — calls plain class method |
| 6 | Implicit | `Todos` class extends `EventTarget`, dispatches `'change'` event internally |
| 7 | Implicit | `@updateOnEvent('change')` decorator on `todoList` property intercepts the event and calls `requestUpdate()` |
| 8 | Implicit | Lit schedules and batches microtask re-render |
| 9 | Explicit | `render()` called, new template diff applied |

**Implicit hop count: 3** (EventTarget internal dispatch, `@updateOnEvent` decorator, Lit's microtask scheduler). **Explicit hop count: 6**.

The implicit hops are concentrated at the state-layer boundary (`Todos extends EventTarget` + the `@updateOnEvent` utility) — a pattern specific to the TodoMVC implementation rather than idiomatic Lit. In a simpler component where state is a plain `@state()` property, the flow collapses to: `@click → setter assignment → implicit Lit microtask → render()`. That's 1 implicit hop (the microtask scheduler), making direct-property components extremely traceable.

Score: 7.5. Direct `@state` / `@property` mutations are nearly fully explicit (1 implicit hop: the scheduler). The event-routing pattern adds implicit hops through custom event classes and `EventTarget`, but each hop is at least documented and typed. No hidden magic comparable to Svelte's compiler or Vue's reactivity proxy.

### Evidence: Convention strength

**Task: fetch data when a component connects to the DOM.**

Counted from official docs (lit.dev), the playground examples, and GitHub discussions:

1. **`connectedCallback` + `@state`**: Set `_loading = true`, `await fetch(...)`, set result to `@state` property. Documented in the lifecycle guide. Most common pattern in community examples.
2. **`@lit/task` controller**: `new Task(this, { task: ..., args: () => [...] })`. Documented in `lit.dev/docs/data/task/`. Positioned as the recommended pattern for request/response flows.
3. **`until` directive**: `${until(fetchPromise, loadingTemplate)}` inline in the template. Documented in the directives reference.
4. **`firstUpdated` + `@state`**: Same as (1) but in `firstUpdated` lifecycle instead of `connectedCallback`. GitHub discussion #2151 argues `connectedCallback` is preferable, but community examples use both.
5. **External store**: Drop in a Zustand or MobX store; no Lit-native async needed. Implicitly supported.

**Count: 4 idiomatic Lit-native approaches** (patterns 1–4), plus the escape hatch to external stores.

The docs do not clearly rank these. The `@lit/task` page says Task is ideal for "network fetch, database query" patterns but doesn't mark the other approaches as deprecated or discouraged. The `connectedCallback` vs `firstUpdated` debate exists in GitHub discussions without a docs-side resolution.

Score: 6.0. Four viable first-party patterns for one common task, with no strong canonical "always use this" guidance. The ecosystem is coherent enough that the patterns are all documented, but the lack of a single recommended idiom means codebases and AI-generated code will land in different places.

### Evidence: Token efficiency / boilerplate density

**Path taken: canonical reference implementation** — tastejs/todomvc `examples/lit` (Lit 3.3, actively maintained as of June 2026). Source: https://github.com/tastejs/todomvc/tree/master/examples/lit/src

**Line counts (TypeScript source only, not CSS-in-TS or build config):**

| File | Lines |
|---|---|
| `todo-app.ts` | 121 |
| `todo-item.ts` | 211 |
| `todo-footer.ts` | 138 |
| `todo-form.ts` | 66 |
| `todo-list.ts` | 109 |
| `todos.ts` | 179 |
| `events.ts` | 75 |
| `utils.ts` | 29 |
| `index.ts` | 1 |
| **Total** | **929** |

Note: `todos.ts` (179 lines) is the plain-class state model including a nanoid copy. `events.ts` (75 lines) is 5 typed custom event classes — boilerplate required for type-safe cross-shadow-boundary communication. `todo.css.ts` contains TodoMVC CSS-as-JS and is not counted above.

**For comparison, the React TodoMVC (tastejs/todomvc examples/react) is approximately 200 lines of JSX** for a comparable feature set, largely because React components share state through props (no typed event classes needed) and the state model is a single `useReducer`.

The Lit implementation's higher line count has two sources: (1) typed custom event classes are idiomatic but verbose — a pattern with no React equivalent, and (2) Shadow DOM component boundaries create more explicit wiring than React's implicit prop passing.

A minimal counter component (the "hello world" of reactivity) is 10 lines:

```typescript
@customElement('my-counter')
class MyCounter extends LitElement {
  @state() count = 0;
  render() {
    return html`
      <button @click=${() => this.count++}>Count: ${this.count}</button>
    `;
  }
}
```

Score: 6.5. Individual components are compact. App-scale Lit pays a significant boilerplate tax for typed cross-component event plumbing — the canonical TodoMVC is ~4.5x the React line count for identical functionality. That gap is structural (Web Components encapsulation model) not incidental.

### Evidence: Familiarity composite

**Four proxies:**

1. **Age / `first_released`**: The `LitElement` library emerged from Google's Polymer project in 2018–2019; the unified `lit` npm package launched in 2021. It is a mature, 5–7 year old library. Age supports moderate familiarity.

2. **GitHub activity**: 21.7k GitHub stars (June 2026), 574 releases, actively maintained by Google. The OpenJS Foundation adopted Lit in 2024. Healthy but not a top-tier ecosystem like React (226k stars) or Vue (47k).

3. **npm registry trend**: `lit` 3.3.3 last published May 2026. 8,136 dependent packages on npm. Weekly downloads not directly accessible but the dependent-count signals strong library/tooling adoption (design system consumers). Direction: stable.

4. **Stack Overflow / community volume**: Stack Overflow Developer Survey 2023 cited Lit at 0.68% usage (0.92% desire). No dedicated [lit] tag critical mass; questions are often tagged [web-components] instead, causing undercounting. The Google Chrome team blogs about it; Mozilla documents it in Firefox source docs for their Storybook setup.

**Triangulation**: Lit has genuine, consistent community use — particularly in design systems and enterprise component libraries. But it sits in a knowledge tier well below React, Vue, and Angular in most LLM training corpora. A model generating Lit code from memory will know the basics (decorators, html tag, @click binding) but is more likely to have gaps in advanced patterns (reactive controllers, custom directives, context protocol) than with React.

Score: 6.0. Stable but niche. Age and npm health are good signals; community volume is real but small relative to the frameworks occupying the bulk of web dev training data.

### Evidence: Stability / convention durability

**Changelog and roadmap review (June 2026):**

- **Lit 3.3.3** (May 2026): Patch — ref directive disconnect fix. No API changes.
- **Lit 3.3.0** (2025): Added `useDefault` property option, dev-mode warning timing adjustment. Fully backward compatible.
- **Lit 3.2.0** (2025): Added MathML support via `mathml` template tag. Additive.
- **Lit 3.0.0** (2023): Breaking changes were minimal — dropped IE11, ES2021 output, relocated SSR hydration to `@lit-labs/ssr-client`. The Lit team described the upgrade as non-breaking "for the vast majority of users." The upgrade guide confirms most codebases only needed to widen version ranges.

**No Lit 4.0 announced**: The `npm dist-tags` show `latest: 3.3.3` and `next: 2.3.0-next.1` (a legacy pre-release from the 2→3 transition). No GitHub milestone, RFC, or discussion for Lit 4 was found. The one third-party article claiming Lit 4.0 is current (markaicode.com) appears to be incorrect or speculative — npm, GitHub, and lit.dev all show 3.3.3 as latest.

**Foundation shift**: Lit joined the OpenJS Foundation in 2024, which typically signals increased stability commitment rather than impending rewrites.

**`next_release` frontmatter status**: `stability_penalty: false`. No evidence of an imminent major version. Conventions established in Lit 2 (decorators, html tag, lifecycle methods) remain unchanged in Lit 3.

Score: 8.5. Lit's Web Components foundation makes conventions particularly durable — the underlying platform APIs (Custom Elements, Shadow DOM, HTML Templates) are W3C standards that won't change. Lit adds a thin reactive layer on top; that layer has been stable across two major versions. The score is not 10 because decorator syntax (experimentalDecorators vs the TC39 stage-3 standard decorators) is in active transition — Lit 3 supports both but the migration path is visible work.

### Evidence: Ecosystem tooling facts

| Tool | Available | Link |
|---|---|---|
| **VS Code IntelliSense (lit-plugin)** | Yes | [lit-plugin on marketplace](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) |
| **Sublime / Atom (ts-lit-plugin)** | Yes | [ts-lit-plugin on npm](https://www.npmjs.com/package/ts-lit-plugin) |
| **ESLint (eslint-plugin-lit)** | Yes | [eslint-plugin-lit](https://github.com/43081j/eslint-plugin-lit) |
| **Browser DevTools (Lit Prism)** | Yes | [Chrome Web Store](https://chromewebstore.google.com/detail/lit-prism/agkgbfkeimkbdljdljinnaomlcjboaie) |
| **Web Component DevTools** | Yes | [Chrome Web Store](https://chromewebstore.google.com/detail/web-component-devtools/gdniinfdlmmmjpnhgnkmfpffipenjljo) |
| **Web Test Runner** | Yes (recommended) | [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) |
| **@open-wc/testing** | Yes | [@open-wc/testing](https://open-wc.org/docs/testing/helpers/) |
| **Storybook** | Yes | [Storybook Web Components](https://storybook.js.org/docs/web-components/get-started/introduction) |
| **Vite integration** | Yes | [vite-plugin-lit](https://github.com/egoist/vite-plugin-lit-element) |
| **SSR (@lit-labs/ssr)** | Yes (labs/experimental) | [@lit-labs/ssr](https://www.npmjs.com/package/@lit-labs/ssr) |

**Notable gaps:**
- No official time-travel debugger or state history inspector (Shadow DOM state is per-component; no global store to snapshot).
- Template type checking requires the IDE plugin — plain `tsc` does not check html`` template interiors.
- `@lit-labs/ssr` is still in "labs" status — experimental, not production-stable.

Score: 7.0. Core tooling (IDE plugin, ESLint, DevTools, test utilities) is solid and maintained. The plugin-required template type-checking is a real gap versus frameworks where the compiler handles everything. SSR's labs status is a mark against production readiness for server-rendered use cases.

---

## On the Horizon

### Next release
- **Name/version:** No upcoming release announced
- **Status:** null — Lit 3.x is in stable maintenance
- **What's changing:** 3.x patch track (bug fixes, minor additive features). No breaking changes or major version planned. Potential: TC39 standard decorators stabilization may prompt a Lit update to make `experimentalDecorators` optional, but no timeline exists.
- **Anticipated impact:** Minimal. No evidence of convention-breaking changes.
- **Stability penalty:** No — see `next_release.stability_penalty: false` above and the Stability evidence section.

### AI-tooling investment
- **What exists:** No official MCP server. No `llms.txt`. No AI-specific style guides or curated prompt guidelines. `lit.dev` documentation is well-structured HTML but not published as an LLM-consumption artifact. The Lit playground (lit.dev/playground) provides interactive examples that agents could scrape but are not specifically formatted for LLM ingestion.
- **Observed delta:** As noted in `ai_tooling.observed_delta` above — no tooling exists to test against. The model generated idiomatic Lit 3 decorator syntax without any framework-specific context injection, which is consistent with Lit's presence in LLM training data (TypeScript decorators, html tag, @click binding are all well-represented patterns). The gap that did appear — defaulting to imperative event listeners in `connectedCallback` rather than `@event` template binding for child-dispatched events — reflects the genuine convention ambiguity the docs have around async/event patterns (four viable patterns, weak canonical signal). No AI tooling exists that would close that gap.
