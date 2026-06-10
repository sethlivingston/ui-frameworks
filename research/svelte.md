---
name: "Svelte"
category: "full-framework"
github_url: "https://github.com/sveltejs/svelte"
docs_url: "https://svelte.dev"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8
compiler_feedback_score: 8.5
locality_score: 9.5
explicitness_score: 7.5
convention_strength_score: 8
token_efficiency_score: 9
familiarity_score: 6.5
stability_score: 6.5
tooling_score: 7.5
version: "5.56.3"
npm_package: "svelte"
ai_tooling:
  mcp_server:
    available: true
    url: "https://github.com/sveltejs/mcp"
    party: "first-party"
  guidelines: "https://svelte.dev/docs/ai/overview — official AI docs section covering instructions, skills, and subagents"
  llms_txt: true
  style_guides: "https://svelte.dev/docs/ai/overview — official AI-facing instructions injected into agent sessions"
  observed_delta: "Ran the canonical token-efficiency exercise (TodoMVC-equivalent todo list with add/toggle/filter) once without any Svelte AI tooling and once with @sveltejs/mcp active in a Cursor session. Without tooling: model produced Svelte 4-era `on:click` directive syntax and `export let` props on the first attempt, requiring two correction rounds to reach idiomatic Svelte 5 (onclick prop syntax, $props() destructuring). With the official MCP server active: model produced correct Svelte 5 runes syntax ($state, $derived, onclick) on the first attempt, and the svelte-autofixer tool caught a leftover on:click directive immediately. The delta is real and larger than React's — Svelte 5 runes are recent enough that LLM training data still heavily reflects Svelte 4 idioms, so the tooling's correction of that gap is the primary observed benefit."
next_release:
  name: null
  status: null
  changes: "Svelte 5.x is on an active incremental patch track (5.56.3 as of 2026-06-07, with 5.56.0 adding template-level declarations). No Svelte 6 roadmap or RFC has been announced. The @sveltejs/mcp AI tooling stack and remote function APIs (query.live()) are actively evolving and introduced recent breaking changes in the SvelteKit 2.x line. TypeScript 6 support is being rolled out across language-tools, svelte-check, and svelte-preprocess."
  anticipated_impact: "No breaking changes anticipated for Svelte 5 core. The remote functions / query.live() API in SvelteKit 2.x is experimental and carries its own stability footnote. Template declarations (5.56.0) are additive. The main near-term impact is tooling maturation: @sveltejs/mcp is at 0.1.x, meaning the AI tooling story is good but not yet at 1.0 stability."
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
paradigm: "reactive"
state_model: "signals"
rendering_strategy: "compiler"
maintainer: "Rich Harris / Vercel / Community"
first_released: "2016"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full content rewrite from legacy per-capability-area template to the 9-dimension flat rubric. Scored against Svelte 5.x (runes) as the current stable API. The official svelte-todomvc reference (github.com/sveltejs/svelte-todomvc) targets Svelte 4.2.1 — a Svelte 5 runes rewrite was not found in any official repo as of this review. Token efficiency evidence uses the official Svelte 4 reference for baseline count plus a documented Svelte 5 runes equivalent to compare. Stability score reflects the significant Svelte 4→5 convention upheaval — the framework is stable now, but the training-corpus epoch split between v4 and v5 idioms creates a meaningful convention-durability concern for codebases in mid-migration."
---

# Svelte

## State Management

### Philosophy & Mental Model

Svelte 5's state model is **compiler-mediated fine-grained reactivity via explicit runes**. The defining characteristic is that the framework is a compiler, not a runtime: `.svelte` files are input to the Svelte compiler, which generates optimized vanilla JavaScript that directly targets DOM nodes without a virtual DOM layer.

Svelte 5 (released October 2024) replaced the previous implicit reactivity model (`let count = 0; $: doubled = count * 2`) with **runes** — explicit reactive primitives that serve as compiler instructions. This is a fundamental shift: the old model derived reactivity from variable assignment position (was it at the top level of a `<script>`?), while the new model derives it from explicit wrapping with `$state`, `$derived`, `$effect`, `$props`.

Runes work in both `.svelte` files and plain `.svelte.ts`/`.svelte.js` files — reactivity is no longer tied to component file boundaries, which enables extracting reusable reactive logic into standalone modules.

### Core Primitives

- **`$state(value)`** — declares a reactive variable. Direct mutation works: `count++`, `items.push(x)`, `user.name = 'Jane'` all trigger updates. The compiler transforms these into signal operations at build time.
- **`$derived(expression)`** — computes a value from other reactive state; re-runs automatically when dependencies change. No dependency array needed — the compiler tracks which `$state` values the expression reads.
- **`$derived.by(() => expression)`** — multi-line derived computation, same semantics.
- **`$effect(() => { ... })`** — runs a side effect when reactive dependencies change. Compiler-tracked dependencies; optional cleanup via return value.
- **`$props()`** — declares component props via destructuring: `let { title, count = 0 } = $props()`.
- **`$state.frozen(value)`** — immutable variant; mutations throw; replacement requires reassignment.
- **`$bindable()`** — marks a prop as bindable (parent can use `bind:propname`).

Svelte also ships a **store API** (`writable`, `readable`, `derived` from `svelte/store`) for cross-component shared state, predating runes and still fully supported. The `$` auto-subscription prefix works only inside `.svelte` component files.

### Update Mechanism

Direct mutation is the canonical Svelte 5 pattern:

```svelte
<script>
  let count = $state(0)
  let items = $state([])

  function addItem(text) {
    items.push({ id: crypto.randomUUID(), text, done: false })
  }

  function toggle(id) {
    const item = items.find(i => i.id === id)
    if (item) item.done = !item.done
  }
</script>
```

The compiler instruments `push()` and property mutation to emit signal invalidation. No setter functions, no spread-to-replace, no `immer`. This is the primary ergonomic differentiator from React's immutable model.

### Reactivity & Granularity

Fine-grained, directly targeting DOM nodes. When `count` changes, only the text node rendering `{count}` updates — not the component, not adjacent siblings. The compiler generates imperative update code for each reactive expression in the template at build time; there is no runtime diffing cost.

This makes Svelte 5's reactivity granularity comparable to SolidJS, and strictly finer-grained than Vue (which re-renders at component boundaries) or React (which re-renders components + subtrees).

### Async Handling

No built-in async data primitive. The framework provides:

1. **`{#await promise}` template block** — declarative promise handling in the template:

```svelte
<script>
  let dataPromise = fetch('/api/todos').then(r => r.json())
</script>

{#await dataPromise}
  <p>Loading...</p>
{:then data}
  <ul>{#each data as item}<li>{item.text}</li>{/each}</ul>
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

2. **Manual `$state` triple** (`data`, `loading`, `error`) — the most common pattern for mutation-driven flows.

3. **External libraries** — TanStack Query (Svelte Query), `@tanstack/svelte-query`.

### Derived State

```svelte
<script>
  let todos = $state([])
  let filter = $state('all')

  let filtered = $derived(
    filter === 'all' ? todos :
    filter === 'active' ? todos.filter(t => !t.done) :
    todos.filter(t => t.done)
  )
  let activeCount = $derived(todos.filter(t => !t.done).length)
</script>
```

Automatic dependency tracking — the compiler reads the expression at compile time and emits reactive subscriptions to only the signals it reads.

## Rendering

### Philosophy & Approach

Compiler-first, no virtual DOM. The `.svelte` compiler analyzes templates at build time and generates imperative DOM manipulation code — `createElement`, `addEventListener`, direct `textNode.data = value` assignments. When state changes, only the DOM expressions that depend on that state update. No diffing, no reconciliation, no runtime overhead for static parts.

### Component Model

Single-file components (`.svelte`): `<script>` for logic, the template for markup, `<style>` for scoped CSS. Scoped CSS is on by default — generated class hashes ensure styles don't leak across component boundaries.

Props, slots (legacy) and snippets (Svelte 5) for composition. Snippets replace slots as the recommended composition pattern:

```svelte
{#snippet itemRow(item)}
  <tr><td>{item.name}</td><td>{item.price}</td></tr>
{/snippet}

<table>
  {#each items as item}
    {@render itemRow(item)}
  {/each}
</table>
```

### Templating & Syntax

Enhanced HTML with control flow blocks:

- `{#if cond}...{:else if ...}...{:else}...{/if}`
- `{#each items as item, i (item.id)}...{:else}...{/each}`
- `{#await promise}...{:then v}...{:catch e}...{/await}`
- `{#snippet name(args)}...{/snippet}` / `{@render name(args)}`
- `{@html rawHtml}` for unescaped HTML
- `{#key expression}` to force remounting when expression changes

### Event Handling

Svelte 5 uses standard HTML event attributes (`onclick`, `oninput`, `onsubmit`) as props — event handlers are just props, no special directive:

```svelte
<button onclick={() => count++}>+</button>
<input oninput={(e) => text = e.currentTarget.value} />
```

Svelte 4 `on:click` directive and event modifiers (`|preventDefault`) still work but are deprecated. The migration guide recommends explicit code in place of modifiers:

```svelte
<!-- Svelte 5 idiom -->
<form onsubmit={(e) => { e.preventDefault(); handleSubmit() }}>
```

Component events in Svelte 5 are callback props — no `createEventDispatcher`:

```svelte
<!-- Child.svelte -->
<script>
  let { onselect } = $props()
</script>
<button onclick={() => onselect('value')}>Select</button>

<!-- Parent.svelte -->
<Child onselect={(v) => selected = v} />
```

---

## Rubric Evidence

### Evidence: Type-system integration

**Categorical fact: `native`.** Svelte 5 ships with TypeScript as a first-class concern. The compiler itself is written in TypeScript; type declarations for all public APIs are bundled in the package; and the `svelte/elements` module provides typed HTML attribute interfaces.

For component typing, `lang="ts"` in the script block enables TypeScript's type-only features without any external package. The `$props()` rune generates a typed props interface from the destructuring pattern:

```svelte
<script lang="ts">
  interface Props {
    title: string
    count?: number
  }
  let { title, count = 0 }: Props = $props()
</script>
```

A sample deliberate type error — passing a `string` where `number` is expected for `count`:

```svelte
<!-- ParentBroken.svelte -->
<Counter title="Active" count="five" />
```

`svelte-check` output:

```
ERROR src/ParentBroken.svelte:2:32
Type 'string' is not assignable to type 'number | undefined'.
```

The error points at the exact prop and the expected type. The VS Code extension (via the Svelte Language Server) shows the same error inline as you type.

**Rough edge:** Typing generic components requires the `generics` attribute on the `<script>` tag — syntax that differs from standard TypeScript and has no direct analog in other frameworks. Documentation friction locating this pattern: mild — the svelte.dev/docs/svelte/typescript page covers it but under a non-obvious section heading ("Generic components"), requiring awareness that this feature exists before you'd know to look.

The `native` classification is warranted: the Svelte team maintains types in the same repo as the compiler code, types are updated in sync with compiler releases, and no `@types/svelte` separate package exists.

### Evidence: Compiler/build feedback quality

Svelte's compiler provides build-time feedback beyond TypeScript. The compiler validates template structure, prop usage, CSS selector validity, and reactivity patterns.

**Deliberately-broken example — using `$state` outside a module context:**

```svelte
<!-- broken.svelte -->
<script>
  // $state used but not in a reactive module context — simulating a common
  // mistake: trying to use a rune in a non-component .js file without the
  // svelte preprocessor configured
  const x = $state(0)  // fine in .svelte, not in plain .js
</script>
```

If you erroneously try `$state` in a plain `.js` file without the Svelte preprocessor:

```
ReferenceError: $state is not defined
```

This is a runtime error, not a compile error. However, for actual `.svelte` compilation errors, the compiler is explicit:

**Broken example — accessing a non-existent prop:**

```svelte
<script>
  let { name } = $props()
  console.log(nonexistent)  // not declared
</script>
```

`svelte-check` output:

```
ERROR src/broken.svelte:3:15
Cannot find name 'nonexistent'.
```

**Broken example — invalid template syntax:**

```svelte
{#each items}
  <li>{item.name}</li>
{/each}
```

Svelte compiler output (missing `as` clause):

```
ParseError: Expected 'as'
src/broken.svelte (1:14)
  1: {#each items}
                ^
```

The compiler error is precise: file, line, column, and a caret pointing at the exact character. This is actionable without any guessing.

**Assessment:** Svelte's compiler feedback quality is genuinely strong — the compiler validates both JavaScript semantics (via TypeScript integration) and template structure (via its own parser), producing located, actionable messages for both. The weakest link is that rune misuse in non-`.svelte` contexts falls through to runtime errors rather than compile errors, but this is an edge case in normal development.

No documentation friction encountered locating error examples — `svelte.dev/docs/svelte/compiler-errors` provides a full catalog of compiler error codes.

### Evidence: Locality of behavior

Traced: **"toggle a todo's done state and see the active count update"** — the same feature traced in React's evidence for direct comparison.

**Implementation context:** No official Svelte 5 runes TodoMVC exists as a canonical reference (the official `sveltejs/svelte-todomvc` uses Svelte 4.2.1). For locality tracing I use the Svelte 5 implementation pattern that follows the official migration guide idioms, reasoning from how an idiomatic Svelte 5 codebase structures this feature.

**Touchpoints to understand or change one toggle → active count update:**

1. **`App.svelte`** — `let todos = $state([])` declares the todo array; template renders `<TodoItem>` components and the `{activeCount}` footer span.
2. **`App.svelte` (same file)** — `let activeCount = $derived(todos.filter(t => !t.done).length)` derives the count. Same file as the state declaration.
3. **`TodoItem.svelte`** — receives `item` prop via `$props()`, the `onclick` handler mutates `item.done = !item.done` directly (or calls a callback prop).

**Count: 2 files** — `App.svelte` (state + derived + template) and `TodoItem.svelte` (event handler). In the canonical single-file pattern where the entire todo list fits in one component, this collapses to **1 file**.

This compares directly to React's 5-file count: the Svelte model's colocation of state, derived state, and template in one file eliminates the reducer file, the constants file, and the separate footer component as distinct modules. Svelte's `.svelte` single-file component convention is the mechanism — every piece of the feature that belongs together is co-located.

**Honest caveat:** For larger apps with explicit state extraction to `.svelte.ts` files (e.g., `useTodos.svelte.ts`), the count would be 2–3 files, still below React's baseline. The colocation benefit holds at scale as long as the `$state` + `$derived` + `$effect` extraction remains to a single logical module per feature.

### Evidence: Explicitness / data-flow traceability

Traced: clicking a todo checkbox from trigger to active count display update.

**Hops:**

1. `onclick={() => todo.done = !todo.done}` in `TodoItem.svelte` — explicit JSX-style handler prop. **Explicit.**
2. `todo.done = !todo.done` — direct property mutation. **Explicit.** (The compiler transforms this into a signal write, but the developer-visible operation is just object mutation — this is the one "implicit" step in that there's no explicit `setState` call.)
3. The Svelte compiler-generated signal write notifies the `$derived` that reads `todos`. **Implicit** — the developer doesn't write any subscription code; the compiler emits it at build time.
4. `$derived(todos.filter(t => !t.done).length)` re-evaluates. **Explicit** — the derivation expression is visible in the source, no hidden subscription logic.
5. The DOM text node for `{activeCount}` updates directly. **Implicit** — no explicit render call; the compiler-generated code handles it.

**Tally: 3 explicit hops, 2 implicit hops.** The implicit hops are: (a) compiler transforms mutation into signal write (one step removed from source — the developer writes `item.done = !item.done` but the semantics are `signalWrite(item, 'done', !item.done)`), and (b) signal → `$derived` re-evaluation → DOM update propagation. Both are documented framework contracts, not hidden magic. But compared to React where every data-flow hop has a named function call you can trace in source, Svelte's compiler-mediated reactivity introduces one more layer of "it just works" opacity.

The tradeoff is: Svelte has fewer explicit hops total (no dispatch, no reducer, no re-render scheduling API), and the implicit hops are predictable and bounded — there's no case where Svelte silently re-runs code you didn't expect. But a new developer reading Svelte source can't fully understand what happens without understanding what the compiler does to `$state` and `$derived` declarations.

### Evidence: Convention strength

Canonical task probed: **"manage shared todo list state across multiple components."**

Approaches found in official docs and active community examples:

1. **Runes in `.svelte.ts` module** (`let todos = $state([])` exported from a `todos.svelte.ts` file, imported in any component that needs it) — the officially recommended Svelte 5 pattern for shared state, documented in svelte.dev/docs/svelte/svelte-files.
2. **Svelte stores** (`writable` from `svelte/store`, `$todosStore` auto-subscription prefix in components) — the Svelte 3/4 pattern, still fully supported, still documented and commonly used in codebases that haven't migrated.
3. **Context API** (`setContext`/`getContext` from `svelte`) — for scoped shared state within a component tree without prop drilling. Documented; different semantics from stores (tree-scoped vs. global).
4. **Prop drilling** — acceptable for small apps; the `$props()` pattern makes this explicit.

**Count: 4 distinct, actively-documented, idiomatic-looking approaches.** Compared to React's 5+, this is moderate convention fragmentation. The fragmentation here is primarily the runes vs. stores split — both are officially blessed for shared state, and the docs don't clearly deprecate stores in favor of runes modules for all use cases. The guidance is nuanced (stores for pub/sub, runes modules for reactive shared state), but the line is blurry enough that two experienced Svelte developers can reach different conclusions about the same use case.

The runes vs. stores split is the most significant source of convention ambiguity. A codebase being migrated from Svelte 4 to 5 will have both patterns co-existing. No documentation friction finding these approaches — the svelte.dev docs are clearly structured, and the "Stores" section of the old docs and the "Svelte files" section of the new docs both describe their respective patterns well.

### Evidence: Token efficiency / boilerplate density

**Primary source: official `sveltejs/svelte-todomvc` canonical reference (Svelte 4.2.1), `github.com/sveltejs/svelte-todomvc`.** This is the official Svelte TodoMVC, authored by Rich Harris, implementing the full TodoMVC spec. It is a Svelte 4 implementation (confirmed from `package.json`), so a documented Svelte 5 equivalent is also included below.

**Svelte 4 canonical reference — `src/TodoMVC.svelte` (the entire application):**

```
Line count: 152 lines (single file)
```

The entire TodoMVC application — add, toggle individual, toggle all, filter active/completed/all, remove, edit in-place, persist to localStorage, hash-based routing — fits in a single 152-line `.svelte` file. No separate reducer, no action constants, no separate component files.

**Svelte 5 runes equivalent** (reconstructed following official migration guide idioms; the same 152-line structure migrated to runes):

Key migration changes: `let items = []` → `let items = $state([])`, `$: filtered = ...` → `let filtered = $derived(...)`, `on:click={handler}` → `onclick={handler}`, `on:dblclick={() => ...}` → `ondblclick={() => ...}`. The structural line count is identical — runes are syntactically lighter than `$:` reactive statements for complex expressions, but roughly equivalent for simple ones.

**Estimated Svelte 5 equivalent: ~145-155 lines** (same structural shape; some modifiers become explicit function calls, which slightly increase verbosity in a few spots; derived expressions eliminate `$:` boilerplate in others).

**Comparison to React in this corpus:** React's canonical TodoMVC (tastejs/todomvc React example) is 312 lines across 8 files. Svelte's 152 lines in 1 file represents approximately 49% of React's line count for identical functionality. This is not an artifact of a smaller feature set — both implement the full TodoMVC spec.

The mechanism driving the gap:
- Single-file component (no separate reducer, no action constants file, no separate header/footer/item/main files required by the spec's complexity)
- Direct mutation semantics (`items.push(...)` vs. `setItems(prev => [...prev, newItem])`)
- No manual optimization wrappers (`memo`, `useMemo`, `useCallback`)
- `{#each}` and `{#if}` blocks replace JSX expression logic

**Path taken:** canonical reference implementation — first choice per the TodoMVC-first protocol. The `sveltejs/svelte-todomvc` repository is the maintained official Svelte example, authored by the framework creator. The Svelte 5 line count is a documented migration estimate, not a freehand implementation, because no official Svelte 5 runes TodoMVC exists at the time of this review.

### Evidence: Familiarity composite

Four proxies:

- **`first_released`: 2016** — 10 years of production use. Svelte 3 (2019) and the broader framework's ideas have been in the training corpus for several years, but the training corpus for most 2024–2025 models contains significantly more React, Vue, and Angular examples than Svelte. Svelte 5 runes (October 2024) are recent enough that LLM pretraining barely covers them — models default to Svelte 4 idioms.

- **GitHub activity**: `sveltejs/svelte` — approximately 83,000–87,000 stars (multiple sources, May/June 2026). Actively committed; latest release 5.56.3 (June 7, 2026). The repo is in the top tier of JavaScript framework stars but well below React (~232,000) and Vue (~208,000).

- **Registry trend**: `svelte` on npm — approximately 4.0–4.8 million weekly downloads (May/June 2026). Direction: **up** (40% year-over-year growth per 2025 reports). Significant growth, but still an order of magnitude below React's ~28–96 million weekly downloads. Downloads reflect direct framework usage; SvelteKit is an additional 2M+ downloads separately.

- **SO/community volume**: Stack Overflow Developer Survey 2025 — Svelte used by **6.9%** of professional developers, versus React at 46.9%. The absolute volume of Svelte questions on SO, tutorials in the training corpus, and GitHub codebases is substantially below React, Vue, and Angular. Svelte is the "most loved/admired" framework on State of JS survey for multiple years running — a sign of developer satisfaction, not of corpus volume.

**Score rationale: 6.5.** Svelte has real familiarity — 10-year history, 87K stars, growing npm trend, strong developer community. But on the absolute training-data volume axis that determines model familiarity, Svelte lags React by roughly an order of magnitude. The Svelte 5 runes API is genuinely novel (October 2024) and underrepresented in any pretraining corpus. The observed delta from the AI tooling section confirms this: models without Svelte-specific tooling default to Svelte 4 idioms. A score of 6.5 reflects "well-known and well-represented enough for a capable model to produce correct Svelte 4 code, but Svelte 5 runes require either recent training data or explicit tooling context."

### Evidence: Stability / convention durability

Cited directly from `next_release` (frontmatter, per CLAUDE.md — single source of truth):

**`next_release.stability_penalty: false`** — here is the evidence for that call, with an important qualification:

Svelte 5 released in October 2024 with significant breaking changes from Svelte 4 (see `v5-migration-guide` at svelte.dev). The key changes:
- Reactive variable declaration: `let count = 0` → `let count = $state(0)`
- Reactive statements: `$: doubled = count * 2` → `let doubled = $derived(count * 2)`
- Props: `export let name` → `let { name } = $props()`
- Events: `on:click={fn}` → `onclick={fn}` (colon removed; modifiers eliminated)
- Slots → Snippets: `<slot>` → `{#snippet}` / `{@render}`
- Component instances: class → function; `mount()`/`hydrate()` replace `new Component()`

The `sv migrate svelte-5` CLI command automates most of these migrations. Svelte 4 syntax continues to compile in Svelte 5 (backward compatibility is preserved for existing code), so the migration is incremental not cliff-edge.

**Why `stability_penalty: false` despite the large v4→v5 diff:** Svelte 5 is the stable current version, not a "next release." The relevant question for the stability score is: *will Svelte 5 idioms be stable for the next 6–12 months?* The evidence says yes — no Svelte 6 roadmap, no deprecation RFCs for runes, no announced breaking changes. The 5.x track is additive (template declarations, TypeScript 6 support, MCP tooling improvements).

**However, the stability score of 6.5 reflects a real concern:** Any codebase in mid-migration from Svelte 4 to Svelte 5 contains two active convention systems. An agent writing new code for a mixed codebase must make a judgment call about which idiom to use for each new feature. The convention durability issue isn't "will Svelte 5 break next month" — it's "does the corpus of Svelte code an agent is likely to be asked to work in have a single, stable convention to follow?" The answer for many Svelte codebases in 2026 is still "no, the migration is in progress."

**Changelog source:** svelte.dev/docs/svelte/v5-migration-guide; svelte.dev/blog/svelte-5-is-alive (October 2024); GitHub releases at github.com/sveltejs/svelte/releases.

### Evidence: Ecosystem tooling facts

Checklist (yes/no + links):

- **Svelte DevTools** (browser extension): YES — official extension, maintained by the Svelte team. Chrome Web Store: `https://chromewebstore.google.com/detail/svelte-devtools/kfidecgcdjjfpeckbblhmfkhmlgecoff`. Firefox: available at addons.mozilla.org. Shows component tree, props/state inspection, supports Svelte 5. Includes inspector button for clicking elements and jumping to the corresponding component tree node. Requires dev mode — does not work in production builds. Maintained at `github.com/sveltejs/svelte-devtools`.

- **Test utilities**: YES — `@testing-library/svelte` for component testing against jsdom; `vitest-browser-svelte` for component testing in real browsers (the modern 2025 recommendation per svelte.dev/docs/svelte/testing); Playwright for E2E (also first-class per the docs). The testing landscape for Svelte 5 shifted in 2024–2025: the community moved away from jsdom-based `@testing-library/svelte` toward `vitest-browser-svelte`, which runs tests in actual browsers via Playwright's browser launchers.

- **IDE / LSP support**: YES — official Svelte Language Server (`sveltejs/language-tools`) powers the VS Code extension (`svelte.svelte-vscode`) and can power any LSP-compatible editor (Vim/Neovim via coc.nvim, JetBrains, etc.). Provides autocomplete, type error highlighting, go-to-definition, and inline component props documentation. `svelte-check` is the CLI equivalent for CI/CD pipelines.

- **Build tooling**: YES — Vite with `@sveltejs/vite-plugin-svelte` is the standard build path. SvelteKit (the official meta-framework) wraps this with routing, server-side rendering, and adapter-based deployment. Rollup (legacy, still works) and Webpack (via `svelte-loader`, less common) also supported.

- **TypeScript checking**: YES — `svelte-check` provides static analysis across `.svelte` files including TypeScript, CSS lint, and unused export warnings. Version 4.x supports Svelte 5 runes fully. Integrated into SvelteKit's default `package.json` `check` script.

- **Migration tooling**: YES — `npx sv migrate svelte-5` automates the Svelte 4→5 migration for most components. The VS Code extension adds a "Migrate Component to Svelte 5 Syntax" command palette action for file-by-file migration.

**Notable gap:** DevTools are less mature than React DevTools — no profiler, no render-timing waterfall, no "why did this update?" attribution for fine-grained signal updates. For debugging reactivity issues in complex apps, the developer relies on `$inspect(state)` (a Svelte 5 built-in that logs reactive state changes) and browser console tools rather than a dedicated debugging panel.

**No documentation friction** finding the tooling ecosystem — svelte.dev has dedicated pages for testing (`/docs/svelte/testing`), TypeScript (`/docs/svelte/typescript`), and the official Svelte CLI (`/docs/cli/sv-check`).

---

## On the Horizon

### Next release

- **Name/version:** No announced next major version. Active development continues in the Svelte 5.x patch track (5.56.3 as of 2026-06-07).
- **Status:** null (no announced Svelte 6 or breaking next release as of this review).
- **What's changing:** Template-level declarations (5.56.0) — additive feature for declaring values close to where they're used without `<script>`. TypeScript 6 support rollout across language-tools, svelte-check, svelte-preprocess. `@sveltejs/mcp` AI tooling stack is at version 0.1.x and actively evolving; `query.live()` remote function API in SvelteKit 2.x is experimental and has introduced breaking changes in recent patch releases.
- **Anticipated impact:** No breaking changes to Svelte 5 core. The `query.live()` API is the most likely source of disruption for SvelteKit-based projects in the near term; it is explicitly marked experimental. The `@sveltejs/mcp` maturing toward 1.0 will improve the AI-tooling story further. Template declarations may slightly affect idiom conventions for where derived values are placed.
- **Stability penalty:** No — see Stability evidence. Svelte 5 core conventions (runes) are stable; the migration from v4 to v5 has already shipped. No breaking changes are announced or evidenced in the 5.x release notes.

### AI-tooling investment

- **What exists:**
  - **Official MCP server** (`@sveltejs/mcp`, `github.com/sveltejs/mcp`, `mcp.svelte.dev` for remote) — first-party, maintained by the Svelte team. Provides: `list-sections` (documentation index), `get-documentation` (full docs for any section), `svelte-autofixer` (static analysis with suggestions for common AI generation errors), and a playground link generator. The autofixer is specifically designed to correct Svelte 4 idioms that AI models generate by default.
  - **`llms.txt` suite** — `svelte.dev/llms.txt`, `svelte.dev/llms-full.txt`, `svelte.dev/llms-medium.txt`, `svelte.dev/llms-small.txt`; separate package-level files for Svelte, SvelteKit, and the CLI.
  - **AI docs section** — `svelte.dev/docs/ai/overview` documents official AI instructions, skills, and subagents for orchestrated agent workflows.

- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter for the before/after. Summary: the delta for Svelte is larger than for React because Svelte 5 runes are recent enough that LLM training data still reflects Svelte 4 idioms heavily. Without `@sveltejs/mcp`: the model produced `on:click` directive syntax, `export let` props, and `$:` reactive statements on the first attempt — valid Svelte 4, wrong for Svelte 5. With the MCP server active and `svelte-autofixer` running on generated code: the model produced correct Svelte 5 runes syntax on the first attempt, and the autofixer immediately flagged the one residual `on:click` I tested as a Svelte 4 idiom. The tooling is demonstrably closing the v4→v5 training-data gap.

---

## Anti-Patterns from Human-Era Thinking

- **`$:` reactive statements in Svelte 5 new code.** The `$: doubled = count * 2` pattern was idiomatic Svelte 3/4. In Svelte 5 it still compiles (backward compatibility) but `$derived` is the modern form. An agent trained primarily on Svelte 4 examples will emit `$:` by default — correct but anti-idiomatic for new Svelte 5 code. The `svelte-autofixer` in the official MCP server specifically catches this.

- **`export let` props in Svelte 5.** Legacy: `export let title = 'default'`. Modern: `let { title = 'default' } = $props()`. Mixed usage in a codebase creates confusing reading — the two prop patterns have subtly different semantics in edge cases.

- **`createEventDispatcher` for component events.** Svelte 4 pattern, deprecated in Svelte 5. The modern pattern is callback props. An agent generating a component that dispatches events should use `let { onselect } = $props()` and call `onselect(value)`, not `dispatch('select', value)`.

- **Writable stores for component-local state.** Before runes, writable stores were occasionally used for local state because they provided fine-grained reactivity. In Svelte 5, `$state()` is the right tool for local reactive state; stores are appropriate for cross-component shared state where the pub/sub contract is needed.

## Transferable Patterns for Next-Gen Framework

- **Compiler-mediated fine-grained reactivity is the right default.** Svelte demonstrates that you don't need a virtual DOM if the compiler knows at build time which DOM nodes depend on which state. The approach eliminates an entire category of runtime overhead while requiring zero developer opt-in.

- **Single-file components with scoped styles collapse accidental complexity.** The `.svelte` file that combines script/template/style with scoped CSS by default eliminates an entire class of "how should I organize this?" questions. The answer is always: together, in one file, until it needs to be split.

- **Direct mutation is more natural than immutable replace.** `item.done = !item.done` is the natural expression of a toggle; `setItems(prev => prev.map(i => i.id === id ? {...i, done: !i.done} : i))` is a formality the framework imposes. Svelte demonstrates that a compiler can handle the tracking without requiring the developer to adopt functional discipline.

- **Runes as compiler signals, not runtime API.** `$state`, `$derived`, `$effect` are compiler instructions, not runtime function calls. This design choice means the compiler can fully understand the reactivity graph at build time, enabling precise output without any runtime overhead. A next-gen framework should similarly use syntax-level signals rather than runtime observer registration.

- **But: the v4→v5 convention split is a cautionary tale.** Svelte's implicit-reactivity-to-runes migration created a period where two incompatible convention systems coexist in the ecosystem. For a next-gen framework, designing the reactivity model right the first time — even if that means a more explicit initial API — avoids this kind of epoch-split in the corpus.
