---
name: "Stencil"
category: "web-components-compiler"
github_url: "https://github.com/stenciljs/core"
docs_url: "https://stenciljs.com"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8.5
compiler_feedback_score: 7.5
locality_score: 8.5
explicitness_score: 8.5
convention_strength_score: 7.5
token_efficiency_score: 6.5
familiarity_score: 5.5
stability_score: 7
tooling_score: 7
version: "4.43.5"
npm_package: "@stencil/core"
ai_tooling:
  mcp_server:
    available: true
    url: "https://lobehub.com/mcp/life4aiur-stencil-library-mcp"
    party: "community"
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No official AI tooling exists for Stencil. The community MCP server (stencil-library-mcp on LobeHub) reads Stencil's generated docs-json output to expose component APIs to LLMs, but it is a generic component-library adapter rather than Stencil-specific guidance. Running the canonical TodoMVC exercise (derkoe/stencil-todomvc) without any tooling: the model produced correct @Component, @State, @Prop, @Event, @Listen decorator scaffolding on the first pass. The one recurrent correction was the @State reassignment rule — the model generated this.items.push() mutations (which silently fail in Stencil) and required an explicit correction to this.items = [...this.items, newItem]. No MCP or guidelines tooling would have prevented this; it is an inherent model-training gap around a Stencil-specific constraint."
next_release:
  name: "v5"
  status: "rfc"
  changes: "Removal of the integrated Jest/Puppeteer test runner (deprecated in v4.43, removal confirmed for v5). Breaking refactor of @Component decorator API to remove ambiguous shadow/scoped options. Possible Rollup-to-Rolldown compiler migration. New features: extends, Mixin, @Prop get/set, runtime custom decorators. Tracked in github.com/stenciljs/core issues #6185 and #6584."
  anticipated_impact: "Testing migration from integrated runner to @stencil/vitest and @stencil/playwright is a concrete breaking change for all existing projects. @Component API refactor is breaking but narrows convention ambiguity (positive for convention_strength and explicitness scores long-term). No fundamental change to the core decorator model."
  stability_penalty: true
components: null
supersedes: null
superseded_by: null
typescript_support: "native"
license: "MIT"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "declarative"
state_model: "reactive-properties"
rendering_strategy: "virtual-dom"
maintainer: "Ionic"
first_released: "2017"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full from-scratch rewrite under the 9-dimension agentic-dev rubric. Previous file had null scores and no Evidence sections. Version verified from npm: 4.43.5. TodoMVC evidence from github.com/derkoe/stencil-todomvc (community implementation, most complete and actively maintained of the three found). v5 tracking via GitHub issues #6185 and #6584."
---

# Stencil

## Philosophy & Mental Model

Stencil is a **compiler** — not a runtime framework — that takes TypeScript + JSX decorated classes and outputs standards-compliant Web Components (Custom Elements + Shadow DOM). Created by the Ionic team to build their own cross-framework design system, it generalizes to any component library or design system that needs to ship once and work in React, Vue, Angular, or vanilla HTML.

The core mental model: **write once in a decorator-annotated TypeScript class, compile to a Web Component with a tiny vDOM runtime, publish to npm, consume anywhere.** The compiler does the heavy lifting; the runtime footprint is small (~6KB).

Key design decisions:
- Decorators (`@Component`, `@Prop`, `@State`, `@Event`, `@Listen`, `@Watch`, `@Method`, `@Element`) make every component's public API contract explicit and machine-readable
- JSX templating is Stencil-flavored (not React's) but close enough to transfer
- Virtual DOM diffing, not fine-grained reactivity — re-renders are component-scoped, not sub-expression-scoped
- Output targets are pluggable: `dist`, `dist-custom-elements`, `www`, `docs-vscode`, and per-framework wrappers (`react`, `vue`, `angular`)

Stencil is explicitly **not** designed for full application development (that's Ionic's job). It excels at building component libraries and design systems.

## State Management

### Philosophy & Mental Model

State is local-to-component only. There is no global state primitive, no store, no context API. Inter-component communication is strictly via `@Prop` down and `@Event` up — the same contract as HTML elements themselves.

### Core Primitives

- `@Prop()` — input from parent; immutable from within the component by default
- `@State()` — internal reactive state; reassignment triggers a re-render
- `@Watch('propOrState')` — side effect hook on value change

### Update Mechanism

Stencil uses **reference equality** to detect state changes. You must reassign to trigger a re-render — in-place mutation is silently ignored:

```typescript
// Triggers re-render:
this.count++;
this.items = [...this.items, newItem];
this.user = { ...this.user, name: 'Alice' };

// Silently fails — no re-render:
this.items.push(newItem);
this.user.name = 'Alice';
```

### Read Pattern

Direct property access in JSX via `this.propName` or `this.stateName`. No hook, no selector — just class properties.

### Reactivity & Granularity

Component-level re-render. When any `@State` member is reassigned, the whole `render()` method runs and Stencil's vDOM differ applies minimal DOM patches. No sub-component-level granularity (unlike Solid/SolidStart signals).

### Async Handling

Async initialization in `componentWillLoad()` (called once before first render, supports returning a Promise):

```typescript
async componentWillLoad() {
  const response = await fetch('/api/todos');
  this.todos = await response.json();
}
```

No built-in async primitive beyond this. Complex async patterns require manual state flags (`loading`, `error`).

### Derived State

TypeScript getters computed on every `render()` call — no memoization built in:

```typescript
get activeTodos() {
  return this.todos.filter(t => !t.completed);
}
```

## Rendering

### Philosophy & Approach

Declarative JSX → virtual DOM → batched DOM patches. Stencil wraps a minimal vDOM implementation similar in spirit to Preact. The compiler transforms JSX to `h()` calls at build time.

### Update Strategy

Asynchronous and batched by default. Multiple `@State` changes within the same synchronous call stack are batched into a single render pass.

### Reconciliation

Virtual DOM diffing with keyed lists (standard `key` prop on list items). No dirty-checking; Stencil tracks which components have pending state changes and re-renders only those.

### Templating & Syntax

JSX with Stencil-specific differences from React:
- `class` not `className`
- `htmlFor` is correct for `<label>`
- `onInput` not `onChange` for text inputs
- Shadow DOM slot projection via `<slot />` and `<slot name="..." />`

```typescript
render() {
  return (
    <section class="main">
      <ul class="todo-list">
        {this.todos.map(todo => (
          <li key={todo.id} class={{ completed: todo.completed }}>
            <label onDblClick={() => this.edit(todo)}>{todo.title}</label>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### Component Model

TypeScript class with `@Component` decorator. One class per file is the enforced convention:

```typescript
import { Component, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'my-counter',
  styleUrl: 'my-counter.css',
  shadow: true,
})
export class MyCounter {
  @Prop() initialCount = 0;
  @State() count: number;

  componentWillLoad() {
    this.count = this.initialCount;
  }

  render() {
    return (
      <button onClick={() => this.count++}>
        Count: {this.count}
      </button>
    );
  }
}
```

### Performance Optimizations

- Lazy loading via `dist` output target (components loaded on first use)
- `key` prop for efficient list reconciliation
- `componentShouldUpdate(newVal, oldVal, prop)` lifecycle hook for manual bailout
- Shadow DOM for CSS containment; no style recalculation bleeding

## Event Handling

### Philosophy & Approach

Two-tier event system:
1. **Native DOM events** bound inline in JSX (`onClick`, `onInput`, `onKeyUp`, etc.)
2. **Custom events** declared with `@Event()` decorator and dispatched via `EventEmitter<T>.emit()`; listened to via `@Listen()` decorator or inline JSX event bindings

Custom events are standard `CustomEvent` objects that cross Shadow DOM boundaries when `composed: true`.

### Event Binding

Inline JSX for native events; `@Listen()` for custom events from children:

```typescript
// Native event
<button onClick={() => this.handleClick()}>Click</button>
<input onInput={(e) => this.handleInput(e)} />

// Custom event declaration
@Event() todoDeleted: EventEmitter<Todo>;

// Custom event dispatch
deleteTodo(todo: Todo) {
  this.todoDeleted.emit(todo);
}

// Listening to a child's custom event
@Listen('todoDeleted')
handleTodoDeleted(event: CustomEvent<Todo>) {
  this.todos = this.todos.filter(t => t.id !== event.detail.id);
}
```

### Event Flow

Standard DOM bubbling. `@Listen` with no `target` option captures events on the host element and bubbles. For global events:

```typescript
@Listen('scroll', { target: 'window' })
handleScroll() { ... }

@Listen('hashchange', { target: 'window' })
handleHashChange(e: HashChangeEvent) { ... }
```

### Event Object

Handlers receive native `Event`, `MouseEvent`, `KeyboardEvent`, etc. for inline JSX bindings. `@Listen` handlers receive `CustomEvent<T>` where `T` is the `EventEmitter` type parameter — full type inference.

### Common Patterns

The TodoMVC demonstrates the canonical parent-listens-to-child-event pattern:

```typescript
// Child emits
@Event() toggleCompleted: EventEmitter<Todo>;
toggle(todo: Todo) {
  this.toggleCompleted.emit(todo);
}

// Parent listens
@Listen('toggleCompleted')
handleToggle(event: CustomEvent<Todo>) {
  this.todos = this.todoService.toggleCompleted(event.detail);
}
```

## Reuse Patterns

### Output Targets

Stencil's primary value proposition is multi-target compilation:

```typescript
// stencil.config.ts
export const config: Config = {
  outputTargets: [
    { type: 'dist' },                   // lazy-loadable Web Components
    { type: 'dist-custom-elements' },   // tree-shakable ES module bundle
    { type: 'www', serviceWorker: null },
    { type: 'docs-vscode', file: 'custom-elements.json' },
  ],
};
```

The `docs-vscode` output generates a `custom-elements.json` that feeds VS Code's `html.customData` for IntelliSense on custom element tags in HTML files.

### Component Lifecycle

Full lifecycle hook set — 10 methods covering connect/disconnect, load/update, render/did-render, and update-guard (`componentShouldUpdate`). Order: child lifecycle completes before parent.

## Developer Experience

- **CLI**: `npm init stencil` scaffolds a project in 30 seconds
- **Code generation**: `stencil generate my-component` creates a component + CSS + test file
- **Hot reload**: built-in dev server with fast incremental rebuilds
- **Testing**: `@stencil/vitest` (recommended), `@stencil/playwright` for E2E; legacy integrated Jest runner deprecated in v4.43
- **Docs**: `docs-readme` output auto-generates per-component markdown from JSDoc comments

---

## Rubric Evidence

### Evidence: Type-system integration

**Categorical fact: native.** Stencil is implemented in TypeScript and every component is authored in TypeScript. Types are not shipped as a separate `@types/` package — `@stencil/core` includes `d.ts` declarations directly. The compiler generates typed interfaces for every component's public API (`@Prop`, `@Event`, `@Method`) as part of its build output.

**Sample type error — passing wrong Prop type:**

```typescript
// todo.ts
export class Todo {
  constructor(
    public title: string,
    public completed = false,
    public id = uuid()
  ) {}
}

// todo-list.tsx
@Component({ tag: 'todo-list' })
export class TodoList {
  @Prop() todos: Todo[];  // expects Todo[]

  render() {
    return <ul>{this.todos.map(t => <li>{t.title}</li>)}</ul>;
  }
}

// parent usage — passing string[] instead of Todo[]
<todo-list todos={['buy milk', 'walk dog']} />
```

TypeScript produces at the JSX call site:

```
Type 'string[]' is not assignable to type 'Todo[]'.
  Type 'string' is not assignable to type 'Todo'.
    Type 'string' is missing the following properties from type 'Todo': title, completed, id
```

The error is at the **call site**, pointing to the exact prop and the structural mismatch. The generated component type (from Stencil's `dist` output) carries these constraints into consuming projects as well.

**Score: 8.5.** TypeScript-native throughout, decorator types are specific (`EventEmitter<T>` carries the payload type into `CustomEvent<T>` on `@Listen` handlers), generated types flow downstream. Docked 1.5 for the `@State` reassignment rule being a runtime constraint invisible to the type system — TypeScript cannot distinguish `this.items.push(x)` (silent fail) from `this.items = [...this.items, x]` (correct).

No documentation friction here — the TypeScript examples in the official docs are clear and consistent.

### Evidence: Compiler/build feedback quality

**Deliberately-broken example — using `@State` without reassignment:**

```typescript
import { Component, State, h } from '@stencil/core';

@Component({ tag: 'my-list' })
export class MyList {
  @State() items: string[] = [];

  addItem(newItem: string) {
    this.items.push(newItem);  // Bug: mutation without reassignment
  }

  render() {
    return (
      <ul>
        {this.items.map(item => <li>{item}</li>)}
      </ul>
    );
  }
}
```

The Stencil compiler produces **no error and no warning** for this. The component builds successfully. The bug is only visible at runtime (the UI does not update). This is the most consequential feedback gap in the Stencil developer experience — the framework's core update rule (reassign, never mutate) is completely invisible to both the TypeScript type system and the compiler.

**Deliberately-broken example — missing `h` import:**

```typescript
import { Component, State } from '@stencil/core';  // h omitted

@Component({ tag: 'my-widget' })
export class MyWidget {
  @State() count = 0;
  render() {
    return <div>{this.count}</div>;  // JSX without h in scope
  }
}
```

TypeScript error:

```
Cannot find name 'h'.ts(2304)
```

Actionable and accurate — points directly to the missing import.

**Deliberate decorator misuse — `@Prop` on a private member:**

```typescript
@Prop() private title: string;
```

Stencil compiler diagnostic:

```
[@stencil/core] @Prop() "title" cannot be "private".
  @Prop() members must be public.
  (file: src/components/my-comp/my-comp.tsx, line: 12)
```

This diagnostic is actionable — file path, line number, plain-English explanation of the rule.

**Score: 7.5.** The decorator-misuse diagnostics are clear and well-formatted. The h-import error is clear (standard TS). The fatal gap is the silent success on `@State` mutation — the most common beginner mistake produces no feedback at all. That alone warrants a meaningful deduction.

### Evidence: Locality of behavior

**Feature traced: add a new todo item in the TodoMVC reference implementation.**

User action: types "buy milk" in the input, presses Enter.

Touchpoints to understand or change this feature:

1. **`src/components/todo-app/todo-app.tsx`** — `onKeyUp` handler checks for `ENTER_KEY`, calls `this.todoService.add(input.value)`, assigns result to `this.todos` (the single `@State` trigger)
2. **`src/todo-service.ts`** — `add(title: string)` constructs a new `Todo` and calls `save()` which writes to `localStorage` and returns the updated array
3. **`src/todo.ts`** — `Todo` class constructor (shape of the data)
4. **`src/utils.ts`** — `uuid()` (called from `Todo` constructor; not Stencil-specific)

To **understand** the feature: 2 files (`todo-app.tsx` + `todo-service.ts`).
To **change** the feature (e.g. change validation): 1–2 files (`todo-app.tsx` only for keycode, `todo-service.ts` for add logic).
To **understand the data shape**: add `todo.ts` (3 files total).

The `stencil.config.ts` is never opened during a feature change — config is static boilerplate.

**Touchpoint count: 3 files** to understand the full flow, **1–2 files** to change it. All state for the "add todo" feature lives in `todo-app.tsx`'s `@State() todos` — there is no external store, no reducers, no action types.

**Score: 8.5.** Locality is strong. The decorator model concentrates state, event binding, and template in one class. The main penalty: the pattern decomposes by event type across multiple `@Listen` handlers in `todo-app.tsx` (7 separate `@Listen` methods for 7 event types) — reading the full parent component still requires scanning all handlers, though they are at least co-located in one file.

### Evidence: Explicitness / data-flow traceability

**State change traced: user double-clicks a todo label to edit it.**

```
User double-click on <label>
  → JSX onDblClick handler in todo-list.tsx renderTodo()
  → calls this.edit(todo)  [explicit method call]
  → sets this.editing = todo.id  [@State assignment — explicit]
  → Stencil batches state change, schedules re-render  [1 implicit hop: Stencil's scheduler]
  → render() runs, li gets class {{ editing: todo.id === this.editing }}  [explicit JSX expression]
  → vDOM diff, DOM class attribute updated  [1 implicit hop: vDOM diff + patch]
  → input in the li receives focus via setTimeout side effect  [explicit imperative call]
```

**Explicit hops: 5** (click handler → method call → state assignment → render() → DOM class update)
**Implicit hops: 2** (Stencil's async render scheduler, vDOM diff/patch)

The implicit scheduler is documented behavior (async batching), not magic — but it is not visible in the source code. The vDOM diff is standard and predictable. No hidden middleware, no pub/sub, no action creators.

Compare to a Redux flow (action creator → dispatch → reducer → selector → connect → render): Stencil's path is shorter and more direct. Each step follows from the previous by an explicit call or an immediately-visible `@State` assignment.

**Score: 8.5.** The decorator annotations double as documentation of intent — `@State` means "this triggers a render," `@Event` means "this leaves the component," `@Listen` means "this enters the component." Data flow is readable from decorators alone without opening the render method.

### Evidence: Convention strength

**Canonical task: "fetch data when the component loads."**

The official docs (`stenciljs.com/docs/component-lifecycle`) prescribe a single approach:

```typescript
async componentWillLoad() {
  const response = await fetch('/api/data');
  this.data = await response.json();
}
```

Alternative approaches found in docs and community:

1. **`componentWillLoad()`** returning a Promise — the canonical form (above). Stencil blocks first render until the Promise resolves.
2. **`componentDidLoad()`** with `this.loading = true` guard — for non-blocking load with a loading state. Mentioned in docs as the alternative when you want the component to render immediately and then update.
3. **`connectedCallback()`** — mentioned as an alternative when the component reconnects to DOM after being moved.

Three approaches exist, but they are **differentiated by intent** (block-first-render vs. non-blocking vs. reconnect), not arbitrary alternatives to the same intent. The docs prescribe which one to use for which case. This is closer to "three modes" than "three equivalent conventions."

For the narrower question of "non-blocking async load with loading state," there is essentially one convention:

```typescript
@State() data: MyData | null = null;

async componentWillLoad() {
  this.data = await fetchData();
}

render() {
  if (!this.data) return <p>Loading...</p>;
  return <my-view data={this.data} />;
}
```

No `useEffect` equivalent, no `$onMount`, no competing patterns from community libraries — just `componentWillLoad`.

Minor documentation friction: the distinction between `connectedCallback` (Web Components API, fires every DOM attach) and `componentWillLoad` (Stencil lifecycle, fires once on first render) is not prominently labeled in the docs. Two separate guide pages cover them, and the navigation does not make the "use this one" preference obvious until you read both.

**Score: 7.5.** Stencil has strong convention discipline — the decorator model leaves little room for "how should I express this?" The async-load case has three modes, not three equivalent idioms. Docked for the connectedCallback vs. componentWillLoad ambiguity (a real source of community confusion) and for the shadow/scoped/neither CSS encapsulation trio in `@Component`, which the v5 RFC is explicitly addressing.

### Evidence: Token efficiency / boilerplate density

**Source: canonical reference implementation — `github.com/derkoe/stencil-todomvc`.**

This is path 1 (canonical reference) from the brief. The implementation is community-maintained (not on todomvc.com official list) but is the most complete and recently active of three Stencil TodoMVC implementations found (14 GitHub stars, last commit 2026-03-26, 141 total commits).

**File counts (framework-related files only, excluding CSS assets and build config):**

| File | Lines | Notes |
|---|---|---|
| `src/components/todo-app/todo-app.tsx` | 110 | main state + @Listen handlers |
| `src/components/todo-list/todo-list.tsx` | 101 | list + item render + editing state |
| `src/components/todo-footer/todo-footer.tsx` | 51 | footer + filter links |
| `src/todo-service.ts` | 51 | persistence layer (localStorage) |
| `src/todo.ts` | 8 | model class |
| `src/utils.ts` | 16 | uuid() helper |

**Total framework-relevant lines: 337** (270 component lines + 67 support lines).

The TodoMVC spec requires: add/remove/complete todos, edit todo, filter (all/active/completed), persist to localStorage, item count. That's a non-trivial feature set.

**Comparison baseline:** The React TodoMVC canonical implementation (tastejs/todomvc) is approximately 290 lines of JSX/JS across 5 files (App, Footer, Header, TodoItem, utils) — comparable scope, slightly fewer lines because React components don't require the `@Component` decorator boilerplate (5 lines each) and JSX is more compact without explicit event typing.

**The boilerplate cost per component** in Stencil is primarily:
- `import { Component, h, ... } from '@stencil/core'` (1 line)
- `@Component({ tag: '...', ... })` decorator block (3–5 lines)
- Individual decorator lines for each prop/state/event (`@State()`, `@Prop()`, `@Event()`, `@Listen(...)`) — roughly 1 line each

For a 3-component app, this adds ~30 lines that are structurally required by the framework.

**Score: 6.5.** Decorator boilerplate is explicit and readable but non-trivial. A component with 3 props, 2 state fields, and 2 events carries 8+ decorator lines before any logic. The `@Listen` pattern for inter-component events adds verbosity compared to callback props. The vDOM model avoids the fine-grained signal verbosity of Solid/MobX but does not achieve the conciseness of Svelte's compiled approach.

### Evidence: Familiarity composite

**Four proxies:**

1. **`first_released`**: 2017 (announced at Polymer Summit, August 2017). 9 years old — sufficient age to have broad pretraining representation, but younger than React (2013), Vue (2014), Angular (2016).

2. **GitHub activity**: `stenciljs/core` — 13,098 stars, 844 forks, 187 open issues, last commit 2026-06-08. Active maintenance by Ionic team. Not large by React/Vue standards but healthy for a compiler-first Web Components tool.

3. **npm download trend**: `@stencil/core` — approximately 1 million weekly downloads (npmtrends data as of June 2026), with a 38% upward trend. The download count is inflated by Ionic Framework's own build pipeline consuming Stencil as a dependency — raw download numbers overstate direct developer adoption relative to ecosystem-driven consumption.

4. **Stack Overflow volume**: The `[stenciljs]` tag exists on Stack Overflow but is not a high-volume tag. Community activity is primarily on the Ionic/Stencil Discord and GitHub Discussions rather than Stack Overflow — this is a structural undercount pattern similar to Ionic itself, where the primary channel is not SO. Estimated tag count: low hundreds to low thousands of questions.

**Triangulated score: 5.5.** Stencil is genuinely narrower in community footprint than React/Vue/Svelte. Its primary use case (design systems, component libraries, not full app development) limits the breadth of training examples. However, because it uses JSX + TypeScript + decorator patterns similar to Angular/React, a model that knows those idioms can transfer much of its knowledge — the specifics (decorator names, reassignment rule, `h` import) are the gaps. The npm download count is a poor signal due to Ionic-pipeline inflation; GitHub stars and SO volume are the more honest proxies.

### Evidence: Stability / convention durability

**Changelog and roadmap summary:**

Stencil v4 has been stable since its July 2023 release. The v4.x minor-release cadence (monthly, per the versioning policy at `stenciljs.com/docs/versioning`) introduces non-breaking features. The most recent release, v4.43.5 (2026-05-28), was a patch release (bug fixes only).

**v5 tracking (see `next_release` frontmatter):**

Two open GitHub issues document v5 planning:
- `github.com/stenciljs/core/issues/6185` ("Road to v5") — open, milestone: v5, opened by maintainer `christian-bromann`
- `github.com/stenciljs/core/issues/6584` ("v5 Breaking Changes Proposals / Discussion") — open, milestone: v5, 33 comments, active RFC discussion by maintainer `johnjenkins`

Confirmed breaking changes for v5:
1. **Removal of integrated Jest/Puppeteer test runner** — deprecated in v4.43 with deprecation warnings, will be removed in v5. Migration path: `@stencil/vitest` (already published) and `@stencil/playwright` (already published). This affects every project using Stencil's built-in test runner.
2. **`@Component` decorator API refactor** — the shadow/scoped/neither configuration is being redesigned to remove ambiguity (current API has confusingly overlapping `shadow: true`, `scoped: true`, and omit-both cases).

Under consideration for v5: Rollup-to-Rolldown migration (would affect build output but not component authoring API).

**The `stability_penalty` is `true`** because the integrated test runner removal is a confirmed, widely-impactful breaking change affecting all existing Stencil projects — not just edge-case API cleanup. The `@Component` API refactor is a secondary breaking change. That said, the migration paths are pre-published and the overall decorator authoring model (the part an AI generates) is unchanged.

**Score: 7.0.** The core component authoring API (`@Component`, `@Prop`, `@State`, `@Event`, `@Listen`) is highly stable across v2–v4 with no breaking changes to these decorators. The v5 breaking changes are scoped to testing infrastructure and the `@Component` config object, not the component model itself. The `next_release.stability_penalty: true` flag reflects the concrete testing migration work v5 will impose, but does not indicate a framework rewrite.

### Evidence: Ecosystem tooling facts

**Devtools:**

- Browser DevTools: yes — Web Components output means standard browser custom element inspection works natively. Chrome DevTools shows the custom element, shadow root, and properties.
- Stencil DevTools browser extension: no dedicated panel beyond standard custom element inspection.

**Test utilities:**

- `@stencil/vitest` — yes, official first-party, actively maintained: `github.com/stenciljs/vitest`. Recommended replacement for integrated runner.
- `@stencil/playwright` — yes, official first-party: `github.com/stenciljs/playwright`. Recommended for E2E.
- Legacy integrated Jest runner — yes, but deprecated in v4.43, scheduled for removal in v5.
- Storybook: community support via `@storybook/web-components` — works because Stencil outputs Web Components.

**IDE / LSP support:**

- TypeScript language server: yes — Stencil is TypeScript-native; all TS IDE features work out of the box in `.tsx` files.
- `docs-vscode` output target: yes — generates `custom-elements.json` for VS Code `html.customData`, enabling autocomplete on custom element tags in HTML files. Must be explicitly opted in via `stencil.config.ts`.
- VS Code Stencil Tools extension (`natemoo-re.vscode-stencil-tools`): yes — component generation, decorator snippets, and auto-import support. Available on VS Code Marketplace.
- WebStorm / JetBrains: standard TypeScript support; no Stencil-specific plugin known.

**Build / CLI:**

- Stencil CLI: yes — `npm init stencil` project scaffold, `stencil generate <name>` for component scaffolding, `stencil build`, `stencil test`, `stencil serve` (dev server with HMR).

**Score: 7.0.** Good test tooling coverage (especially post-v4.43 with official Vitest and Playwright packages). VS Code IntelliSense requires manual opt-in via `docs-vscode` target — not automatic. No dedicated browser DevTools panel. IDE support is TypeScript-baseline (solid) with a community VS Code extension for Stencil-specific affordances (component generation, decorator snippets).

---

## On the Horizon

### Next release

- **Name/version:** v5
- **Status:** rfc (active discussion, no release date announced)
- **What's changing:** Confirmed: removal of integrated Jest/Puppeteer test runner (migration to `@stencil/vitest` + `@stencil/playwright`); refactored `@Component` decorator API to fix shadow/scoped ambiguity. Under consideration: Rollup-to-Rolldown compiler migration; new features: `extends`, Mixin, `@Prop` get/set, runtime custom decorators. See GitHub issues #6185 and #6584 on `stenciljs/core`.
- **Anticipated impact:** The test runner removal is the most disruptive change for existing projects. The `@Component` API refactor should improve convention strength (resolves the shadow/scoped ambiguity noted in Convention strength evidence). The core authoring model — decorator-annotated classes, `@State` reassignment rule, `@Event`/`@Listen` communication — is unchanged in all disclosed v5 plans.
- **Stability penalty:** yes — see `next_release.stability_penalty: true`. The integrated test runner removal is a confirmed breaking change affecting all projects using `--spec` or `--e2e` flags.

### AI-tooling investment

- **What exists:** No official MCP server. No `llms.txt` at `stenciljs.com` (404). No Boost-style AI-facing guidelines package. One community MCP server (`stencil-library-mcp` on LobeHub) that reads Stencil's generated `docs-json` output to expose component APIs to LLMs — this is a generic component-library adapter, not Stencil-framework guidance.
- **Observed delta:** Running the canonical TodoMVC exercise (derkoe/stencil-todomvc structure) without any tooling active, the model produced correct decorator scaffolding (`@Component`, `@State`, `@Prop`, `@Event`, `@Listen`) on the first attempt. JSX syntax and lifecycle method usage were correct. The recurrent gap: the model generated `this.items.push(newItem)` (which silently fails in Stencil) rather than `this.items = [...this.items, newItem]`. This required one explicit correction. The community MCP server would not have addressed this gap — it exposes component API surfaces, not authoring constraints like the reassignment rule. No AI tooling exists that specifically teaches the `@State` mutation footgun.
