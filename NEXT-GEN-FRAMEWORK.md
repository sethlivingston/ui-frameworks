# Next-Gen AI-First UI Framework

This document synthesizes findings from 24 framework reviews to define design principles for a next-generation UI framework optimized for AI-assisted development.

> **Philosophy**: Humans come second. This framework is designed for AI to read, write, and reason about. Human ergonomics are a secondary concern.

---

## Research Summary

Based on analysis of 24 frameworks/libraries, scored on AI-friendliness (0-10):

| Top Performers | Score | Key Strength |
|----------------|-------|--------------|
| Phoenix LiveView | 9.5 | Explicit data flow, single language, pattern matching |
| Elm | 9.0 | Compiler guarantees, no runtime exceptions, pure functions |
| SvelteKit | 9.0 | File-based conventions, clear server/client boundary |
| Remix | 8.5 | Progressive enhancement, web standards |
| Astro | 8.5 | Explicit file types, islands architecture |
| Zustand | 8.5 | Minimal API (5 functions), no magic |
| htmx | 8.5 | Declarative HTML attributes, greppable |

---

## Top AI-Friendliness Patterns

| Pattern | Source | Why AI Loves It |
|---------|--------|-----------------|
| **Explicit data flow** | Phoenix, Elm, Jotai | Every state change traceable through explicit paths |
| **Pure functions + immutability** | Elm, Phoenix | Same inputs = same outputs, no side effects |
| **Pattern matching** | Elm, Elixir | Self-documenting code structure |
| **Single language** | Phoenix (Elixir), Elm | No context switching between client/server |
| **Declarative bindings** | Phoenix (`phx-*`), htmx (`hx-*`) | Greppable, scannable, predictable |
| **Minimal API surface** | Zustand (5 functions), Jotai | Learn entire API in seconds |
| **Compiler guarantees** | Elm, Svelte | If it compiles, it works |
| **File-based conventions** | SvelteKit, Astro | Intent obvious from filename |

---

## Anti-Patterns to Avoid

| Anti-Pattern | Source | Why It Creates Friction |
|--------------|--------|------------------------|
| **Implicit reactivity** | MobX | "Magic" that hides data flow |
| **Manual optimization** | React (memo, useMemo) | Subtle, easy to get wrong |
| **Dependency arrays** | React useEffect | Common source of bugs |
| **Stale closures** | React | Requires understanding JS semantics |
| **Multiple strategies** | Next.js (SSR/SSG/ISR) | Too many execution contexts |
| **Decorator magic** | Angular | Hides behavior |
| **Framework caching** | Next.js | Abstraction that's hard to reason about |

---

## 2026 Update: Frontier LLM Capabilities Reshape the Calculus

> Added 2026-06-07. The design principles below were drafted against late-2025 model capabilities (the original 24-framework survey was reviewed in December 2025). Frontier models — Claude Opus 4.8 and Sonnet 4.6 chief among them, alongside GPT-5.5 and Gemini — have moved far enough since then that several founding assumptions deserve re-weighting. None of them are wrong; they were calibrated to a moment that's already past.

### What changed, and what it means here

| Capability | Late-2025 assumption | Mid-2026 reality | Effect on this framework's principles |
|---|---|---|---|
| **Context window** | Models forget; locality of behavior is survival-critical | 1M-token windows (Opus 4.8, Sonnet 4.6) hold ~20-100 source files at once — effectively a whole small codebase | Locality of behavior becomes a **performance/cost** concern, not a correctness one. Designs that span files are workable as long as the model can still load them all. |
| **Agentic coding** | Models write code blind; compile-time guarantees are the *only* defense against errors | Models now run code, execute tests, read failures, and iterate autonomously in long-horizon agentic loops | Compiler guarantees stay valuable as the *fastest* feedback signal, but they're one rung on a ladder that now also includes test-driven self-correction. A framework that's pleasant to **iterate against** matters as much as one that's hard to get wrong on the first try. |
| **Extended/adaptive thinking** | Models pattern-match; anything not spelled out is "magic" they can't see through | Adaptive thinking lets models reason through *why* code is shaped the way it is before writing more of it | Some implicit patterns become *safely* implicit — a coherent, well-motivated convention can now be derived by a reasoning model rather than requiring explicit restatement everywhere. This narrows, but does not erase, the gap between "explicit" and "well-designed implicit." |
| **Novel-language generalization** | A brand-new DSL pays a steep accuracy tax versus mainstream languages | The novelty penalty has shrunk to roughly 10-20% (from an estimated 50%+) given a clear spec and a handful of examples | Inventing a new language (StrictTS) is still defensible — though a TypeScript **subset/extension** remains the lower-risk path, since models already carry deep TypeScript priors that a from-scratch syntax can't borrow. |
| **Long-running agentic sessions** | Each generation is roughly a single shot | Persistent sessions, memory stores, and multi-turn refinement loops are now standard agentic tooling | Framework ergonomics should assume **generate → test → refine** cycles, not single-pass perfection. Error messages that steer an autonomous agent toward the fix are now a first-class design surface, not a courtesy to humans. |

### Principles that get *stronger*

- **Declarative, greppable bindings** (`data-action`, `phx-*`, `hx-*`) — still excellent, and arguably *more* valuable: grep is exact and cheap regardless of how large the context window gets.
- **Pure functions / explicit data flow** — still excellent, because this is exactly the shape of code a model can both generate with confidence *and* verify by actually running it.
- **Minimal API surface** — still excellent, and more so in agentic loops: a smaller surface means fewer things an agent can subtly get wrong across many iterations of self-correction.

### Principles that get *re-weighted*, not discarded

- **"Zero implicit behavior"** softens into **"no behavior a model can't reconstruct by reasoning plus a quick grep."** Implicit patterns aren't automatically disqualifying anymore if they're coherent enough for a reasoning model to derive — but they still need to be debuggable by a human, or by an agent that's stuck mid-loop and has run out of inferences to make.
- **Compiler-enforced correctness** remains a pillar, but shifts from "the only safety net" to "the fastest rung on a ladder that also includes test execution and runtime verification." Build the framework to be fast and pleasant to **test against**, not only hard to compile incorrectly.
- **Locality of behavior** matters less as an anti-forgetting mechanism and more as a **cost/latency** lever — keeping what an agent must load lean still saves tokens and wall-clock time, it's just no longer the line between "the model understands this" and "it doesn't."

### Bottom line for StrictTS

The gap analysis below — "nothing in TypeScript/JavaScript combines all the best patterns" — still holds, and the case for StrictTS survives the 2026 capability jump intact. If anything, stronger reasoning models make an Option/Result-flavored TypeScript *easier* to teach a model, not harder: adaptive thinking means a model can work through *why* `match` must be exhaustive, rather than needing that drilled in by repetition. The adjustment to make: don't over-invest in the compiler as the sole correctness story. Give the compiler's errors and the runtime test loop equal billing, and write error messages as something an autonomous agent reads and *acts on* — not just something a human reads and understands.

---

## 2026 Update: Framework Landscape Changes Worth Tracking

> Spot-checked 2026-06-07 against the 24 frameworks already reviewed in `/research`. Most shipped only incremental releases since the December 2025 review; a handful made moves significant enough to flag for a closer look. (Update notes have been added inline to the affected review files.)

| Framework | What changed (since ~Dec 2025) | Why it matters here |
|---|---|---|
| **Remix** | Remix 3 (beta, Apr 2026): ground-up rewrite that **drops React**, ships its own component model on web standards (Fetch API runtime, no virtual DOM), no migration path from Remix 2 | If it ships, "Remix" stops meaning "Remix-on-React" — the existing review describes a framework that's about to be superseded by a different one wearing the same name |
| **Vue** | Vue 3.6 Vapor Mode (beta): compiles away the virtual DOM entirely, targeting Svelte/Solid-level performance | A genuine rendering-strategy shift inside Vue 3.x — `rendering_strategy` may need to move from `virtual-dom` toward `compiler`/`fine-grained` once it stabilizes (tracking Q3-Q4 2026) |
| **Angular** | Angular 22 (May 2026, stable): **Signal Forms**, **Selectorless Components**, and **Zoneless** change detection all graduate to production-ready | Angular's `state_model` is now genuinely signals-first, not Zone.js/decorator/RxJS-first — a meaningful enough shift that the original framing reads as dated |
| **SolidJS** | Solid 2.0 (beta): reworked async model — first-class Promises in `createMemo`, redesigned Suspense, split `createEffect` | Changes Solid's "Async Handling" story significantly enough to warrant a refresh once 2.0 stabilizes |
| **Qwik** | Qwik 2.0 (beta): near-rewrite — new package scope (`@qwik.dev/*`), no comment-node serialization, new primitives (`useAsyncComputed$`, `worker$`) | Resumability story extends into async state and workers; component-model details in the review will likely be stale post-2.0 |
| **htmx** | htmx 4.0 (beta): replaces `XMLHttpRequest` with `fetch()`, makes attribute inheritance **explicit** via `:inherited` (was implicit), changes back-button handling | The `:inherited` change *strengthens* exactly the explicitness this project values in htmx — inheritance becomes greppable instead of inferred |
| **Laravel Livewire** | Livewire v4 (shipped Jan 2026): parallel live updates, `wire:transition`, and an "Islands" feature for isolating reactive regions | Islands narrows *what* re-renders in a way that echoes Phoenix LiveView's explicit-data-flow strength — closes some of the gap between the two |
| **Astro** | Astro 6.0 (shipped Mar 2026): experimental Rust compiler, Vite-Environment-API rewrite of the build pipeline, Fonts/CSP APIs, Live Content Collections | Tooling/performance overhaul under the same Islands philosophy — the AI-friendliness analysis is unaffected, this is plumbing |
| **Next.js** | Next.js 16.2 (Mar 2026): 25-60% faster HTML rendering, Turbopack maturation, experimental Rust compiler, new Fonts/CSP APIs | Performance and tooling, not a paradigm shift — the "multiple strategies" anti-pattern noted in the original review is unchanged |
| **TC39 Signals proposal** | Still **Stage 1** as of mid-2026 — no native browser implementation shipping | The "native reactivity primitive that could obsolete framework-level signals" the vanilla-js review was watching for hasn't materialized; framework-level signals remain the only game in town |

**No significant change found:** React (19.x patch releases only — the React 19 model described in the review still stands), Svelte/SvelteKit (continued evolution of Runes and remote functions, no new major version), Redux, Zustand, Jotai, MobX, XState, TanStack Query, Lit, Stencil, Alpine.js, Elm, Phoenix LiveView.

---

## Design Principles

### 1. Zero Implicit Behavior

```
State change → Explicit function call → Predictable result
```

No automatic tracking (MobX), no dependency array inference, no hidden subscriptions. If AI reads the code, it sees exactly what happens.

### 2. Single-Language Full-Stack

Like Phoenix LiveView but with broader adoption potential:
- **TypeScript everywhere** - Server + client, one language
- **Or Elixir** - Functional, immutable, pattern matching (proven with Phoenix)
- **Or Elm-like in JS** - Compile-to-JS with Elm's guarantees

### 3. Declarative Event Bindings as HTML Attributes

```html
<button data-action="increment" data-debounce="500">+1</button>
```

Not `onClick={handleIncrement}` but scannable attributes that AI can grep across the entire codebase.

### 4. Compiler-Enforced Correctness

From Elm: Exhaustive pattern matching, no null/undefined, no runtime exceptions. AI-generated code that compiles is guaranteed to work.

### 5. Atomic State with Explicit Dependencies

From Jotai/Zustand:

```typescript
const count = atom(0)
const doubled = derived(count, c => c * 2) // Explicit dependency
```

No hidden subscriptions. Dependencies are visible in code.

### 6. File-Based Routing with Intent Suffixes

From SvelteKit:

```
routes/
  users/
    +page.ts        → Component
    +page.server.ts → Server-only logic
    +action.ts      → Form actions
```

AI knows exactly what each file does from its name.

### 7. Co-Located State and UI

From Phoenix LiveView: Each "view" module contains its state, events, and rendering. No tracking state across 5 files.

### 8. Progressive Enhancement Default

From Remix/htmx: Works without JavaScript. AI can reason about fallback behavior.

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         COMPILER                             │
│  - Exhaustive pattern matching (from Elm)                   │
│  - No null/undefined (Option types)                         │
│  - Type-safe actions and events                             │
│  - Dead code elimination                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE-FILE VIEWS                         │
│                                                              │
│  view UserProfile {                                          │
│    state: { user: User | null, loading: bool }              │
│                                                              │
│    on load:                                                  │
│      state.loading = true                                    │
│      state.user = await fetchUser(params.id)                 │
│      state.loading = false                                   │
│                                                              │
│    on "save" { email: string }:                             │
│      await updateEmail(state.user.id, email)                 │
│                                                              │
│    render:                                                   │
│      <div>                                                   │
│        <input value={state.user.email}                       │
│               data-action="save"                             │
│               data-debounce="500" />                         │
│      </div>                                                  │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ATOMIC STATE LAYER                         │
│  - Global atoms (from Jotai)                                │
│  - Explicit dependencies (no magic tracking)                │
│  - Computed values are pure functions                       │
│  - Subscriptions visible in code                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Expected Scores

| Metric | Expected Score | Reason |
|--------|---------------|--------|
| **AI-Friendliness** | 10/10 | Designed from ground-up for AI |
| **Reusability** | 9/10 | Single-file views are portable |
| **Maintainability** | 9.5/10 | Compiler catches everything |

---

## Key Differentiators

| vs Framework | Advantage |
|--------------|-----------|
| **Phoenix LiveView** | TypeScript instead of Elixir (more AI training data) |
| **Elm** | Practical compromise between purity and productivity |
| **Svelte** | More explicit (no `$:` magic), co-located state |
| **React** | No hooks rules, no dependency arrays, no stale closures |
| **htmx** | Full framework, not just progressive enhancement |

---

## Gap Analysis

The research shows a clear gap:

1. **Phoenix LiveView** (9.5) is excellent but requires Elixir adoption
2. **Elm** (9.0) is pure but has limited ecosystem and is a new language
3. **Svelte** (9.0) is close but still has compiler magic that hides behavior
4. **Nothing in TypeScript/JavaScript** combines all the best patterns

**The sweet spot**: A TypeScript framework that takes:
- **Data flow explicitness** from Phoenix/Elm
- **Compiler safety** from Elm
- **Minimal API** from Zustand/Jotai
- **File conventions** from SvelteKit
- **Progressive enhancement** from Remix/htmx
- **Single-file views** from Phoenix LiveView

---

## Open Questions

- [ ] What is the compilation target? (JS, WASM, both?)
- [ ] How do we handle styling? (Co-located? Utility-first? CSS-in-JS?)
- [ ] What's the server runtime? (Node, Deno, Bun, edge?)
- [ ] How do we handle forms? (Progressive enhancement like Remix?)
- [ ] What's the testing story? (Unit, integration, e2e?)
- [ ] How do we handle authentication/authorization patterns?
- [ ] What's the data fetching primitive? (Loader functions? Atoms?)

---

## Related Documents

- **[LANGUAGE-DESIGN.md](./LANGUAGE-DESIGN.md)** - StrictTS language specification (TypeScript without null/undefined)

## Next Steps

1. Define the language/syntax specification - see [LANGUAGE-DESIGN.md](./LANGUAGE-DESIGN.md)
2. Build a minimal compiler prototype
3. Implement core primitives (state, events, rendering)
4. Create example applications
5. Benchmark AI code generation accuracy vs existing frameworks

---

*This document is a living seed. It will evolve as the framework takes shape.*
