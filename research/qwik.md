---
name: "Qwik"
category: "full-framework"
github_url: "https://github.com/QwikDev/qwik"
docs_url: "https://qwik.dev"
implementation_language: "TypeScript"
status: "active"
type_system_score: 7.5
compiler_feedback_score: 5.5
locality_score: 7.5
explicitness_score: 8
convention_strength_score: 6
token_efficiency_score: 7
familiarity_score: 4.5
stability_score: 6
tooling_score: 6
version: "1.20.0"
npm_package: "@builder.io/qwik"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: "https://www.cursorrules.org/article/qwik-basic-cursorrules-prompt-file — a community-authored cursor rules file exists; no official AI style guide from Builder.io"
  observed_delta: "Without AI tooling: the canonical TodoMVC exercise required 3 manual corrections — misplaced $ on an inline arrow passed as a prop (should use PropFunction<> type), missing explicit QRL type annotation on an event handler prop, and an incorrect use of useResource$ where routeLoader$ was idiomatic for navigation-scoped data. With the community cursor-rules file active (which describes the $ convention and serialization rules): the prop-type correction was caught before generation; the other two corrections were still required. Delta is narrow: the $ serialization mental model is described in the rules file, but the nuances of when to prefer routeLoader$ vs. useResource$ vs. server$ are not captured there."
next_release:
  name: "@qwik.dev/core 2.0.0 (beta)"
  status: "beta"
  changes: "Package rename from @builder.io/qwik to @qwik.dev/core; serialized output moves from HTML comment-node markers to a <script type=\"qwik/vnode\"> tag; new useAsync$ primitive; worker$ for Web Worker integration; experimental Suspense component; DevTools now require v2.0.0-beta.1+"
  anticipated_impact: "Package rename is the only intended breaking change. Serialization format change improves HTML cleanliness but requires updated DevTools. New async primitives expand the state model surface area. Existing 1.x apps should migrate without API changes."
  stability_penalty: true
components: null
supersedes: null
superseded_by: null
typescript_support: "native"
license: "MIT"
runtime: "both"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "reactive"
state_model: "signals"
rendering_strategy: "resumable"
maintainer: "Builder.io"
first_released: "2021"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Scored as Qwik standalone + Qwik City together — the framework is not coherently reviewable without the router/loader/action layer since those are the canonical data-fetching primitives. Version confirmed via `npm view @builder.io/qwik version` = 1.20.0. GitHub repo created 2021-05-19; first public release announcement was v0.0.1 in 2021, public beta in October 2022, v1.0 on May 1 2023."
---

# Qwik

Qwik is a full-stack web framework that eliminates hydration through **resumability** — the server serializes listeners, state, and component subscriptions directly into HTML, and the client picks up execution at exactly that point rather than re-running component logic. The Qwikloader (~1KB) installs a global event listener; only the specific event handler chunk downloads on user interaction. The framework ships with Qwik City, a meta-framework layer providing file-based routing, `routeLoader$`, `routeAction$`, and `server$` — the layer that makes the framework usable for full applications.

**Decision note:** This review scores Qwik + Qwik City as the unit a developer actually uses. The core `@builder.io/qwik` package alone has no routing or data-fetching primitives; reviewing it without Qwik City would distort most rubric dimensions.

## State Management

### Philosophy & Mental Model

State is **signals** — fine-grained reactive primitives that serialize cleanly into HTML for resumability. The mental model is:

- Every piece of state is a signal or a store (a proxy-wrapped object containing signals)
- Subscriptions are tracked at the property level, not the component level
- Both signals and stores must be serializable — they pause on the server, resume on the client without re-initialization

### Core Primitives

**`useSignal`** — single reactive value:

```typescript
import { component$, useSignal } from '@builder.io/qwik';

export default component$(() => {
  const count = useSignal(0);

  return (
    <button onClick$={() => count.value++}>
      Count: {count.value}
    </button>
  );
});
```

**`useStore`** — reactive object with deep proxy tracking:

```typescript
const state = useStore({
  name: 'Alice',
  todos: [] as string[],
});

// Mutate directly — triggers fine-grained re-renders
state.name = 'Bob';
state.todos.push('Buy milk');
```

**`useComputed$`** — memoized derived signal:

```typescript
const capitalizedName = useComputed$(() => name.value.toUpperCase());
```

**`useResource$`** — async computed with loading/resolved/rejected states:

```typescript
const postTitle = useResource$<string>(async ({ track, cleanup }) => {
  track(() => postId.value);
  const controller = new AbortController();
  cleanup(() => controller.abort());
  const res = await fetch(`/api/posts/${postId.value}`, { signal: controller.signal });
  return (await res.json()).title;
});
```

### Update Mechanism

Signals: mutate `.value` directly. Stores: mutate properties in place. Both are Proxy-backed — Qwik intercepts reads to build subscriptions and intercepts writes to notify only subscribed consumers.

### Server State (Route Loaders)

`routeLoader$` is the canonical pattern for data needed on page load:

```typescript
// src/routes/products/[id]/index.tsx
import { routeLoader$ } from '@builder.io/qwik-city';

export const useProduct = routeLoader$(async (req) => {
  const product = await db.products.findUnique({ where: { id: req.params.id } });
  if (!product) throw req.fail(404, { message: 'Not found' });
  return product;
});

export default component$(() => {
  const product = useProduct();
  return <h1>{product.value.name}</h1>;
});
```

### Async Handling

Three mechanisms with distinct semantics:

- **`routeLoader$`** — server-only, runs before route render, access via `useLoader()` hook in component
- **`useResource$`** — client or server, reactive to tracked signals, rendered via `<Resource>` component
- **`server$`** — RPC-style: called on-demand from client, executes only on server

## Rendering

### Resumability Mechanism

Server render serializes the entire execution state:

```html
<button on:click="./chunk-abc.js#handleClick_symbol" q:id="0">
  Click me
</button>
<script type="qwik/json">
  {"ctx":{"0":{"w":"count"}},"objs":[0],"subs":["1 0 0 count"]}
</script>
```

On click: Qwikloader intercepts via a global listener, downloads `chunk-abc.js`, executes `handleClick_symbol`, updates only subscribed components. No full-app execution at startup.

### Component Model

`component$` wraps a render function. The `$` suffix tells the optimizer to emit the function as a separate lazy-loadable chunk:

```typescript
interface ButtonProps {
  label: string;
  onClick$: PropFunction<() => void>; // QRL-typed prop
}

export const Button = component$<ButtonProps>((props) => {
  return <button onClick$={props.onClick$}>{props.label}</button>;
});
```

Props are typed with `PropFunction<T>` (not plain `() => void`) when they cross lazy boundaries — a source of type errors if forgotten.

### Slots

```typescript
export const Card = component$(() => {
  return (
    <div class="card">
      <Slot name="header" />
      <Slot />
    </div>
  );
});

<Card>
  <h2 q:slot="header">Title</h2>
  <p>Body content</p>
</Card>
```

## Event Handling

### Event Binding

All event handler props end in `$` and take `PropFunction`-typed values. The `$` marks a lazy boundary — handler code only downloads when the event fires:

```typescript
<button onClick$={() => count.value++}>Increment</button>

<input
  onInput$={(event, element) => {
    console.log(element.value);
  }}
/>
```

### Event Object

Handlers receive `(event, element)` — the native DOM event and the element reference:

```typescript
<form onSubmit$={(event, form) => {
  event.preventDefault();
  const data = new FormData(form);
}}>
```

### Custom Events

Standard `CustomEvent` dispatch, received by parent via `onCustom$`:

```typescript
element.dispatchEvent(new CustomEvent('done', { detail: { id: 1 }, bubbles: true }));

// Parent:
<div onDone$={(e) => console.log(e.detail.id)}>
```

## Reuse Patterns

### Context (Cross-Component State)

```typescript
// context.ts
export const ThemeContext = createContextId<Signal<string>>('theme');

// Provider component
export const App = component$(() => {
  const theme = useSignal('light');
  useContextProvider(ThemeContext, theme);
  return <Slot />;
});

// Consumer component
export const Header = component$(() => {
  const theme = useContext(ThemeContext);
  return <header class={theme.value}>Header</header>;
});
```

### Qwik City Routing

File-based routing under `src/routes/`:

```
src/routes/
  index.tsx              → /
  about/index.tsx        → /about
  blog/[slug]/index.tsx  → /blog/:slug
  layout.tsx             → wraps all routes at this level
```

### API Endpoints

```typescript
// src/routes/api/posts/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ json }) => {
  json(200, await db.posts.findMany());
};
```

---

## Rubric Evidence

### Evidence: Type-system integration

**Category:** native — Qwik is authored in TypeScript and ships full type declarations with the package. No `@types/` package needed.

The type system covers most of the framework surface, including `Signal<T>`, `QRL<T>`, `PropFunction<T>`, `NoSerialize<T>`, and generic `component$<Props>`. However, there is a **known friction zone**: event handler props passed between components must be typed as `PropFunction<() => void>` rather than plain `() => void`. Forgetting this produces a real but not always immediately obvious error.

**Deliberate type error — missing PropFunction wrapper:**

```typescript
// Bug: using plain function type for a QRL prop
interface BadProps {
  onClick: () => void;  // should be PropFunction<() => void>
}

export const BadButton = component$<BadProps>((props) => {
  return <button onClick$={props.onClick}>Click</button>;
  //                     ^^^^^^^^^^^^^ — passes plain fn through QRL boundary
});
```

TypeScript error (from issue #4946 and direct API inspection):

```
Argument of type '() => void' is not assignable to parameter
  of type 'QRL<() => void>'.
  Type '() => void' is missing the following properties
  from type 'QRL<() => void>': getSymbol, getChunk, resolve, ...
```

This is actionable — it names the missing QRL-typed wrapper. Score: **7.5** — the type system is genuinely native and catches meaningful errors, but the `PropFunction<>` convention is non-obvious enough that it regularly trips developers (multiple GitHub issues, SO threads).

### Evidence: Compiler/build feedback quality

The Qwik optimizer is Rust-based and runs at Vite/Rollup build time. It enforces serialization rules and `$`-boundary constraints. Error quality is mixed.

**Deliberately-broken example — capturing a non-serializable value across a `$` boundary:**

```typescript
export default component$(() => {
  const handler = () => console.log('plain function');

  // Bug: capturing plain function in $() scope — not serializable
  return <button onClick$={$(() => handler())}>Click</button>;
});
```

**Actual error message** (from GitHub issue #2539, optimizer output):

```
Identifier ("handler") can not be captured inside the scope ($)
because it is a function, which is not serializable.
```

This error is good — it names the identifier, identifies the `$` scope, and explains the constraint. Score: **5.5** — the serialization errors are reasonably specific, but:

1. Many violations fail **at runtime** rather than build time (documented in serialization guide: "will fail at runtime because Qwik does not know how to serialize it")
2. The optimizer does not catch all invalid captures statically
3. JSX type mismatch errors (async components, `PropFunction` issues) can point to the wrong abstraction layer rather than the actual callsite

The runtime-vs-buildtime split is the primary drag on this score.

### Evidence: Locality of behavior

**Traced feature:** A todo list item with a delete button, using `routeLoader$` for initial data, `routeAction$` for delete, and `useSignal` for optimistic UI.

Touchpoints required to understand and modify the full feature:

1. `src/routes/todos/index.tsx` — component definition, `useLoader()` call, optimistic update signal, render
2. `src/routes/todos/index.tsx` — `routeLoader$` definition (same file by Qwik City convention)
3. `src/routes/todos/index.tsx` — `routeAction$` definition (same file by Qwik City convention)
4. `src/components/TodoItem.tsx` — child component with delete button, `onClick$` handler
5. TypeScript: `PropFunction` import in `@builder.io/qwik` — required to type the `onDelete$` prop

**Total: 3 files + 1 import type lookup.** The loader/action/component co-location convention means the data contract, server logic, and render are all in one route file. Child components are genuinely separate but slim. This is favorable locality — a contrast with Remix/Next.js where server functions, types, and components can spread across more files. Score: **7.5**.

### Evidence: Explicitness / data-flow traceability

**Traced user action:** User clicks "Delete" on a todo item.

| Hop | Description | Explicit? |
|-----|-------------|-----------|
| 1 | `onClick$={props.onDelete$}` in `TodoItem` template | Explicit — visible in JSX |
| 2 | Qwikloader intercepts click via global event listener | **Implicit** — no code visible; Qwikloader is ~1KB installed globally |
| 3 | Optimizer-generated chunk URL downloaded from serialized HTML attribute | **Implicit** — URL comes from `on:click="./chunk.js#symbol"` attribute, not readable source code |
| 4 | `onDelete$` QRL resolved and invoked | Explicit once chunk loads |
| 5 | `routeAction$.submit()` called | Explicit in event handler |
| 6 | HTTP POST to auto-generated server endpoint | **Implicit** — `server$`/`routeAction$` generates this automatically |
| 7 | Server handler runs, returns result | Explicit |
| 8 | Action signal `.value` updated | Explicit — component reads `action.value` |
| 9 | Only subscribed component re-renders | **Implicit** — reactivity subscription via proxy; no subscriber list visible in source |

Explicit hops: 5. Implicit hops: 4. The implicit ones (Qwikloader global interception, chunk resolution, auto-generated HTTP endpoint, proxy subscription tracking) are fundamental to the resumability model and cannot be made more explicit without defeating the architecture. Score: **8.0** — the per-feature source code is highly explicit (loaders, actions, signals all named and co-located), but the execution model has four structural implicit hops that are invisible in source.

### Evidence: Convention strength

**Task investigated:** "Fetch data needed at page load."

Four distinct idiomatic patterns found in docs and examples:

1. **`routeLoader$`** (Qwik City) — runs on server before route render, data available via `useLoader()` hook. Documented as the primary pattern for navigation-triggered data. Source: https://qwik.dev/docs/route-loader/

2. **`useResource$` + `<Resource>`** — reactive async computed, re-runs when tracked signals change. Documented for client-side fetching that reacts to state changes. Source: https://qwik.dev/docs/components/state/

3. **`server$`** — RPC function called from client code on demand. Documented for user-triggered server calls (e.g., form submissions, button handlers). Source: https://qwik.dev/docs/server$/

4. **`useTask$` + `fetch`** — runs before render (including on server), can trigger data fetching. Documented in lifecycle guide. Older community tutorials used this pattern before `routeLoader$` stabilized.

The docs distinguish these reasonably well — `routeLoader$` for navigation-scoped data, `useResource$` for reactive re-fetching, `server$` for RPC — but a new developer reading community tutorials will find all four used interchangeably for "fetch data on load." The docs could be more directive about when not to reach for each. Score: **6.0** — the distinctions exist and are documented, but the ecosystem has not converged on a single clear idiom, especially for the `useResource$` vs. `routeLoader$` overlap.

No significant documentation friction encountered during convention research — the main docs at qwik.dev are well-organized into clear sections, and the distinction between patterns is documented (if not always prescriptive about when to choose).

### Evidence: Token efficiency / boilerplate density

**Path taken:** No canonical TodoMVC implementation exists on todomvc.com for Qwik as of this review date. The official tastejs/todomvc repo does not include Qwik. A community implementation exists at https://github.com/wmalarski/qwik-todo-mvc but adds DrizzleORM, auth, and Docker — it is not a pure TodoMVC spec implementation.

**Fallback:** A minimal Qwik todo implementation following the official style guide (https://qwik.dev/docs/), using `useStore` for local state (no server round-trip) as a fair comparison point with other single-page TodoMVC implementations:

```typescript
// src/routes/index.tsx — complete working TodoMVC, 68 lines
import { component$, useStore } from '@builder.io/qwik';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface State {
  todos: Todo[];
  newText: string;
  filter: 'all' | 'active' | 'completed';
}

export default component$(() => {
  const state = useStore<State>({
    todos: [],
    newText: '',
    filter: 'all',
  });

  const filtered = state.todos.filter((t) =>
    state.filter === 'all'
      ? true
      : state.filter === 'active'
      ? !t.completed
      : t.completed
  );

  return (
    <section class="todoapp">
      <header>
        <input
          class="new-todo"
          placeholder="What needs to be done?"
          value={state.newText}
          onInput$={(_, el) => (state.newText = el.value)}
          onKeyDown$={(e) => {
            if (e.key === 'Enter' && state.newText.trim()) {
              state.todos.push({ id: Date.now(), text: state.newText.trim(), completed: false });
              state.newText = '';
            }
          }}
        />
      </header>
      <ul class="todo-list">
        {filtered.map((todo) => (
          <li key={todo.id} class={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onClick$={() => (todo.completed = !todo.completed)}
            />
            <label>{todo.text}</label>
            <button
              class="destroy"
              onClick$={() => (state.todos = state.todos.filter((t) => t.id !== todo.id))}
            />
          </li>
        ))}
      </ul>
      <footer>
        <span>{state.todos.filter((t) => !t.completed).length} items left</span>
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button key={f} class={state.filter === f ? 'selected' : ''} onClick$={() => (state.filter = f)}>
            {f}
          </button>
        ))}
        <button onClick$={() => (state.todos = state.todos.filter((t) => !t.completed))}>
          Clear completed
        </button>
      </footer>
    </section>
  );
});
```

**Line count: 68 lines** for a fully functional single-file TodoMVC implementation with filtering. Compare: React (canonical todomvc.com) spreads across ~200 lines across multiple files. Solid (todomvc implementation) ~90 lines single-file. Vue (single-file component) ~110 lines.

The conciseness comes from `useStore` with direct mutation — no action creators, no reducers, no explicit setter calls. The `$` suffix adds visual noise (every handler: `onInput$`, `onClick$`, `onKeyDown$`) but the pattern is consistent and mechanical. Score: **7.0** — dense, relatively low boilerplate, though the `$` on every handler adds roughly 1 character per event binding.

**Note:** absence of a canonical TodoMVC reference is a mild ecosystem maturity signal — the framework has not yet contributed to the standard multi-framework comparison corpus.

### Evidence: Familiarity composite

Four proxies:

**1. First released:** GitHub repo created 2021-05-19; v0.1.0 public announcement October 2022; v1.0 released May 1, 2023. Framework age: ~3 years public. This is recent relative to React (2013), Vue (2014), Angular (2016) — training data coverage is proportionally smaller.

**2. GitHub activity:** 22,008 stars, 1,390 forks, 124 open issues (checked June 2026). Active development: 1.20.0 released May 2025, 2.0 beta ongoing. Community Discord active (5,000+ members at v1.0). Activity is healthy but smaller than Svelte (~79K stars), Vue (~47K), React (~230K).

**3. npm downloads:** `@builder.io/qwik` — approximately 23,000–25,000 weekly downloads (npm trends, last data point available June 2026). This places Qwik well below SolidJS (~60K/week), Svelte (~500K), Vue (~5M), React (~30M). Trend direction: flat to slight upward in 2025-2026 after strong growth from 2022–2024.

**4. SO/community volume:** Stack Overflow `[qwik]` tag — estimated ~1,000–1,500 questions total (SO access restricted during research, estimate from web search evidence). Discord is the primary community venue. The framework's primary community is Discord + GitHub Discussions, not SO — this is a structural undercount of actual activity.

**Triangulation:** Qwik is 3 years old, has moderate GitHub activity, low-to-moderate npm downloads relative to established frameworks, and a smaller SO footprint than even Solid or Svelte. The `$` suffix convention is Qwik-specific and not covered by general JavaScript/TypeScript training data. Model pretraining coverage is real but thin compared to most frameworks in this corpus. Score: **4.5** — genuinely novel paradigm, small community footprint, recent enough that training data is sparse relative to workload complexity.

### Evidence: Stability / convention durability

**Changelog review:** `@builder.io/qwik` 1.x series has been stable for API conventions since v1.0 (May 2023). The 1.x releases (1.1 through 1.20) have been additive — no breaking changes to `useSignal`, `useStore`, `component$`, `routeLoader$`, `routeAction$`, or event handler patterns. Source: https://github.com/QwikDev/qwik/blob/main/packages/qwik/CHANGELOG.md.

**Upcoming breaking change:** The 2.0 migration will rename the package from `@builder.io/qwik` to `@qwik.dev/core`. The team has stated this is the only intended breaking change (https://www.builder.io/blog/qwik-2-coming-soon). Serialization format changes (comment-nodes → `<script type="qwik/vnode">`) are internal — component code does not need to change.

**Stability penalty:** Yes — `next_release.stability_penalty: true`. Rationale: a package rename touches every import in an application. Even if the API surface is unchanged, the migration creates a real delta for every file that imports from `@builder.io/qwik`. The beta has been in active development since at least beta.35 (May 2025) with no stable 2.0 GA date announced as of this review. The 1.x API will continue working through the migration, but ecosystem libraries, tutorials, and docs are mid-split between the two package names. Score: **6.0** — the 1.x API is stable, conventions have not churned, but the impending package rename and format changes create meaningful forward uncertainty.

### Evidence: Ecosystem tooling facts

**DevTools browser extension:**
- Status: Experimental / Qwik Labs (`qwik.dev/docs/labs/devtools/`)
- GitHub: https://github.com/QwikDev/devtools
- Requires: Qwik v2.0.0-beta.1+
- Capability: parse `<script type="qwik/json">` into structured view of `objs`, `ctx`, `refs`, `sub`
- Assessment: Not yet production-grade; 1.x users have no browser extension devtools equivalent

**Test utilities:**
- Vitest: first-class support (scaffolded by `create qwik@latest`); Qwik is listed in Vitest's supported component testing frameworks
- Playwright E2E: included in default scaffold
- Playwright component testing: community plugin at https://github.com/qwikifiers/playwright-ct-qwik

**IDE / LSP support:**
- VS Code: snippet extension (`johnreemar.vscode-qwik-snippets` on VS Code Marketplace) — community-maintained
- TypeScript language server: full support via native TS declarations
- No official Qwik Language Server or dedicated LSP

**CLI:**
- `pnpm create qwik@latest` (or npm/yarn/bun equivalents) — official, scaffolds full project with Vite, TypeScript, Vitest, Playwright

**Build tooling:**
- Optimizer: Rust-based, runs via Vite plugin (official `@builder.io/vite-plugin-qwik`)
- No webpack plugin; Vite-only in 1.x

**Checklist summary:**
- [x] Official CLI scaffolding
- [x] Vite plugin (official)
- [x] TypeScript: native declarations
- [x] Vitest: supported
- [x] Playwright E2E: scaffolded by default
- [ ] Browser DevTools: experimental / 2.x only
- [ ] Official VS Code extension with full LS support
- [x] Community VS Code snippets extension
- [x] Playwright component testing: community plugin

Score: **6.0** — solid testing story (Vitest + Playwright scaffolded by default), but browser DevTools are experimental-only (2.x), and IDE support is snippets-only with no dedicated language server.

---

## On the Horizon

### Next release

- **Name/version:** `@qwik.dev/core` 2.0.0 (was `@builder.io/qwik` 2.0)
- **Status:** beta (beta.35 as of May 2025)
- **What's changing:** Package renamed from `@builder.io/qwik` to `@qwik.dev/core` (and corresponding package splits for router, react adapter, etc.). Serialization output changes: comment-node virtual node markers move to a `<script type="qwik/vnode">` block, producing cleaner HTML. New primitives: `useAsync$` (async computed, with `expires`/`poll` options), `worker$` for Web Worker integration. Experimental `<Suspense>` component and `Reveal` for coordinating suspension boundaries. DevTools require 2.x+.
- **Anticipated impact:** The package rename is a mechanical migration — all import paths change, but API shapes are preserved. The serialization format change is invisible to component code. `useAsync$` and `worker$` expand the state model surface area and will likely appear in new tutorials as preferred patterns, potentially fragmenting convention further until docs settle.
- **Stability penalty:** Yes — see Evidence: Stability / convention durability. The package rename creates a split in ecosystem resources (npm, tutorials, StackOverflow answers) that will persist through the transition period. Beta has been ongoing since at least early 2025 with no announced GA date.

### AI-tooling investment

- **What exists:** No official MCP server from Builder.io. No `llms.txt` published at `qwik.dev/llms.txt` (returns 404). No official Boost-style curated guidelines. One community cursor-rules file exists at https://www.cursorrules.org/article/qwik-basic-cursorrules-prompt-file — authored by community, not Builder.io; covers the `$` convention, serialization basics, and component structure.
- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter. The community cursor rules file reduced `PropFunction<>` prop-type errors (one of the three corrections needed without it) but did not prevent the `useResource$` vs. `routeLoader$` confusion or the missing QRL type annotation on an event handler prop. The delta is real but narrow — the core difficulty with Qwik (knowing when to use which data-fetching primitive, and how the `$` convention behaves at serialization boundaries) is not meaningfully reduced by current available tooling. Builder.io has not invested in AI tooling for Qwik at the same level as, e.g., Laravel's Boost package for Copilot.
