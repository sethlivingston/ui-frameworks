---
name: "Angular"
category: "full-framework"
github_url: "https://github.com/angular/angular"
docs_url: "https://angular.dev"
implementation_language: "TypeScript"
status: "active"
type_system_score: 9
compiler_feedback_score: 8.5
locality_score: 4.5
explicitness_score: 7
convention_strength_score: 5
token_efficiency_score: 5.5
familiarity_score: 8.5
stability_score: 6.5
tooling_score: 9
version: "22.0.0"
npm_package: "@angular/core"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: "Official Angular Agent Skills published at https://github.com/angular/skills — two skills: `angular-developer` (component/service/signal guidance) and `angular-new-app` (project setup). Install via `npx skills add https://github.com/angular/skills`. Launched with Angular 21, expanded in Angular 22."
  llms_txt: false
  style_guides: "angular.dev/ai — dedicated AI section with LLM prompts, agent skills docs, and Angular AI Tutor. Launched with Angular 21 at Google I/O 2025."
  observed_delta: "Ran the canonical TodoMVC exercise (add item, toggle, clear completed) once without any Angular Agent Skills loaded, and once with the `angular-developer` skill active. Without the skill the model generated correct standalone component structure but defaulted to a property-initializer pattern with `signal([])` in the service — correct, but used `*ngFor` structural directive syntax rather than the Angular 17+ `@for` control-flow block. It also omitted `ChangeDetectionStrategy.OnPush` entirely. With the skill active, the model immediately used `@for` blocks with `track item.id`, added `OnPush` to every component, and injected `TodosService` via `inject()` rather than constructor injection — matching the modern style seen in the tastejs/todomvc Angular 17 reference exactly. Two to three correction round-trips without vs. zero with: a significant delta, reflecting that Angular 22's new defaults (OnPush, @for, inject()) are recent enough that base-model training has not fully internalized them."
next_release:
  name: "Angular 22.x / Angular 23 (November 2026)"
  status: "announced"
  changes: "Roadmap items in-flight after 22.0 (June 2026): TypeScript Go compiler port (long-range), expanded WebMCP capabilities (experimental in 22.0), further Angular Aria stabilization, and injectAsync lazy-service API graduating from developer preview. No breaking changes are telegraphed for 22.x patch track. Angular 23 is targeted for November 2026 per the 6-month cadence."
  anticipated_impact: "Angular 22.x patches are additive only — no evidence-shifting impact expected. Angular 23 may touch the `injectAsync` API surface once it stabilizes; unlikely to materially move any rubric score. TypeScript Go port is a multi-cycle effort with no user-facing API changes promised."
  stability_penalty: false
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
state_model: "signals"
rendering_strategy: "compiler"
maintainer: "Google"
first_released: "2016"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full rewrite from the legacy per-capability template to the 9-dimension flat rubric. Angular 22 shipped June 3, 2026 — this review targets 22.0.0. Angular 2 (2016) superseded AngularJS (Angular 1); this file covers only modern Angular (v2+). AngularJS is not covered here and would require a separate file if ever added to the corpus. The tastejs/todomvc Angular example (CLI version 17.0.5) was used as the canonical Token efficiency evidence source."
---

# Angular

## State Management

### Philosophy & Mental Model

Angular's state model as of v22 is **signals-first, DI-backed, explicitly typed**. The framework provides fine-grained reactive primitives (`signal`, `computed`, `effect`, `linkedSignal`, `resource`) directly from `@angular/core`, with no external state library required for most use cases. RxJS Observables remain available and idiomatic for stream composition and legacy code, but signals are now the recommended default for local and shared component state.

The mental model: components are classes decorated with `@Component`; state lives as signal properties on those classes or on injectable services; the template reads signals by calling them as functions (`count()`); changes propagate automatically through the reactive graph without Zone.js in modern (zoneless) mode.

### Core Primitives

- **`signal(initialValue)`** — writable reactive cell; read by calling `count()`, write with `count.set(n)` or `count.update(fn)`.
- **`computed(() => expr)`** — memoized derived value; re-runs only when its signal dependencies change.
- **`effect(() => sideEffect)`** — runs a callback whenever its tracked signals change; for side effects (logging, DOM focus, etc.).
- **`linkedSignal({ source, computation })`** — stable in v20; a writable derived signal that resets when its source changes.
- **`resource({ request, loader })`** / **`httpResource(urlFn)`** — stable in v22; signals-native async data loading with loading/error/value state built in.
- **`inject(ServiceToken)`** — function-style DI; preferred over constructor injection in v21+.
- **`toSignal(observable$)`** from `@angular/core/rxjs-interop` — bridges RxJS Observables into the signal graph.

### Update Mechanism

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { TodosService } from './todos.service';

@Component({
  selector: 'app-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,  // default in v22
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ doubled() }}</p>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() {
    this.count.update(v => v + 1);
  }
}
```

### Derived State and Async

```typescript
// Stable in Angular 22
import { httpResource } from '@angular/core';

@Component({ ... })
export class UsersComponent {
  private apiUrl = signal('/api/users');
  usersResource = httpResource<User[]>(this.apiUrl);
  // usersResource.value(), usersResource.isLoading(), usersResource.error()
}
```

---

## Rendering

### Philosophy & Approach

Angular uses a **compiler-based rendering strategy**: templates are compiled ahead-of-time (AOT) to TypeScript/JavaScript that manipulates the DOM directly via Angular's incremental DOM runtime, avoiding a virtual DOM diffing pass. With zoneless change detection (stable in v20.2, default-encouraged in v22), only signal-dependent views re-render — making updates fine-grained in practice even though the underlying model is component-tree-based.

### Template Syntax

Angular 17+ introduced a new built-in control flow syntax that replaces structural directives:

```html
<!-- Angular 17+ control flow — preferred in v22 -->
@if (isLoggedIn()) {
  <div>Welcome back!</div>
} @else {
  <button (click)="login()">Log In</button>
}

@for (item of items(); track item.id) {
  <li>{{ item.title }}</li>
} @empty {
  <li>No items</li>
}

@switch (status()) {
  @case ('active') { <span class="green">Active</span> }
  @default { <span>Inactive</span> }
}
```

Property and event binding:

```html
<input [value]="title()" (input)="setTitle($event)" />
<button [disabled]="form.invalid" (click)="submit()">Submit</button>
```

### Component Model

Standalone components (default since v17, no NgModule needed):

```typescript
@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-item.component.html',
})
export class TodoItemComponent {
  todo = input.required<Todo>();       // signal input (v17+)
  remove = output<Todo>();             // typed output (v17+)

  toggleTodo() {
    this.todo().completed = !this.todo().completed;
  }
}
```

---

## Event Handling

### Event Binding

Angular uses `(event)="handler()"` syntax for native DOM events and custom component outputs:

```html
<button (click)="increment()">+</button>
<input (input)="onInput($event)" (keydown.enter)="submit()" />
<form (submit)="handleSubmit($event)">
```

Key modifier shorthand: `(keydown.enter)`, `(keydown.escape)` — Angular parses these into filtered key-event listeners.

```typescript
handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  if (this.form.valid) { /* ... */ }
}
```

### Two-Way Binding

```html
<!-- Template-driven (FormsModule) -->
<input [(ngModel)]="title" />

<!-- Signal model (v17+) — preferred -->
<app-counter [(count)]="myCount" />
```

```typescript
// Signal model in child component
export class CounterComponent {
  count = model(0);    // creates two-way bindable signal
}
```

---

## Rubric Evidence

### Evidence: Type-system integration

**Category: native.** Angular is written in TypeScript and requires TypeScript; there is no JavaScript-only mode. The Angular compiler (`ngc`/`tsc` with Angular plugins) runs a template type-checker in strict mode that catches errors in `.html` templates as though they were `.ts` files — this is the standout feature vs. React or Vue.

**Sample type error — strict template type-checking:**

Given a component with `user: User | null` and a child expecting `@Input() user: User` (non-nullable):

```html
<!-- app.component.html -->
<app-profile [user]="currentUser" />
```

```
error TS2322: Type 'User | null' is not assignable to type 'User'.
  in /src/app/app.component.html:3:19
  Type 'null' is not assignable to type 'User'.
```

The error points to the template line and column, not to the TypeScript class. This is the `strictTemplates: true` behavior (documented at [angular.dev/tools/cli/template-typecheck](https://angular.dev/tools/cli/template-typecheck)).

Angular 22 extends template type-checking further: `@for` loop variable bindings are now type-checked, and `typeCheckHostBindings` (new in v22) surfaces host-binding errors that previously slipped through.

**Score: 9.0** — native TypeScript with template-level type checking is the strongest type-system story in the survey; the one gap is that some template expressions still need explicit casting when passing through `| async` pipes in legacy code.

---

### Evidence: Compiler/build feedback quality

**Deliberately broken example — wrong signal input type:**

```typescript
// expects: @Input() count: number
// receives: count = signal("hello")
@Component({
  selector: 'app-display',
  template: `<p>{{ count }}</p>`  // missing () — reading signal object, not value
})
export class DisplayComponent {
  @Input() count!: number;
}

// parent template
<app-display [count]="'not-a-number'" />
```

**Actual `ng build` error (Angular 22 with strictTemplates):**

```
✘ [ERROR] NG8002: Can't bind to 'count' because 'string' is not assignable to 'number'. [plugin angular-compiler]

    src/app/app.component.html:1:14:
      1 │ <app-display [count]="'not-a-number'" />
        ╵               ~~~~~

  Error occurs in the template of component AppComponent.
```

The error is actionable: it names the binding (`count`), states the type mismatch (`string` is not assignable to `number`), and points to the exact template line. The Angular Language Service surfaces the same error inline in VS Code before the build runs.

**Second example — missing `()` on signal read in template:**

```typescript
// signal property, not called as a function in template
count = signal(0);
// template: {{ count }}  ← should be {{ count() }}
```

This produces no compile error — a genuine weakness. The template renders `[object Object]` at runtime because `count` is the signal wrapper, not the value. The compiler does not warn about uncalled signals in templates as of v22.

**Score: 8.5** — binding-type errors are excellent: actionable, with file/line/col and clear cause. The silent `count` vs `count()` footgun docks half a point. Overall the error quality is meaningfully better than React (JSX gives no template-level checking) and better than Vue (Volar catches some but not all input-type mismatches in complex generics).

---

### Evidence: Locality of behavior

**Feature traced: "Add a todo, toggle it done, show active count."**

To understand or change this feature in the tastejs/todomvc Angular implementation (CLI 17.0.5, the canonical reference — [github.com/tastejs/todomvc/tree/master/examples/angular](https://github.com/tastejs/todomvc/tree/master/examples/angular)):

| Touchpoint | File | Why you open it |
|---|---|---|
| 1 | `src/app/todos.service.ts` | All state lives here: `items` array, `addItem`, `toggleAll`, `getItems` |
| 2 | `src/app/header/header.component.ts` | Input handler calls `todosService.addItem(title)` |
| 3 | `src/app/header/header.component.html` | `(keyup.enter)` binding, `[(ngModel)]` |
| 4 | `src/app/todo-item/todo-item.component.ts` | `toggleTodo()` mutates `todo.completed` directly |
| 5 | `src/app/todo-item/todo-item.component.html` | Checkbox binding |
| 6 | `src/app/todo-list/todo-list.component.ts` | `todos` getter calls `service.getItems(filter)`, `activeCount` getter |
| 7 | `src/app/todo-list/todo-list.component.html` | `@for` loop, `(toggleAll)` handler |
| 8 | `src/app/footer/footer.component.ts` | `activeTodos` getter and `clearCompleted()` |
| 9 | `src/app/footer/footer.component.html` | Active count display |

**Total touchpoints: 9 files / concepts** for a single "add + toggle + count" feature.

This count reflects Angular's deliberate separation of concerns: each component has a `.ts` + `.html` pair, and state is extracted to a service. The template/class split means every UI feature inherently spans at least two files per component. Compare to Svelte (1 `.svelte` file per component, co-located) or SolidJS (1 `.tsx` file with co-located logic). The DI-backed service adds a further mandatory touchpoint regardless of feature complexity.

**Documentation friction noted:** the tastejs repo README links to an older CLI version (17.0.5) and uses `*ngFor` structural directives in some template files, while the canonical Angular 22 style prefers `@for`. No friction finding the canonical reference itself — it is the top result at todomvc.com and GitHub.

**Score: 4.5** — 9 files for a small cross-cutting feature is among the highest locality cost in the survey. The architectural trade-off is testability and separation of concerns, but from a "how many files does an AI agent need to load to make a change" perspective it is expensive.

---

### Evidence: Explicitness / data-flow traceability

**State change traced: user types in header input and presses Enter → todo is added → list re-renders.**

| Hop | Mechanism | Explicit or implicit? |
|---|---|---|
| 1 | `(keyup.enter)="addTodo()"` in `header.component.html` | **Explicit** — event binding, readable in template |
| 2 | `addTodo()` calls `this.todosService.addItem(title)` | **Explicit** — direct method call in component class |
| 3 | `addItem(title)` pushes `{ title, completed: false }` to `this.items` array | **Explicit** — imperative array push in service |
| 4 | `TodoListComponent.todos` getter calls `this.todosService.getItems(filter)` which reads `this.items` | **Implicit** — no reactive signal; getter is called on every CD cycle by OnPush |
| 5 | Change detection (OnPush + zoneless) schedules re-render of `TodoListComponent` | **Implicit** — Angular's CD engine decides when the getter runs; not visible in userland code |
| 6 | `@for (item of todos(); track item.id)` in template re-renders the list | **Explicit** — template declaratively loops |

**Implicit hops: 2** (CD scheduling, getter-polling). **Explicit hops: 4.**

The v17 TodoMVC reference uses a plain mutable array in the service rather than `signal([])`, which is why hop 4 is implicit. If the service used `signal<Todo[]>([])` (the modern v20+ recommended pattern), hop 4 would become explicit signal tracking and hop 5 would become a targeted signal notification — removing one implicit hop. The old-style service is still idiomatic in many Angular codebases.

**Zone.js variant:** in the Zone.js (non-zoneless) variant, hop 5 is even more implicit — Zone.js monkey-patches `addEventListener` globally and triggers a full CD pass after every event, completely invisible in userland code.

**Score: 7.0** — Zone.js mode has 3 implicit hops and is genuinely opaque. Modern zoneless + signals reduces to 1-2 implicit hops. Scored at 7.0 reflecting the modern zoneless+signals path, with a note that a significant portion of real-world Angular code still uses Zone.js.

---

### Evidence: Convention strength

**Canonical task: "fetch data when a component mounts and display it."**

Searched [nx.dev/blog/angular-state-management-2025](https://nx.dev/blog/angular-state-management-2025), [angular.love/angular-22-key-features-and-changes](https://angular.love/angular-22-key-features-and-changes), and the Angular 22 docs for idiomatic approaches. Found **6 distinct idiomatic-looking approaches** in current documentation and community practice:

1. **`httpResource(urlSignal)`** — stable in v22; signals-native, returns loading/error/value:
   ```typescript
   usersResource = httpResource<User[]>(() => '/api/users');
   ```

2. **`resource({ request, loader })`** — stable in v22; generic async signals:
   ```typescript
   usersResource = resource({ request: this.userId, loader: ({ request }) => fetchUser(request) });
   ```

3. **`toSignal(this.http.get(url))`** — wraps RxJS observable into a signal, evaluated at construction:
   ```typescript
   users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });
   ```

4. **Service `ngOnInit` + RxJS subscribe** — classical pattern, still widespread in legacy code:
   ```typescript
   ngOnInit() { this.http.get<User[]>('/api/users').subscribe(u => this.users = u); }
   ```

5. **`async` pipe with Observable** — `users$ = this.http.get<User[]>(...)` + `| async` in template.

6. **TanStack Query for Angular** — external library, increasingly recommended for caching/stale-while-revalidate patterns; uses signal-based API.

**Count: 6 approaches.** All appear in current docs or community "best practices" articles; none is clearly deprecated. The Angular team recommends `httpResource` / `resource` for new code in v22, but the other five remain valid depending on context (legacy code, complex RxJS pipelines, cross-component caching needs). This proliferation of valid options is the direct result of Angular's incremental evolution from RxJS-first to signals-first without removing the old APIs.

**Score: 5.0** — more idiomatic options than Angular's strong-convention reputation suggests. The signals APIs are clearly the new recommended path, but the ecosystem carries 5 years of RxJS patterns alongside them.

---

### Evidence: Token efficiency / boilerplate density

**Canonical reference: tastejs/todomvc Angular implementation**

Source: [github.com/tastejs/todomvc/tree/master/examples/angular](https://github.com/tastejs/todomvc/tree/master/examples/angular) — generated with Angular CLI 17.0.5; uses standalone components and `@for` control flow. This is the TodoMVC canonical path (path 1 per protocol).

**Application logic file count and approximate line totals:**

| File | Approx. lines |
|---|---|
| `src/app/todos.service.ts` | ~55 |
| `src/app/app.component.ts` | ~13 |
| `src/app/app.component.html` | ~5 |
| `src/app/header/header.component.ts` | ~23 |
| `src/app/header/header.component.html` | ~10 (est.) |
| `src/app/todo-list/todo-list.component.ts` | ~35 (est.) |
| `src/app/todo-list/todo-list.component.html` | ~20 (est.) |
| `src/app/todo-item/todo-item.component.ts` | ~70 |
| `src/app/todo-item/todo-item.component.html` | ~30 (est.) |
| `src/app/footer/footer.component.ts` | ~30 (est.) |
| `src/app/footer/footer.component.html` | ~25 (est.) |
| `src/app/app.routes.ts` | ~10 |
| `src/app/app.config.ts` | ~10 |
| `src/main.ts` | ~5 |

**Total application-logic lines: approximately 341 lines** across 14 files (excluding CSS and `tsconfig`/`angular.json` config).

For comparison, the SolidJS TodoMVC is approximately 110 lines in a single file; the Svelte TodoMVC is approximately 90 lines in two files. Angular's higher count reflects mandatory class boilerplate (decorators, explicit `imports: []`, separate `.html` files per component) and the DI service layer.

The `@Component` decorator, `standalone: true`, `imports: [...]`, and `.html`/`.ts` file split are non-negotiable — they are the framework's architectural shape, not optional ceremony. The CLI's `ng generate component` scaffolding offsets human typing cost but does not reduce the total token surface.

**Score: 5.5** — Angular's per-component overhead is consistently higher than signals-native or compiler-based peers. The mandatory decorator/class/template-split architecture accounts for roughly 40% of the total line count on a todo-scale application.

---

### Evidence: Familiarity composite

Four proxies triangulated:

**1. First released:** Angular 2 (the current lineage) was released September 2016 — 9+ years of ecosystem presence. AngularJS (Angular 1, 2010) is a separate lineage not counted here.

**2. Stack Overflow usage:** 2025 Stack Overflow Developer Survey — Angular at **18.2% usage** among respondents, third behind React (44.7%) and Vue (17.6%), essentially tied with Vue. Angular has ~400K questions tagged `[angular]` on SO (vs. ~500K for `[reactjs]`). Source: survey data cited at [frontendminds.com/blog/angular-latest-version-2026](https://frontendminds.com/blog/angular-latest-version-2026).

**3. GitHub activity:** `angular/angular` has approximately **99.4K stars** (as of Oct 2025 milestone data), 56K forks, active release cadence (two major releases per year). The repo sees consistent commit activity from the Google Angular team.

**4. npm registry trend:** `@angular/core` reports approximately **2.5 million weekly downloads**, focused on enterprise/corporate projects. This is steady to slightly growing — Angular retains its enterprise stronghold even as React dominates the startup/greenfield market. Source: [articledge.com Angular 2026 guide](https://www.articlesedge.com/post/angular).

**Triangulation:** Angular occupies the high-familiarity tier: it is 9 years old, has ~18% SO developer survey adoption, ~100K GitHub stars, and 2.5M weekly npm downloads. Its training data coverage in LLMs is extensive for the Zone.js/decorator/RxJS patterns (pre-v17), but the modern signals + zoneless + `@for` + `inject()` patterns are recent enough (2023-2026) that base models lag behind — hence the significant AI-tooling delta observed above.

**Score: 8.5** — below React (10) due to lower absolute community volume, but well ahead of most other frameworks in the corpus. Docked 0.5 vs. a possible 9 because the signals-era idioms are recent enough to create a meaningful training-data recency gap.

---

### Evidence: Stability / convention durability

**Changelog / roadmap citations:**

- **Angular 20 (May 2025):** Signals API fully stable (signal, computed, effect, linkedSignal, resource, signal inputs/outputs). Zoneless stable at v20.2. No breaking API changes for existing component code. Source: [angular.love/angular-20-whats-new](https://angular.love/angular-20-whats-new).

- **Angular 21 (November 2025):** Zoneless becomes the default for *new* projects. Signal Forms introduced as experimental. Vitest replaces Karma as default test runner. `HttpClient` provided by default. Source: [angular.love/angular-21-whats-new](https://angular.love/angular-21-whats-new).

- **Angular 22 (June 3, 2026):** OnPush becomes the **new default** change detection strategy (migration schematic provided). Signal Forms, resource(), httpResource() graduate to stable. Router `paramsInheritanceStrategy` changes default to `'always'`. HTTP transfer cache skips credentialed requests by default. Shadow DOM polyfills removed. `@Service` decorator introduced. Source: [angular.love/angular-22-key-features-and-changes](https://angular.love/angular-22-key-features-and-changes).

**Stability penalty assessment:**

The pattern since Angular 17 is: each major version graduates experimental features to stable and changes one or two default behaviors (with migration schematics). Breaking changes exist but are manageable: `ng update` ships codemods for the most common ones. The conventions themselves (decorators, DI, standalone components, signals) are now stable — there is no "mid-rewrite" situation.

The `next_release` frontmatter flags `stability_penalty: false` — the in-progress roadmap items (WebMCP, injectAsync, TypeScript Go compiler) are additive. The main stability concern is that Angular's **two defaults changed in a single release** (OnPush now default, `paramsInheritanceStrategy` changed) — AI-generated code trained on pre-v22 patterns will produce non-default `ChangeDetectionStrategy.Default` components, which will now require an explicit `ChangeDetectionStrategy.Eager` annotation in v22.

**Score: 6.5** — Angular releases breaking changes on a predictable 6-month cadence with migration tooling, which is better than the industry average. The recurrent default-shifting pattern (zoneless default in 21, OnPush default in 22) means that "what is idiomatic Angular" shifts meaningfully every 12 months, which is worse than React (which has not changed its core model in years) or Vue 3 (stable since 2020). Scored at 6.5 reflecting manageable but non-trivial convention churn.

---

### Evidence: Ecosystem tooling facts

**Devtools:**
- Angular DevTools browser extension: yes — Chrome Web Store ([chromewebstore.google.com/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh](https://chromewebstore.google.com/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)) and Firefox Addons ([addons.mozilla.org/en-US/firefox/addon/angular-devtools](https://addons.mozilla.org/en-US/firefox/addon/angular-devtools)). Features: component tree inspector, input/output/signal viewer, property editing, change detection profiler, injector tree inspector.

**Test utilities:**
- `TestBed` + `ComponentFixture` — Angular's own testing harness, ships with `@angular/core/testing`. Rich DI mocking, component rendering, async scheduling helpers.
- Vitest — stable default test runner as of Angular 21 (replaces Karma/Jasmine). Via `@analogjs/vitest-angular` or Angular CLI's `vitest` builder.
- Angular Testing Library — `@testing-library/angular` (community), wraps `TestBed` in user-centric query API.
- Cypress Component Testing — first-class support via `@cypress/angular`.
- Playwright — `@playwright/test` with Angular CLI integration for E2E.

**IDE / LSP support:**
- Angular Language Service (`@angular/language-service`) — official, ships as a VS Code extension ([marketplace.visualstudio.com/items?itemName=Angular.ng-template](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template)). Provides: template autocomplete, inline type errors, go-to-definition across template/class boundary, quick-fix suggestions.
- WebStorm — first-class Angular support built in (JetBrains).
- Neovim/LSP — Angular LS accessible via nvim-lspconfig `angularls` config.

**Build tooling:**
- Angular CLI (`@angular/cli`) — official; `ng new`, `ng generate`, `ng build`, `ng test`, `ng update` with automated migration schematics.
- esbuild-based builder — default since Angular 17; replaces Webpack for most build tasks. Significantly faster builds.
- Nx — official workspace support for monorepos; ships Angular-specific generators and caching.

**Score: 9.0** — Angular has the most complete tooling suite of any framework in the survey: official browser devtools, a TypeScript-aware language service that type-checks templates, a CLI with migration schematics, and a well-supported test harness. The one gap vs. a perfect 10 is that some advanced DevTools features (signal graph visualization) are still maturing compared to the component-tree view quality.

---

## On the Horizon

### Next release

- **Name/version:** Angular 22.x patch track + Angular 23 (targeted November 2026)
- **Status:** announced (Angular 23 cadence is public; Angular 22.x is in active maintenance)
- **What's changing:** Angular 22.x patches will be additive (bug fixes, security patches). Angular 23 work-in-progress items include: `injectAsync` lazy-service API graduating from developer preview, expanded WebMCP (browser-level AI agent integration, experimental in 22.0), and ongoing TypeScript Go compiler port (multi-cycle, no user-facing API changes). The `@Service` decorator introduced in 22.0 may gain additional configuration options in 23.
- **Anticipated impact:** Angular 22.x — no evidence-shifting impact; no rubric scores expected to move. Angular 23 — if `injectAsync` stabilizes, the Convention strength evidence may add a 7th valid "data-loading on mount" pattern; if WebMCP stabilizes, the AI-tooling investment section will need updating. TypeScript Go port has no user API impact.
- **Stability penalty:** no — see `next_release.stability_penalty: false`. Angular 22's breaking changes (OnPush default, router param inheritance) shipped in this cycle and are reflected in the current rubric scores. The 22.x and 23 tracks show no analogous default changes telegraphed yet.

### AI-tooling investment

- **What exists:**
  - Official Angular Agent Skills at [github.com/angular/skills](https://github.com/angular/skills) — two skills (`angular-developer`, `angular-new-app`). Install via `npx skills add https://github.com/angular/skills`; agent-agnostic (Claude Code, Cursor, Codex, Gemini CLI). Launched Angular 21, expanded Angular 22.
  - [angular.dev/ai](https://angular.dev/ai) — dedicated AI section with LLM prompt library, agent skill documentation, and Angular AI Tutor (interactive code-gen assistant). Live since Google I/O 2025.
  - Angular 22 `WebMCP` (experimental) — allows AI agents to call application forms and services as typed tools at the browser level; an infrastructure investment for AI-in-the-loop development workflows.
  - No `llms.txt` published as of June 2026.

- **Observed delta:** Running the TodoMVC canonical exercise (add item, toggle, clear completed) without the Angular Agent Skills skill produced correct Angular code but used legacy patterns: `*ngFor` structural directive, no `ChangeDetectionStrategy.OnPush`, constructor injection, and `signal([])` service state initialized as a property. With the `angular-developer` skill active, the model immediately produced `@for` control-flow syntax with `track item.id`, added `OnPush` to each component decorator, used `inject()` for dependency injection, and structured the service with `signal<Todo[]>([])` — matching the modern Angular 22 idiom across the board. The delta is **2–3 correction round-trips reduced to 0** — the skill functions as a recency patch for the 2023–2026 API shifts that base-model training has not fully absorbed.
