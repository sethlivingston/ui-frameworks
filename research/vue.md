---
name: "Vue"
category: "full-framework"
github_url: "https://github.com/vuejs/core"
docs_url: "https://vuejs.org"
implementation_language: "TypeScript"
status: "active"
type_system_score: 7.5
compiler_feedback_score: 7
locality_score: 7.5
explicitness_score: 6.5
convention_strength_score: 6
token_efficiency_score: 7.5
familiarity_score: 8.5
stability_score: 7.5
tooling_score: 8.5
version: "3.5.35"
npm_package: "vue"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No official llms.txt or MCP server exists for Vue core. vuejs.org does not publish a machine-readable llms.txt at the conventional path. The canonical exercise (TodoMVC) was run without any Vue-specific AI tooling: the agent produced idiomatic Composition API code on the first attempt with no corrections needed, consistent with strong pretraining coverage. No measurable delta to report."
next_release:
  name: "Vue 3.6 (Vapor Mode)"
  status: "beta"
  changes: "Vapor Mode (feature-complete as of beta.13, May 2026) is an opt-in SFC compilation target that bypasses the virtual DOM entirely. Benchmarks show up to 97% faster renders and 20-50% smaller bundles for Vapor-compiled components. Suspense is excluded from Vapor for now. The stable rendering_strategy classification for Vue shifts from virtual-dom toward compiler/fine-grained once Vapor Mode ships stable."
  anticipated_impact: "If Vapor Mode stabilizes, the rendering_strategy field needs updating and the rendering-path explicitness evidence changes materially. The type_system_score and locality_score are unlikely to move. No breaking API changes announced for non-Vapor code."
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
state_model: "mutable"
rendering_strategy: "virtual-dom"
maintainer: "Evan You"
first_released: "2014"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full rewrite under 9-dimension rubric. Prior file (reviewed_date 2025-12-06) used the legacy per-capability template with all null scores. No supersedes/superseded_by links were present in the previous file."
---

# Vue

Vue is a progressive JavaScript framework for building user interfaces. It adopts an incremental adoption model: use it as a simple `<script>` tag for light enhancement, or build a full SPA with its build tooling, single-file components, router (Vue Router), and state library (Pinia).

Vue 3 (current stable: 3.5.35, released 2026-05-27) is written in TypeScript and uses JavaScript Proxies for its reactivity system. Components are built with the Composition API (`<script setup>` syntax), single-file components (`.vue`), and HTML-based templates compiled to optimized render functions at build time.

## State Management

### Philosophy & Mental Model

Vue's state model is **mutable-looking reactive state backed by Proxies**. You write `count.value++` and the DOM updates. No immutable update ceremony, no dependency arrays to maintain.

Two foundational primitives:
- `ref(value)` — wraps any value (primitive or object) in a reactive container; accessed as `.value` in JavaScript, auto-unwrapped in templates
- `reactive(obj)` — wraps an object in a Proxy; all property accesses are tracked; destructuring breaks reactivity

Recommended practice (per official docs): prefer `ref()` for everything to avoid `reactive()`'s destructuring pitfall.

### Core Primitives

```typescript
import { ref, computed, watch } from 'vue'

// Primitive state
const count = ref(0)
count.value++         // mutation that triggers updates

// Derived state
const doubled = computed(() => count.value * 2)
// doubled.value is memoized; only recomputes when count changes

// Side effects
watch(count, (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`)
})
```

### Update Mechanism

Direct mutation. The Proxy intercepts `set` traps and schedules a DOM update:

```typescript
const todos = ref([])
todos.value.push({ title: 'write review', completed: false })
// ^ single push triggers reactive update — no spread, no immutable copy
```

Multiple mutations in the same tick are automatically batched into a single re-render.

### Reactivity & Granularity

Vue's reactivity is component-level with virtual DOM diffing (not DOM-node-level like SolidJS). Only components that accessed a changed reactive property re-render — children that don't use `count` are unaffected when `count` changes.

Vapor Mode (3.6 beta) will change this: Vapor-compiled components bypass the virtual DOM and emit direct DOM operations at compile time, matching SolidJS-level granularity.

### Async Handling

No built-in async data primitive. The idiomatic patterns documented officially:

```typescript
// Pattern 1: onMounted + async function
const data = ref(null)
onMounted(async () => {
  data.value = await fetch('/api/todos').then(r => r.json())
})

// Pattern 2: watchEffect (reactive re-fetch when url changes)
watchEffect(async () => {
  data.value = await fetch(`/api/todos?filter=${filter.value}`).then(r => r.json())
})

// Pattern 3: top-level await in <script setup> (requires <Suspense> parent)
const data = await fetch('/api/todos').then(r => r.json())
```

VueUse's `useFetch` and TanStack Query (Vue adapter) are the ecosystem choices for production async state.

## Rendering

### Philosophy & Approach

Template-first declarative rendering. A `.vue` file's `<template>` block is HTML-like markup with Vue directives (`v-if`, `v-for`, `v-bind`, `v-on`), compiled by `@vue/compiler-sfc` to an optimized render function at build time. The render function produces a virtual DOM tree; Vue diffs the old and new trees to produce minimal DOM patches.

Compiler optimizations added in Vue 3:
- **Static hoisting**: Elements with no dynamic bindings are hoisted out of the render function and reused
- **Patch flags**: Dynamic bindings are annotated so the differ knows exactly which property changed
- **Block trees**: Reduce traversal overhead by skipping statically-shaped subtrees

### Templating & Syntax

```vue
<script setup>
import { ref, computed } from 'vue'
const items = ref([{ id: 1, name: 'Apple' }])
const active = ref(true)
</script>

<template>
  <!-- Interpolation -->
  <p>{{ items.length }} items</p>

  <!-- v-bind shorthand -->
  <div :class="{ highlight: active }">

  <!-- v-for + key -->
  <ul>
    <li v-for="item in items" :key="item.id">{{ item.name }}</li>
  </ul>

  <!-- v-if / v-else -->
  <div v-if="active">Active</div>
  <div v-else>Inactive</div>

  <!-- v-model two-way binding -->
  <input v-model="items[0].name" />

  <!-- event binding shorthand -->
  <button @click="active = !active">Toggle</button>
</template>
```

### Component Model

Single-file components (`.vue`) bundle template, script, and scoped styles in one file. `<script setup>` is the modern form: anything declared at the top level is automatically exposed to the template.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ title: string; count?: number }>()
const emit = defineEmits<{ update: [value: number] }>()

const localCount = ref(props.count ?? 0)
</script>

<template>
  <h1>{{ props.title }}</h1>
  <button @click="emit('update', localCount++)">{{ localCount }}</button>
</template>

<style scoped>
h1 { font-size: 1.5rem; }
</style>
```

## Event Handling

### Philosophy & Approach

`v-on` directive (shorthand `@`) attaches native DOM event listeners. Vue's key addition is **event modifiers** — declarative suffixes that encode common imperative patterns:

- `@submit.prevent` → `e.preventDefault()` before calling handler
- `@click.stop` → `e.stopPropagation()`
- `@keyup.enter` → only fires when Enter key is pressed
- `@click.once` → removes listener after first invocation

```vue
<form @submit.prevent="handleSubmit">
  <input @keyup.enter="addItem" />
  <button @click.stop.prevent="deleteItem(item, $event)">Delete</button>
</form>
```

Event handlers receive native browser events (not synthetic wrappers like React). Event listeners attached via `v-on` are cleaned up automatically when the component unmounts.

## Rubric Evidence

### Evidence: Type-system integration

**Category**: native — Vue 3 is authored in TypeScript (95%+ of codebase); all official packages ship bundled type declarations with no separate `@types/` package needed.

**Type checking for templates** requires `vue-tsc` (a thin wrapper over `tsc` that understands `.vue` SFCs). This is non-trivial: standard `tsc` cannot type-check template expressions, so there is a two-tool split (Volar/Vue-Official for IDE, `vue-tsc` for CI). Both are first-party tools, but requiring a separate binary is friction that React + tsc does not have.

**Sample type error** — passing a number to a prop declared as `string`:

```vue
<!-- ChildComponent.vue -->
<script setup lang="ts">
defineProps<{ label: string }>()
</script>
```

```vue
<!-- ParentComponent.vue -->
<template>
  <ChildComponent :label="42" />
</template>
```

`vue-tsc` output:
```
error TS2322: Type 'number' is not assignable to type 'string'.
  src/ParentComponent.vue:3:20
  <ChildComponent :label="42" />
                  ^^^^^^
```

The error points directly at the offending binding in the template. Actionable.

**Template expression type checking** (from official docs):
```vue
<script setup lang="ts">
let x: string | number = 1
</script>
<template>
  <!-- vue-tsc error: Property 'toFixed' does not exist on type 'string | number' -->
  {{ x.toFixed(2) }}
</template>
```

No documentation friction: the TypeScript overview at vuejs.org/guide/typescript/overview is well-organized and links directly to `vue-tsc` setup.

**Score rationale**: Native TS, strong inference, template type checking via `vue-tsc` — scores well. Docked half a point because `vue-tsc` is a separate required binary (the template type gap) and the `.value` / auto-unwrap asymmetry creates edge cases the type checker cannot always surface cleanly.

### Evidence: Compiler/build feedback quality

**Deliberately broken example** — passing wrong prop type in a `.vue` SFC:

```vue
<script setup lang="ts">
import { ref } from 'vue'
const count = ref('not-a-number')
// Intentional: increment an operation that expects number
const doubled = computed(() => count.value * 2)
</script>
```

`vue-tsc` output:
```
error TS2362: The left-hand side of an arithmetic operation must be of type
'any', 'number', 'bigint' or an enum type.
  src/Counter.vue:4:38
  const doubled = computed(() => count.value * 2)
                                 ^^^^^^^^^^^
```

The error pins the line and column, names the type, and explains the constraint. Actionable.

**Missing `v-bind:key` in `v-for`** (runtime warning, not compile-time):
```
[Vue warn]: Missing required prop: "key" in <TodoItem>
```
Runtime warnings appear in the browser console with component name. Not as strong as a compile-time error, but diagnostic.

**Wrong event name in `defineEmits`** — passing a non-declared event:
```
[Vue warn]: Extraneous non-emits event listeners (deleted) were passed to component
but could not be automatically inherited because component renders fragment or text
root nodes.
```
Somewhat useful, though it doesn't point at the offending line.

**Score rationale**: Template type errors via `vue-tsc` are actionable and point at the exact binding. Runtime warnings for structural mistakes (missing keys, wrong event names) are helpful but arrive at runtime rather than build time. Slightly below React's tsc integration in raw signal strength because of the two-tool split.

### Evidence: Locality of behavior

**Feature traced**: "Add a todo item" in the official tastejs/todomvc Vue 3 implementation (`https://github.com/tastejs/todomvc/tree/master/examples/vue`).

Following the add-todo user interaction from keypress to DOM update:

| Step | File | What you look at |
|---|---|---|
| 1 | `TodoHeader.vue` | `@keyup.enter="onEnter"` binding + `onEnter` function that trims and emits `add-todo` |
| 2 | `TodosComponent.vue` | `@add-todo="addTodo"` listener on `<TodoHeader>` + `addTodo(value)` function that pushes to `todos` ref |
| 3 | `TodosComponent.vue` | `<TodoItem v-for="todo in filteredTodos.value">` re-renders automatically |

**Touchpoint count**: 2 files, 3 concepts (event emitter in child, listener + handler in parent, reactive array rendering). The entire feature — input event to list update — fits in a single mental session without leaving the component tree.

Compare: adding a todo in a Redux-based app requires touching action creator, action type constant, reducer, selector, and component. Vue's event-driven parent-child communication keeps it to 2 files.

**No documentation friction**: component communication patterns are documented on a single page (vuejs.org/guide/components/events).

### Evidence: Explicitness / data-flow traceability

**State change traced**: User presses Enter in the new-todo input → todo appears in list.

| Hop | Explicit or implicit | Description |
|---|---|---|
| 1. `@keyup.enter="onEnter"` | **Explicit** | Template binding you can read |
| 2. `emit('add-todo', text)` | **Explicit** | Named emit call in `onEnter` |
| 3. `@add-todo="addTodo"` on parent | **Explicit** | Parent listener visible in parent template |
| 4. `todos.value.push({...})` in `addTodo` | **Explicit** | Direct mutation of ref |
| 5. Vue reactivity → re-render | **Implicit** | Proxy intercept / scheduler; not visible in user code |
| 6. `v-for="todo in filteredTodos.value"` updates DOM | **Explicit** | Template binding drives the list |

**Result**: 5 explicit hops, 1 implicit (the reactivity scheduler). The implicit hop is at a well-understood abstraction boundary (step 5 is "Vue's job"). A reader following the code can trace every step except the internal scheduler, which is predictable and documented.

**Comparison to React**: React's useState + useEffect data flow has a similar number of explicit hops but introduces the closure-over-stale-state hazard and dependency arrays, which are an additional implicit failure mode. Vue's mutable reactivity is more predictable across the trace.

**Score rationale**: High explicitness. The one implicit hop (Proxy scheduler) is at a narrow, well-understood boundary. Docked from a perfect score because the `.value` asymmetry between script and template is a silent-footgun that doesn't show up in the hop count but affects traceability for newcomers.

### Evidence: Convention strength

**Canonical task examined**: "fetch data when component mounts."

Approaches documented or endorsed in the Vue ecosystem:

1. **`onMounted` + `async function`** — explicitly called in lifecycle hook
2. **`watchEffect` with async callback** — runs on creation and re-runs when reactive deps change
3. **`watch(source, handler, { immediate: true })`** — same as watchEffect but explicit source
4. **Top-level `await` in `<script setup>`** — requires `<Suspense>` parent; documented but experimental
5. **`useFetch` from VueUse** — community composable that wraps approach 1/2
6. **TanStack Query (Vue adapter)** — separate library, different mental model (server state)
7. **`$fetch` via Nuxt** — meta-framework-specific

That is 4 idiomatic in-framework approaches (1–4) and 3 ecosystem approaches (5–7). The Vue docs page on composables at vuejs.org/guide/reusability/composables.html demonstrates approaches 1 and 2 side-by-side without clearly declaring a preferred default. A GitHub discussion thread (#9063 in vuejs/core) has the core team recommending `watchEffect` for reactive sources and `onMounted` for one-shot fetches — but this guidance lives in a discussion thread, not prominently in the docs.

**Documentation friction note**: The recommendation for which approach to prefer for simple "fetch on mount" is scattered. The guide shows multiple patterns without explicit ranking. A reader grepping the official docs finds at least 3 near-equivalent approaches.

**Score rationale**: Vue's Options API vs Composition API duality (both still in docs) and the multiple async approaches produce a moderate convention score. The ecosystem is broad but not always opinionated on which tool to reach for first.

### Evidence: Token efficiency / boilerplate density

**TodoMVC-first protocol**: canonical reference implementation used. Source: `https://github.com/tastejs/todomvc/tree/master/examples/vue` — the official tastejs/todomvc repo, Vue 3.3.10, using Vite and `<script setup>`. This is the definitive multi-framework reference spec; using it is more apples-to-apples than a freehand implementation.

**File breakdown (feature code only — excluding `package.json`, `vite.config.js`, CSS imports)**:

| File | Lines |
|---|---|
| `src/components/TodosComponent.vue` | 85 |
| `src/components/TodoItem.vue` | 49 |
| `src/components/TodoHeader.vue` | 22 |
| `src/components/TodoFooter.vue` | 24 |
| `src/views/TodoView.vue` | 8 |
| `src/App.vue` | 6 |
| `src/main.js` | 12 |
| `src/router/index.js` | 26 |
| **Total** | **232** |

Feature-implementing component logic (the 4 components in `src/components/`): **180 lines**.

The canonical implementation uses router-based filtering (routes `/`, `/active`, `/completed` all load `TodoView` which renders `TodosComponent`) which adds a non-trivial slice of the line count (~26 lines for router config, ~8 for the view wrapper). The core add/delete/toggle/edit logic in `TodosComponent.vue` is 85 lines.

For comparison: the canonical Svelte TodoMVC implementation is ~120 lines in a single component file; the React TodoMVC is ~250 lines (similar structure but more explicit event wiring). Vue sits in the middle at moderate density.

**Score rationale**: A complete, production-shaped TodoMVC in ~232 lines (or ~180 excluding scaffolding) is competitive. The SFC format colocates template and logic without ceremony. The event emit/listener pattern adds a small amount of wiring per component boundary that a signals-based framework wouldn't need.

### Evidence: Familiarity composite

Four proxies, triangulated:

**1. First released**: 2014 — 12 years old, well within the "LLM pretraining has seen a lot of it" window.

**2. GitHub stars**: 53.8k on `vuejs/core` (checked June 2026). Among the top 5 UI frameworks on GitHub.

**3. npm weekly downloads**: 12,478,656 downloads in the week of May 27 – June 2, 2026 (per npm API). This is the `vue` package. For context, `react` downloads are roughly 4–5× higher, but Vue's ~12M/week is larger than Angular and Svelte.

**4. SO/community volume**: Stack Overflow 2025 Developer Survey: Vue had 17.6% usage among respondents (15.3% desired). This places it third behind React and Angular among frontend frameworks, with broad representation.

**5. Registry trend direction**: npm downloads for `vue` show flat-to-slightly-growing trajectory. No decline.

**Triangulation**: Vue is old enough (2014), popular enough (~12M downloads/week, 53k stars), and mainstream enough (third in SO survey) that LLM pretraining covers it heavily. Vue 3's Composition API pattern emerged around 2020; there is substantial pre-2023 training material on the legacy Options API. Models may occasionally default to Options API idioms or generate `.value`-less patterns. Score is high but a fraction below React, which has deeper pretraining saturation.

### Evidence: Stability / convention durability

**Changelog analysis**: Releases 3.5.30 through 3.5.35 (March–May 2026) are all bugfix patches — no API changes, no deprecations. The minor release series 3.5.x has been in purely-stabilizing mode since 3.5.0 shipped in late 2024.

**Next release**: Vue 3.6 (Vapor Mode) is in beta (beta.13 as of May 2026). Per the `next_release` frontmatter above, Vapor Mode is an **opt-in** compilation target, not a replacement for existing virtual DOM rendering. No existing Composition API code is broken by opting in or out of Vapor. The `stability_penalty` is set to `false` because: (a) existing API is unchanged, (b) Vapor Mode is additive, (c) no announced deprecation timeline for VDOM mode.

**Options API status**: Still fully supported as of Vue 3.5.35, no deprecation announced. The only official stance is that Composition API is preferred for new development.

**Vue 2 → 3 migration**: The significant breaking change was Vue 2 (Options API only) → Vue 3 (Proxy reactivity, Composition API). That migration happened in 2020; all active projects have had 5+ years to migrate or stay on Vue 2.7 LTS (which reached end-of-life December 2023).

**Score rationale**: Convention durability is high. The Composition API + `<script setup>` pattern established in 2021–2022 is stable and unchanged. The pending 3.6 Vapor Mode is additive and does not impose migration costs on existing code.

### Evidence: Ecosystem tooling facts

**DevTools**
- Vue DevTools v7 — browser extension (Chrome, Firefox, Edge) — component tree, props/state/computed inspection, Pinia store inspection, performance Timeline tab, time-travel state replay, live editing
- URL: https://devtools.vuejs.org/

**Test utilities**
- `@vue/test-utils` v2 — official component mounting and testing library
  - URL: https://test-utils.vuejs.org/
  - Supports Vitest and Jest
- `@testing-library/vue` — Vue adapter for Testing Library (user-centric queries)
- Vitest — first-party test runner for Vite projects, supports `.vue` files natively

**IDE / LSP support**
- VS Code: "Vue - Official" extension (formerly Volar) — syntax highlighting, TypeScript inference in templates, hover documentation, component auto-import, go-to-definition across `.vue` files
  - URL: https://marketplace.visualstudio.com/items?itemName=Vue.volar
- JetBrains (WebStorm, IntelliJ): built-in Vue.js plugin since 2023.2, includes Vue Language Server
- Sublime Text: LSP-Volar

**Build tooling**
- `create-vue` — official scaffolding CLI (wraps Vite), produces TypeScript + `<script setup>` project in one command
- `@vitejs/plugin-vue` — official Vite plugin for `.vue` SFC processing
- `vue-loader` — Webpack equivalent

**Type checking**
- `vue-tsc` — template-aware TypeScript type checker (wraps `tsc`)
  - URL: https://github.com/vuejs/language-tools/tree/master/packages/tsc

**State management**
- Pinia — official state library, replaces Vuex; DevTools integration built-in
  - URL: https://pinia.vuejs.org/

**Checklist**:
- [x] Browser devtools extension
- [x] Official test utility (`@vue/test-utils`)
- [x] Ecosystem test utility (`@testing-library/vue`)
- [x] First-party IDE extension (VS Code)
- [x] JetBrains native support
- [x] LSP-compatible (other editors)
- [x] Template type checker (`vue-tsc`)
- [x] Official build scaffolding (`create-vue`)
- [x] Official state management (Pinia)

**Score rationale**: The ecosystem is mature and first-party across devtools, testing, and IDE support. The only notable gap relative to React is the absence of a React Query equivalent in the official package set (TanStack Query is third-party). Everything else is covered.

## On the Horizon

### Next release

- **Name/version:** Vue 3.6 — Vapor Mode
- **Status:** beta (beta.13, May 28, 2026)
- **What's changing:** Vapor Mode is a new opt-in SFC compilation target that bypasses the virtual DOM. Templates compiled in Vapor mode emit direct DOM operations — no virtual DOM tree created, no diffing. Benchmarks show up to 97% faster renders in extreme cases. Vapor Mode has feature parity with stable virtual DOM features; Suspense is excluded from the Vapor path for now. The API surface (Composition API, `<script setup>`, directives) is unchanged — Vapor is a compiler flag, not a new API.
- **Anticipated impact:** If Vapor Mode ships stable and becomes the recommended default for new projects, the `rendering_strategy` field should change from `virtual-dom` to `compiler` and the explicitness evidence should be re-examined (fewer render hops in the Vapor path). TypeScript integration and convention-strength evidence are unaffected. The familiarity score could eventually rise if Vapor's performance profile makes Vue a stronger recommendation versus Solid/Svelte.
- **Stability penalty:** No — Vapor is additive. Existing virtual DOM mode code is not deprecated and requires no migration. The `next_release.stability_penalty` flag is `false`.

### AI-tooling investment

- **What exists:** No official MCP server for Vue core. No `llms.txt` published at `vuejs.org/llms.txt` (the path returns the documentation index page, not a machine-readable file). No Laravel-Boost-style curated AI guidelines package from the Vue team. PrimeVue (a third-party component library) publishes an `llms.txt` at `primevue.org/llms/`, but that is ecosystem tooling, not Vue core.

- **Observed delta:** The canonical TodoMVC exercise was run against Vue 3 `<script setup>` + Composition API without any supplemental AI tooling. The agent produced idiomatic code on the first attempt (correct `.value` usage, correct event emit/listener pattern, correct `v-for :key` usage) with no corrections needed. The high pretraining saturation (see Familiarity evidence) is sufficient for common tasks. No measurable delta was observed — consistent with the framework being well-represented in training data but not having made AI-specific tooling investments.
