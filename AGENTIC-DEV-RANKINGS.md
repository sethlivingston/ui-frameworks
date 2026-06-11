# The Best UI Frameworks for Agentic Development

This is the synthesis the whole research project was building toward. We reviewed the frameworks and libraries in [`/research`](./research/) and tracked how frontier LLMs have evolved. One question remains: **which of these would you actually want an AI agent building your UI in today?**

> **Ranking version:** v1 — 2026-06-09
> **Inputs:** The reviews in [`/research`](./research/), their frontmatter scores, and the 2026 frontier-LLM-capability findings synthesized in [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md).
> **Ranking pass by:** Claude Fable 5 (each review's frontmatter records its own reviewing model)

---

## Methodology (read this first — and reuse it next time)

This section comes first for a reason. Six months from now, someone — human or AI — should be able to re-run this exercise and produce a comparable v2. The *differences* between v1 and v2 then become a signal in themselves. Did the framework change, or did the models?

### Scope: two lists, not one

Ranking Astro against Zustand is comparing a house to a doorknob. They solve different problems. So this doc produces **two ranked lists**:

1. **Full/meta-frameworks & rendering libraries** — the "what do I build the UI in" decision
2. **State-management libraries** — the "what do I reach for when the framework doesn't dictate this" decision

`vanilla-js` joins list 1 as the baseline "no framework" option. It is the floor everything else is measured against.

### A visible "what kind of thing is this" tag

"Full Frameworks, Meta-Frameworks & Rendering Libraries" still spans tools that do different *jobs*. Astro optimizes for content sites rather than applications. Svelte and React are rendering layers that typically pair with a meta-framework (SvelteKit, Next.js) to become a full app stack. htmx and Alpine.js augment a backend rather than replacing one. None of them get dropped — their scores are still real data points. Instead, every entry carries a short `Type` tag. The tag keeps the rank order from reading as "N interchangeable options for the same job":

| Tag | Meaning |
|---|---|
| **App framework** | Batteries-included or full-stack meta-framework — what you'd reach for to build and ship a complete application end to end |
| **Rendering library** | The component/rendering layer alone — typically paired with a meta-framework (Next.js, SvelteKit, SolidStart, Nuxt) to become a full app stack |
| **Content-site framework** | Optimized for content-heavy, low-interactivity sites (blogs, docs, marketing) — a different job than building an interactive application |
| **App architecture / language** | A language or architectural pattern for building whole applications, without the routing/meta-framework conventions of the "App framework" tier |
| **Web-components library** / **Web-components compiler** | Built for authoring reusable custom elements and design systems — component-level, not application-level (includes the native platform APIs used directly) |
| **Enhancement utility** | Augments existing server-rendered HTML with interactivity — pairs with a backend framework rather than replacing one |
| **Baseline** | The "no framework" floor everything else is measured against |

(List 2 gets a lighter version of the same idea: a one-word tag naming each library's state-management *style*. Those libraries are already a fairly homogeneous category.)

### The nine dimensions, and the one transparent total

Each framework or library in `/research` gets a 0–10 score on **9 flat dimensions**. The research agent (`.claude/agents/framework-researcher.md`) writes the scores straight to frontmatter. Each score pairs with a matching `### Evidence: <Dimension Name>` artifact in the review body. There is no holistic composite stand-in and no per-section scoring to reconcile. The corpus is the single source of truth for scoring. This doc doesn't re-derive or re-score anything; it only ranks what's already evidenced.

| Weight | Dimension | Frontmatter field | What it measures |
|---|---|---|---|
| 15% | Type-system integration | `type_system_score` | How much the compiler/type-checker catches before runtime |
| 15% | Compiler/build feedback quality | `compiler_feedback_score` | How useful the error you get back actually is |
| 13% | Locality of behavior | `locality_score` | How many files/concepts you must touch to understand or change one feature |
| 13% | Explicitness / data-flow traceability | `explicitness_score` | How many "magic" steps sit between a trigger and what renders |
| 11% | Convention strength | `convention_strength_score` | How many valid ways exist to do the same common task |
| 10% | Token efficiency / boilerplate density | `token_efficiency_score` | How much code a small feature costs |
| 11% | Familiarity composite | `familiarity_score` | How much of this a model's pretraining likely covers (the one deliberate composite — triangulated from age-weighted community volume, GitHub activity, registry trend, and `first_released`, since pretraining exposure itself is unmeasurable) |
| 7% | Stability / convention durability | `stability_score` | Whether "how it's done today" will still be true in 6 months — sourced from the framework's `next_release` tracking |
| 5% | Ecosystem tooling facts | `tooling_score` | What verification-side infrastructure exists (devtools, test utilities, IDE/LSP support) |

**Why these weights, and why familiarity is the only composite:** see `CLAUDE.md`'s Review Template (`## Rubric Evidence`) for the per-dimension evidence requirements. The research brief in `.claude/agents/framework-researcher.md` operationalizes them. This doc consumes that output; it doesn't duplicate the reasoning.

**The ranking below shows two things, deliberately, side by side:**

1. **All 9 raw scores per framework.** Care more about token efficiency than familiarity? Recompute with your own weights — the inputs are right there. No extraction work needed.
2. **One headline weighted total**, computed as `Σ(weight × dimension score)` from the same per-dimension weights published above. This is arithmetic on numbers that are already public and already evidenced. It is not a new judgment layer. Disagree with the rubric's weights? The flat table lets you recompute your own.

### Tiers: where the real gaps are

A rank order overstates precision. The gap between two neighbors may be noise, or it may be the biggest break in the list. Tiers make the real gaps visible, and they come from the data rather than from eyeballing it:

- **Algorithm:** Jenks natural breaks (Fisher's optimal 1-D partitioning) on the weighted totals. It places tier boundaries to minimize the score variance within each tier. `npm run tiers` recomputes it from the corpus frontmatter.
- **Tier count:** the smallest k whose goodness-of-variance-fit (GVF) reaches 0.95.
- **Noise floor:** rubric scores move in 0.5 steps, so a weighted total carries roughly ±0.1–0.2 of fuzz. A boundary sitting on a gap smaller than 0.25 is **soft** — adjacent entries could swap across it on a re-run. The script flags these.

List 2 stays untiered. Clustering needs more entries than that list has, and its Notes already call out the groupings directly.

Tier membership is part of the v1-vs-v2 diff. A framework that changes tiers moved in a way that beat the noise floor. A rank change *within* a tier may mean nothing.

### Caveats — read before trusting any single number

- **The rubric's weights are a judgment call.** They were settled once (see `CLAUDE.md` / the research brief) and are reused as-is each ranking pass. That consistency is what keeps the headline total comparable across re-runs. Changing the weights is a rubric-level decision: update `CLAUDE.md` and the agent brief, not this doc alone.
- **Familiarity is the one deliberate composite.** Its target — how much of a framework's usage a model's pretraining covers — can't be measured directly. So it triangulates four imperfect proxies: age-weighted community volume, GitHub activity, registry trend direction, and `first_released`. That's the correct move here, not a shortcut. See each review's `### Evidence:` section for how its triangulation was done. That includes the documented exception for CDN/script-tag-distributed tools (htmx, Alpine.js), whose registry numbers structurally undercount real usage.
- **`stability_score` reflects a snapshot.** A framework shipping a breaking rewrite takes a penalty sourced from its `next_release` frontmatter (see "Frameworks to Watch" below). Expect its position to shift once the rewrite lands — in either direction. Don't read its rank as a permanent verdict.
- **A high score means "good raw material for an agent to work with," not "good for your project."** Team familiarity, hiring, and ecosystem maturity for your specific domain still matter for real decisions. None of those have anything to do with AI assistance.

### How to re-run this in six months

1. Run `npm run normalize && npm run index && npm run sync`. This confirms the corpus frontmatter is current and validates clean against `schema/framework-review.schema.json`.
2. Check whether each review has been refreshed since the last ranking pass (`reviewed_date` / `git log` on the file). A stale review is a signal to queue the verification-first follow-on pass the research brief describes (`.claude/agents/framework-researcher.md`) — not to re-rank stale scores.
3. Re-generate "Frameworks to Watch" from the tracked `next_release` data. `rg "next_release:" research/ -A 5` surfaces every framework tracking an upcoming change. Pull the ones with `status` of `alpha`/`beta`/`rfc` or `stability_penalty: true`.
4. Recompute the headline weighted totals from the (now-current) 9 flat scores and re-rank. Run `npm run tiers` to recompute the tier partition.
5. **Diff v1 vs. v2 — the motion is the interesting part.** Flat scores that barely moved under a rank shift mean the *competition* changed. Moved scores under a stable rank mean the opposite. A tier change is motion that beat the noise floor.

---

## List 1: Full Frameworks, Meta-Frameworks & Rendering Libraries

*"What should an agent build the UI in?"*

Column abbreviations follow the rubric table in the Methodology above, in the same order: **TS** = Type-system integration (15%), **Build** = Compiler/build feedback (15%), **Loc** = Locality of behavior (13%), **Expl** = Explicitness/traceability (13%), **Conv** = Convention strength (11%), **Tok** = Token efficiency (10%), **Fam** = Familiarity composite (11%), **Stab** = Stability (7%), **Tool** = Ecosystem tooling (5%). **Weighted** = `Σ(weight × dimension score)`. **Tier** comes from the Jenks partition described in the Methodology.

| Rank | Tier | Framework | Type | Weighted | TS | Build | Loc | Expl | Conv | Tok | Fam | Stab | Tool |
|------|------|-----------|------|----------|----|-------|-----|------|------|-----|-----|------|------|
| 1 | 1 | **Elm** | App architecture / language | **8.06** | 9.5 | 9.5 | 8.5 | 9.5 | 9.5 | 6.5 | 3.5 | 7.0 | 6.0 |
| 2 | 1 | **Svelte** | Rendering library | **8.01** | 8.0 | 8.5 | 9.5 | 7.5 | 8.0 | 9.0 | 6.5 | 6.5 | 7.5 |
| 3 | 2 | **Solid** | Rendering library | **7.65** | 8.0 | 7.0 | 9.0 | 8.5 | 7.5 | 8.5 | 6.5 | 5.5 | 7.0 |
| 4 | 2 | **Astro** | Content-site framework | **7.54** | 7.5 | 7.5 | 8.0 | 8.5 | 7.5 | 7.5 | 6.5 | 6.5 | 8.0 |
| 5 | 2 | **Remix** | App framework | **7.54** | 8.0 | 7.0 | 8.5 | 8.5 | 8.0 | 7.0 | 7.0 | 5.0 | 7.5 |
| 6 | 2 | **Stencil** | Web-components compiler | **7.53** | 8.5 | 7.5 | 8.5 | 8.5 | 7.5 | 6.5 | 5.5 | 7.0 | 7.0 |
| 7 | 2 | **Phoenix LiveView** | App framework | **7.46** | 5.5 | 7.5 | 9.0 | 9.5 | 7.5 | 8.0 | 5.0 | 8.0 | 7.5 |
| 8 | 2 | **SvelteKit** | App framework | **7.36** | 8.5 | 7.5 | 5.5 | 8.0 | 8.5 | 7.5 | 6.0 | 6.5 | 8.0 |
| 9 | 2 | **Vue** | Rendering library | **7.29** | 7.5 | 7.0 | 7.5 | 6.5 | 6.0 | 7.5 | 8.5 | 7.5 | 8.5 |
| 10 | 3 | **Lit** | Web-components library | **7.10** | 7.5 | 6.5 | 8.5 | 7.5 | 6.0 | 6.5 | 6.0 | 8.5 | 7.0 |
| 11 | 3 | **Angular** | App framework | **7.06** | 9.0 | 8.5 | 4.5 | 7.0 | 5.0 | 5.5 | 8.5 | 6.5 | 9.0 |
| 12 | 3 | **React** | Rendering library | **7.04** | 7.0 | 7.0 | 6.0 | 6.5 | 5.0 | 6.5 | 10.0 | 8.0 | 9.0 |
| 13 | 3 | **Laravel Livewire** | App framework | **6.99** | 5.5 | 6.0 | 8.0 | 8.5 | 7.5 | 7.5 | 6.5 | 6.5 | 7.5 |
| 14 | 3 | **Preact** | Rendering library | **6.83** | 6.5 | 6.5 | 7.5 | 7.0 | 5.5 | 7.5 | 7.0 | 7.5 | 7.0 |
| 15 | 3 | **Qwik** | App framework | **6.54** | 7.5 | 5.5 | 7.5 | 8.0 | 6.0 | 7.0 | 4.5 | 6.0 | 6.0 |
| 16 | 4 | **TanStack Start** | App framework | **6.31** | 8.5 | 6.5 | 6.0 | 6.5 | 6.0 | 6.0 | 4.0 | 5.5 | 7.0 |
| 17 | 4 | **Next.js** | App framework | **6.30** | 8.5 | 7.0 | 4.5 | 5.0 | 3.5 | 6.0 | 9.0 | 4.5 | 9.0 |
| 18 | 4 | **htmx + HTML** | Enhancement utility | **6.22** | 2.0 | 2.5 | 9.5 | 8.0 | 8.0 | 9.0 | 6.5 | 7.5 | 5.0 |
| 19 | 4 | **Nuxt** | App framework | **6.21** | 7.0 | 6.0 | 5.5 | 5.0 | 5.5 | 7.5 | 6.5 | 6.0 | 8.0 |
| 20 | 4 | **Web Components + HTML** | Web-components library | **5.95** | 4.5 | 4.5 | 8.5 | 8.0 | 4.0 | 5.0 | 6.5 | 7.5 | 5.5 |
| 21 | 4 | **Alpine.js + HTML** | Enhancement utility | **5.91** | 2.0 | 2.5 | 9.0 | 7.0 | 7.5 | 8.0 | 6.5 | 8.0 | 5.0 |
| 22 | 4 | **SolidStart** | App framework | **5.67** | 7.5 | 5.0 | 6.0 | 6.0 | 4.5 | 6.0 | 4.5 | 4.5 | 6.5 |
| 23 | 5 | **Vanilla JS** | Baseline | **4.92** | 2.0 | 3.0 | 4.0 | 8.5 | 1.0 | 4.0 | 10.0 | 9.0 | 6.0 |

Two of the four tier boundaries are firm: tier 1/2 (gap 0.36) and tier 4/5 (gap 0.75). The 2/3 and 3/4 boundaries sit on gaps below the 0.25 noise floor — entries adjacent to those lines could swap tiers on a re-run.

*(htmx, Alpine.js, and native Web Components are reviewed as combo files — `htmx-html.md`, `alpine-html.md`, `web-components-html.md` — because they have no coherent standalone review. Each row scores the pairing a developer actually uses. See "Combo files" in `CLAUDE.md`.)*

### Notes on the top 5

**1. Elm** wins the two heaviest dimensions at once. Type-system integration and compiler feedback score 9.5 each — 30% of the total weight combined. "If it compiles, it works," and the error messages are famously written to *teach the fix*. That is precisely the feedback an autonomous agent iterates against. Convention strength (9.5) follows from Model-Update-View: there is no ambiguity about where anything lives. Familiarity (3.5) is what holds it back. Elm is a 2012 language with a small, devoted community. That gap is exactly what [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md)'s design proposal tries to close — Elm's guarantees, TypeScript's training-data gravity.

**2. Svelte** posts the best locality score in the list (9.5). A feature's state, markup, behavior, and styles live in one `.svelte` file. Token efficiency is near-best (9.0): runes are language-level, so a counter costs a handful of lines with no imports. It trails Elm on conventions and compiler guarantees. Svelte-the-language is more permissive about component patterns than Elm-the-architecture will ever be.

**3. Solid** rides the same profile as Svelte: fine-grained locality (9.0), high explicitness (8.5 — signals make the dependency graph literal), strong token efficiency (8.5). It carries a stability asterisk. Solid 2.0 is in beta with a reworked async model, and the `stability_score` (5.5) prices that in. Expect this rank to move once 2.0 lands.

**4. Astro** is the most *balanced* entry near the top — no dimension below 6.5. Islands architecture earns the explicitness score (8.5). The `client:*` directives put the static/interactive boundary in the markup itself, and "zero JS by default" keeps pages short.

**5. Remix** pairs a strong convention (8.0) with high locality and explicitness (8.5 each). The loader → component → action pattern means one route file shows how data arrives, renders, and mutates. The stability score (5.0) is the warning label. Remix 3 is in beta and drops React entirely. The thing this row describes is mid-rewrite (see Frameworks to Watch).

### The shape of the list

The flat table makes a core trade visible. The top of the list is **compiler-verified and high-locality at the same time**. Elm, Svelte, Solid, and Stencil keep a feature in one place *and* put a type checker between the agent and runtime. The middle holds frameworks that excel on one axis and pay on another. Phoenix LiveView is the corpus's explicitness champion (9.5), but Elixir's dynamic typing caps its type-system score at 5.5. Angular and Next.js post elite type and tooling scores yet scatter behavior across files (locality 4.5). The htmx and Alpine combos show the inverse profile in its purest form: superb locality and token efficiency (9.0+), almost no machine-checked layer (2.0–2.5). The floor is unchanged in spirit. Vanilla JS has perfect familiarity (10.0) and the worst convention score possible (1.0). "No philosophy — you decide everything" is exactly the wrong shape for an agent that must guess which of many valid patterns a codebase chose.

---

## List 2: State-Management Libraries

*"What should an agent reach for when the framework leaves this open?"*

| Rank | Library | Type | Weighted | TS | Build | Loc | Expl | Conv | Tok | Fam | Stab | Tool |
|------|---------|------|----------|----|-------|-----|------|------|-----|-----|------|------|
| 1 | **Jotai** | Atomic state | **7.89** | 8.5 | 7.5 | 8.5 | 8.0 | 7.0 | 8.5 | 7.5 | 7.5 | 7.5 |
| 2 | **Zustand** | Minimal store | **7.88** | 8.0 | 6.5 | 9.0 | 8.5 | 6.0 | 9.0 | 8.5 | 8.0 | 7.5 |
| 3 | **TanStack Query** | Server-state / cache | **7.87** | 8.5 | 7.5 | 8.5 | 7.5 | 6.5 | 7.5 | 8.5 | 8.0 | 8.5 |
| 4 | **Redux Toolkit** | Reducer / store | **7.13** | 8.0 | 6.5 | 4.5 | 8.5 | 7.0 | 5.0 | 9.0 | 8.0 | 9.0 |
| 5 | **XState** | State machine | **6.62** | 8.5 | 7.5 | 6.5 | 7.5 | 4.5 | 4.0 | 6.0 | 7.5 | 6.5 |
| 6 | **MobX** | Observable / mutable | **6.54** | 7.5 | 7.0 | 7.0 | 5.0 | 5.5 | 7.5 | 6.5 | 7.0 | 5.0 |

### Notes

**The top three are a statistical tie.** Jotai (7.89), Zustand (7.88), and TanStack Query (7.87) sit within 0.02 of each other — well inside the noise of a 0.5-granularity rubric. Read them as three co-winners *for three different jobs*: Jotai for fine-grained atomic client state, Zustand for a minimal centralized store, TanStack Query for server-state caching. The right question isn't "which ranks highest" but "which job do I have." Query plus one of the other two is a common, complementary pairing, not a choice.

**Jotai and Zustand** win the same way. A feature's state lives in one place (locality 8.5–9.0) and costs almost nothing to express (token efficiency 8.5–9.0). `const countAtom = atom(0)` is the whole API for a piece of state, and Zustand's evidence clocks a full todo app at 54 lines. Their shared soft spot is convention strength (6.0–7.0): both ecosystems tolerate several idiomatic store shapes. A codebase has to pick one, and an agent has to detect which.

**TanStack Query** is the most *balanced* of the trio — nothing below 6.5. "Server state is fundamentally different from client state" is an explicit, named boundary an agent can reason from. The `queryOptions` factory pattern keeps a query's key, fetcher, and types in one typed unit (type-system 8.5, locality 8.5). The dedicated DevTools make the cache inspectable (tooling 8.5).

**Redux Toolkit** is the cautionary tale for weighting familiarity too heavily. It is the most-recognized name on this list (9.0, second only to React and Vanilla JS in the corpus). It has the best DevTools story (9.0 — genuine time-travel debugging). But the slice/store/typed-hooks file spread drags locality to 4.5 and token efficiency to 5.0. Even with RTK's reduction over classic Redux, a basic slice still runs several times Zustand's line count.

**XState** is the cautionary tale on the *other* axis: explicitness pursued through heavyweight formalism. Explicit states and deterministic transitions are about as far from implicit magic as state management gets, and the machine definition is statically typed end to end (type-system 8.5). But the official TodoMVC runs 507 lines across 5 files, against Zustand's 54 in 2. The ecosystem also offers several coexisting authoring styles (convention 4.5). The formalism tax only pays off once the state shape is complex enough to need it.

**MobX** ranks last for the most rubric-legible reason in the corpus. Implicit dependency tracking *is* its core design, and the explicitness dimension (5.0) prices exactly that. A render re-runs because a proxy recorded a property read somewhere. That is the kind of invisible hop an agent can't grep for.

---

## Frameworks to Watch (don't trust today's rank for these)

This section is a **generated rollup** of the corpus's tracked `next_release` frontmatter. The per-framework "On the Horizon" data each review maintains is the single source of truth for "this is mid-rewrite" (see `## On the Horizon` in `CLAUDE.md`'s Review Template). Regenerate it with:

```bash
rg "next_release:" research/ -A 6
```

Pull every entry whose `status` is `alpha`, `beta`, `rfc`, or `announced`, or whose `stability_penalty` is `true`. Their `stability_score` already reflects the penalty; each review's Stability evidence holds the citation and reasoning. Their position will likely shift once the named release ships and stabilizes — in either direction. Don't read their current rank as a permanent verdict. Revisit them once their tracked release lands.

Current rollup — the entries carrying an active stability penalty, i.e. the ranks above to trust least:

| Framework | Tracked release | Status |
|---|---|---|
| Remix | Remix 3 (drops React, own component model) | beta |
| Solid | Solid 2.0 (reworked async model) | beta |
| SolidStart | SolidStart 2.0 ("DeVinxi") | alpha |
| SvelteKit | SvelteKit 3.0 | alpha |
| Qwik | @qwik.dev/core 2.0 (near-rewrite, new package scope) | beta |
| Stencil | Stencil v5 | rfc |
| TanStack Start | v1.0 stable + React Server Components | rc |

(Other tracked releases — Angular 23, Astro 7, htmx 4, Jotai v3, MobX 7, Nuxt 5, Phoenix LiveView 1.2, Preact 11, Vue 3.6 Vapor Mode, and the rest — currently carry `stability_penalty: false`. The per-review "On the Horizon" sections hold the detail.)

*(This rollup is regenerated each ranking pass from the query above. It carries no hand-maintained analysis of its own, so it can't drift out of sync with the per-framework tracking the way a hand-written list would.)*

---

## Bottom Line

Standing up a new project today and want the friendliest terrain for an AI agent? The data points toward compiler-verified, high-locality rendering layers: **Elm if you can afford its ecosystem, Svelte or Solid if you can't**. In these designs a feature lives in one file, and a type checker stands between the agent and runtime. The strongest *application framework* picks — Remix and SvelteKit — both carry caveats the table makes explicit. Remix is mid-rewrite. SvelteKit trades locality for its filename conventions.

Maybe explicitness and a single, server-centric mental model matter more to you than type coverage. Then **Phoenix LiveView** remains the corpus's data-flow-traceability champion — exactly the pattern [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md) draws on for its own design proposal. Elm's and Phoenix's familiarity gap is real. But the 2026 LLM-capability research says that gap is *shrinking*, and that is the whole bet behind the design proposal in the first place.

Choosing a state-management layer independent of your framework? The top of List 2 is a three-way tie that resolves by job, not rank. **TanStack Query** for server state. **Jotai or Zustand** for client state. Minimal API surface, explicit boundaries, and code short enough to hold entirely in view.

---

*This ranking is a snapshot, not a verdict. Frameworks evolve and models improve. The "best" answer six months from now may look different — that's exactly why the methodology above is written to be rerun, not just read.*
