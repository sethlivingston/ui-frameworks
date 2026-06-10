# The Best UI Frameworks for Agentic Development

This is the synthesis this whole research project was building toward: given everything we've learned reviewing the frameworks and libraries in `/research` and tracking how frontier LLMs have evolved, **which of these would you actually want an AI agent building your UI in today?**

> **Ranking version:** v1 — 2026-06-09
> **Inputs:** The reviews in [`/research`](./research/), their frontmatter scores, and the 2026 frontier-LLM-capability findings synthesized in [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md).
> **Ranking pass by:** Claude Fable 5 (each review's frontmatter records its own reviewing model)

---

## Methodology (read this first — and reuse it next time)

The goal of writing this section first is so that **six months from now, someone (human or AI) can re-run this exercise and produce a comparable v2** — and the *differences* between v1 and v2 become a signal in themselves (did the framework change, or did the models?).

### Scope: two lists, not one

Ranking Astro against Zustand is comparing a house to a doorknob — they solve different problems. So this doc produces **two ranked lists**:

1. **Full/meta-frameworks & rendering libraries** — the "what do I build the UI in" decision
2. **State-management libraries** — the "what do I reach for when the framework doesn't dictate this" decision

`vanilla-js` is included in list 1 as the baseline "no framework" option — useful as a floor to measure everything else against.

### A visible "what kind of thing is this" tag

"Full Frameworks, Meta-Frameworks & Rendering Libraries" still spans tools that do meaningfully different *jobs* — Astro optimizes for content sites rather than applications, Svelte and React are rendering layers that typically pair with a meta-framework (SvelteKit, Next.js) to become a full app stack, htmx and Alpine.js augment a backend rather than replacing one, and so on. Rather than dropping any of them — their scores are still real data points — **every entry carries a short `Type` tag** so the rank order can't be misread as "N interchangeable options for the same job":

| Tag | Meaning |
|---|---|
| **App framework** | Batteries-included or full-stack meta-framework — what you'd reach for to build and ship a complete application end to end |
| **Rendering library** | The component/rendering layer alone — typically paired with a meta-framework (Next.js, SvelteKit, SolidStart, Nuxt) to become a full app stack |
| **Content-site framework** | Optimized for content-heavy, low-interactivity sites (blogs, docs, marketing) — a different job than building an interactive application |
| **App architecture / language** | A language or architectural pattern for building whole applications, without the routing/meta-framework conventions of the "App framework" tier |
| **Web-components library** / **Web-components compiler** | Built for authoring reusable custom elements and design systems — component-level, not application-level (includes the native platform APIs used directly) |
| **Enhancement utility** | Augments existing server-rendered HTML with interactivity — pairs with a backend framework rather than replacing one |
| **Baseline** | The "no framework" floor everything else is measured against |

(List 2's libraries get a lighter version of the same idea — a one-word tag naming the state-management *style*, since they're already a fairly homogeneous category.)

### The nine dimensions, and the one transparent total

Each framework/library in `/research` is scored 0–10 on **9 flat dimensions**,
written directly to frontmatter by the research agent (`.claude/agents/
framework-researcher.md`) with a matching `### Evidence: <Dimension Name>` artifact
in the review body — no holistic composite stand-in, no per-section scoring
to reconcile. This is the corpus's single source of truth for scoring; this doc
doesn't re-derive or re-score anything, it only ranks from what's already evidenced.

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

**Why these weights, and why familiarity is the only composite**: see
`CLAUDE.md`'s Review Template (`## Rubric Evidence`) for the full per-dimension
evidence requirements, and `.claude/agents/framework-researcher.md` for the research
brief that operationalizes them — this doc shouldn't duplicate that reasoning, only
consume its output.

**The ranking below shows two things, deliberately, side by side:**

1. **All 9 raw scores per framework** — so you can re-derive *any* weighting you
   personally care about (token efficiency matters more to you than familiarity?
   recompute with your own numbers — the inputs are right there) without redoing any
   extraction work.
2. **One headline weighted total**, computed transparently as
   `Σ(weight × dimension score)` using the **same per-dimension weights already
   published in the rubric above** — not a freshly-invented vocabulary layered on
   top. This is arithmetic on numbers that are already public and already evidenced,
   not a new judgment-call-disguised-as-data translation layer. If you disagree with
   the rubric's weights, the flat table is right there for you to recompute your own.

### Caveats — read before trusting any single number

- **The rubric's weights are a judgment call**, settled once (see `CLAUDE.md` /
  the research brief) and reused consistently here rather than re-derived per
  ranking pass — that consistency is what makes the headline total comparable across
  re-runs. If the weights themselves change, that's a rubric-level decision (update
  `CLAUDE.md` and the agent brief), not a per-ranking-pass tweak.
- **Familiarity is the one deliberate composite** — its target (how much of a
  framework's usage patterns a model's pretraining covers) is fundamentally
  unmeasurable, so triangulating four imperfect proxies (age-weighted community
  volume, GitHub activity, registry trend direction, `first_released`) is the
  *correct* move here, not a shortcut. See that dimension's `### Evidence:` sections
  in the reviews for how each framework's triangulation was done — including the
  documented exception for CDN/script-tag-distributed tools (htmx, Alpine.js) whose
  registry numbers structurally undercount real usage.
- **`stability_score` reflects a snapshot** — frameworks actively shipping a
  breaking rewrite take a stability penalty sourced from their `next_release`
  frontmatter (see "Frameworks to Watch" below); expect their position to shift,
  in either direction, once the rewrite lands. Don't read their rank as a permanent
  verdict.
- **A high score here means "good raw material for an agent to work with," not "good
  for your project."** Team familiarity, hiring, ecosystem maturity for your specific
  domain, and a dozen other factors that have nothing to do with AI assistance still
  matter for real decisions.

### How to re-run this in six months

1. Run `npm run normalize && npm run index && npm run sync` to confirm the corpus's
   frontmatter is current and validates clean against `schema/framework-review.schema.json`.
2. For each framework, check whether its review has been refreshed since the last
   ranking pass (`reviewed_date` / `git log` on the file) — if not, that's a signal to
   queue it for the verification-first follow-on pass the research brief describes
   (`.claude/agents/framework-researcher.md`), not to re-rank stale scores.
3. Re-generate "Frameworks to Watch" by querying tracked `next_release` data —
   `rg "next_release:" research/ -A 5` surfaces every framework currently tracking an
   upcoming change; pull the ones with `status` of `alpha`/`beta`/`rfc` or
   `stability_penalty: true`.
4. Recompute the headline weighted total from the (now-current) 9 flat scores, re-rank,
   and **diff v1 vs. v2** — the motion is the interesting part. A framework whose
   flat scores barely moved but whose rank shifted tells you the *competition* changed;
   one whose scores moved but rank didn't tells you the opposite.

---

## List 1: Full Frameworks, Meta-Frameworks & Rendering Libraries

*"What should an agent build the UI in?"*

Column abbreviations follow the rubric table in the Methodology above, in the same order: **TS** = Type-system integration (15%), **Build** = Compiler/build feedback (15%), **Loc** = Locality of behavior (13%), **Expl** = Explicitness/traceability (13%), **Conv** = Convention strength (11%), **Tok** = Token efficiency (10%), **Fam** = Familiarity composite (11%), **Stab** = Stability (7%), **Tool** = Ecosystem tooling (5%). **Weighted** = `Σ(weight × dimension score)`.

| Rank | Framework | Type | Weighted | TS | Build | Loc | Expl | Conv | Tok | Fam | Stab | Tool |
|------|-----------|------|----------|----|-------|-----|------|------|-----|-----|------|------|
| 1 | **Elm** | App architecture / language | **8.06** | 9.5 | 9.5 | 8.5 | 9.5 | 9.5 | 6.5 | 3.5 | 7.0 | 6.0 |
| 2 | **Svelte** | Rendering library | **8.01** | 8.0 | 8.5 | 9.5 | 7.5 | 8.0 | 9.0 | 6.5 | 6.5 | 7.5 |
| 3 | **Solid** | Rendering library | **7.65** | 8.0 | 7.0 | 9.0 | 8.5 | 7.5 | 8.5 | 6.5 | 5.5 | 7.0 |
| 4 | **Astro** | Content-site framework | **7.54** | 7.5 | 7.5 | 8.0 | 8.5 | 7.5 | 7.5 | 6.5 | 6.5 | 8.0 |
| 5 | **Remix** | App framework | **7.54** | 8.0 | 7.0 | 8.5 | 8.5 | 8.0 | 7.0 | 7.0 | 5.0 | 7.5 |
| 6 | **Stencil** | Web-components compiler | **7.53** | 8.5 | 7.5 | 8.5 | 8.5 | 7.5 | 6.5 | 5.5 | 7.0 | 7.0 |
| 7 | **Phoenix LiveView** | App framework | **7.46** | 5.5 | 7.5 | 9.0 | 9.5 | 7.5 | 8.0 | 5.0 | 8.0 | 7.5 |
| 8 | **SvelteKit** | App framework | **7.36** | 8.5 | 7.5 | 5.5 | 8.0 | 8.5 | 7.5 | 6.0 | 6.5 | 8.0 |
| 9 | **Vue** | Rendering library | **7.29** | 7.5 | 7.0 | 7.5 | 6.5 | 6.0 | 7.5 | 8.5 | 7.5 | 8.5 |
| 10 | **Lit** | Web-components library | **7.10** | 7.5 | 6.5 | 8.5 | 7.5 | 6.0 | 6.5 | 6.0 | 8.5 | 7.0 |
| 11 | **Angular** | App framework | **7.06** | 9.0 | 8.5 | 4.5 | 7.0 | 5.0 | 5.5 | 8.5 | 6.5 | 9.0 |
| 12 | **React** | Rendering library | **7.04** | 7.0 | 7.0 | 6.0 | 6.5 | 5.0 | 6.5 | 10.0 | 8.0 | 9.0 |
| 13 | **Laravel Livewire** | App framework | **6.99** | 5.5 | 6.0 | 8.0 | 8.5 | 7.5 | 7.5 | 6.5 | 6.5 | 7.5 |
| 14 | **Preact** | Rendering library | **6.83** | 6.5 | 6.5 | 7.5 | 7.0 | 5.5 | 7.5 | 7.0 | 7.5 | 7.0 |
| 15 | **Qwik** | App framework | **6.54** | 7.5 | 5.5 | 7.5 | 8.0 | 6.0 | 7.0 | 4.5 | 6.0 | 6.0 |
| 16 | **TanStack Start** | App framework | **6.31** | 8.5 | 6.5 | 6.0 | 6.5 | 6.0 | 6.0 | 4.0 | 5.5 | 7.0 |
| 17 | **Next.js** | App framework | **6.30** | 8.5 | 7.0 | 4.5 | 5.0 | 3.5 | 6.0 | 9.0 | 4.5 | 9.0 |
| 18 | **htmx + HTML** | Enhancement utility | **6.22** | 2.0 | 2.5 | 9.5 | 8.0 | 8.0 | 9.0 | 6.5 | 7.5 | 5.0 |
| 19 | **Nuxt** | App framework | **6.21** | 7.0 | 6.0 | 5.5 | 5.0 | 5.5 | 7.5 | 6.5 | 6.0 | 8.0 |
| 20 | **Web Components + HTML** | Web-components library | **5.95** | 4.5 | 4.5 | 8.5 | 8.0 | 4.0 | 5.0 | 6.5 | 7.5 | 5.5 |
| 21 | **Alpine.js + HTML** | Enhancement utility | **5.91** | 2.0 | 2.5 | 9.0 | 7.0 | 7.5 | 8.0 | 6.5 | 8.0 | 5.0 |
| 22 | **SolidStart** | App framework | **5.67** | 7.5 | 5.0 | 6.0 | 6.0 | 4.5 | 6.0 | 4.5 | 4.5 | 6.5 |
| 23 | **Vanilla JS** | Baseline | **4.92** | 2.0 | 3.0 | 4.0 | 8.5 | 1.0 | 4.0 | 10.0 | 9.0 | 6.0 |

*(htmx, Alpine.js, and native Web Components are reviewed as combo files — `htmx-html.md`, `alpine-html.md`, `web-components-html.md` — because they have no coherent standalone review; the row scores the pairing a developer actually uses. See "Combo files" in `CLAUDE.md`.)*

### Notes on the top 5

**1. Elm** tops the list on the two heaviest dimensions at once: type-system integration and compiler feedback (9.5 each, 30% of the weight combined) — "if it compiles, it works," delivered by error messages famously written to *teach the fix*, which is precisely the feedback an autonomous agent iterates against. Convention strength (9.5) follows from Model-Update-View leaving no ambiguity about where anything lives. It's held back almost entirely by familiarity (3.5): a 2012 language with a small, devoted community — exactly the gap [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md)'s design proposal is trying to close (Elm's guarantees, TypeScript's training-data gravity).

**2. Svelte** posts the best locality score in the list (9.5 — a feature's state, markup, behavior, and styles live in one `.svelte` file) and near-best token efficiency (9.0 — runes are language-level, so a counter costs a handful of lines with no imports). It trails Elm on conventions and compiler guarantees: Svelte-the-language is more permissive about component patterns than Elm-the-architecture will ever be.

**3. Solid** rides the same profile as Svelte — fine-grained locality (9.0), high explicitness (8.5 — signals make the dependency graph literal), strong token efficiency (8.5) — with a stability asterisk: Solid 2.0 is in beta with a reworked async model, and its `stability_score` (5.5) carries the tracked penalty. Expect this rank to move once 2.0 lands.

**4. Astro** is the most *balanced* entry near the top — no dimension below 6.5. Islands architecture earns its explicitness (8.5): the `client:*` directives make the static/interactive boundary visible in the markup itself, and "zero JS by default" keeps pages short.

**5. Remix** pairs the loader → component → action convention (8.0) with high locality and explicitness (8.5 each) — one route file tells you how data arrives, renders, and mutates. The stability score (5.0) is the warning label: Remix 3 is in beta and drops React entirely, so the thing this row describes is mid-rewrite (see Frameworks to Watch).

### The shape of the list

The flat table makes a core trade visible. The top third is **compiler-verified and high-locality at the same time** — Elm, Svelte, Solid, Stencil all keep a feature in one place *and* put a type checker between the agent and runtime. The middle holds frameworks that are excellent on one axis and pay on another: Phoenix LiveView is the corpus's explicitness champion (9.5) but Elixir's dynamic typing caps its type-system score at 5.5; Angular and Next.js have elite type/tooling scores but scatter behavior across files (locality 4.5). The htmx and Alpine combos show the inverse profile in its purest form — superb locality and token efficiency (9.0+) with almost no machine-checked layer at all (2.0–2.5). And the floor is unchanged in spirit: Vanilla JS has perfect familiarity (10.0) and the worst convention score possible (1.0), because "no philosophy — you decide everything" is exactly the wrong shape for an agent that must guess which of many valid patterns a codebase chose.

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

**The top three are a statistical tie** — Jotai (7.89), Zustand (7.88), and TanStack Query (7.87) sit within 0.02 of each other, well inside the noise of any 0.5-granularity rubric. Read them as three co-winners *for three different jobs*: Jotai for fine-grained atomic client state, Zustand for a minimal centralized store, TanStack Query for server-state caching. The right question isn't "which ranks highest" but "which job do I have" — and Query plus one of the other two is a common, complementary pairing, not a choice.

**Jotai and Zustand** win the same way: a feature's state lives in one place (locality 8.5–9.0) and costs almost nothing to express (token efficiency 8.5–9.0 — `const countAtom = atom(0)` is the whole API for a piece of state; Zustand's evidence clocks a full todo app at 54 lines). Their shared soft spot is convention strength (6.0–7.0): both ecosystems tolerate several idiomatic shapes for the same store, so a codebase has to pick one and an agent has to detect which.

**TanStack Query** is the most *balanced* of the trio — nothing below 6.5 — because "server state is fundamentally different from client state" is an explicit, named conceptual boundary an agent can reason from, the `queryOptions` factory pattern keeps a query's key, fetcher, and types in one typed unit (type-system 8.5, locality 8.5), and the dedicated DevTools make the cache inspectable (tooling 8.5).

**Redux Toolkit** is the cautionary tale for weighting familiarity too heavily: the most-recognized name on this list (9.0, second only to React/Vanilla in the corpus) with the best DevTools story (9.0 — genuine time-travel debugging), but the slice/store/typed-hooks file spread drags locality to 4.5 and token efficiency to 5.0 — even with RTK's reduction over classic Redux, a basic slice still runs several times Zustand's line count.

**XState** is the cautionary tale on the *other* axis: explicitness pursued through heavyweight formalism. Explicit states and deterministic transitions are about as far from implicit magic as state management gets (type-system 8.5 — the machine definition is statically typed end to end), but the official TodoMVC runs 507 lines across 5 files against Zustand's 54 in 2, and the ecosystem offers several coexisting authoring styles (convention 4.5). The formalism tax only pays off once the state shape is complex enough to need it.

**MobX** ranks last for the most rubric-legible reason in the corpus: implicit dependency tracking *is* its core design, and the explicitness dimension (5.0) prices exactly that — a render re-runs because a proxy recorded a property read somewhere, which is the kind of invisible hop an agent can't grep for.

---

## Frameworks to Watch (don't trust today's rank for these)

This section is a **generated rollup** of the corpus's tracked `next_release`
frontmatter — the per-framework "On the Horizon" data each review maintains as its
single source of truth for "this is mid-rewrite" (see `## On the Horizon` in
`CLAUDE.md`'s Review Template). Regenerate it with:

```bash
rg "next_release:" research/ -A 6
```

...and pull every entry whose `status` is `alpha`, `beta`, `rfc`, or `announced`, or
whose `stability_penalty` is `true`. Their `stability_score` already reflects the
penalty (see that dimension's `### Evidence:` section in each review for the citation
and reasoning) — their position will likely shift, in either direction, once the
named release actually ships and stabilizes. Don't read their current rank as a
permanent verdict; revisit them specifically once their tracked release lands.

Current rollup — the entries carrying an active stability penalty, i.e. the ones
whose rank above should be trusted least:

| Framework | Tracked release | Status |
|---|---|---|
| Remix | Remix 3 (drops React, own component model) | beta |
| Solid | Solid 2.0 (reworked async model) | beta |
| SolidStart | SolidStart 2.0 ("DeVinxi") | alpha |
| SvelteKit | SvelteKit 3.0 | alpha |
| Qwik | @qwik.dev/core 2.0 (near-rewrite, new package scope) | beta |
| Stencil | Stencil v5 | rfc |
| TanStack Start | v1.0 stable + React Server Components | rc |

(Other tracked releases — Angular 23, Astro 7, htmx 4, Jotai v3, MobX 7, Nuxt 5,
Phoenix LiveView 1.2, Preact 11, Vue 3.6 Vapor Mode, and the rest — currently carry
`stability_penalty: false`; the per-review "On the Horizon" sections hold the detail.)

*(This rollup is regenerated each ranking pass from the query above — it
intentionally carries no hand-maintained analysis of its own, so it can't drift out
of sync with the per-framework tracking the way a hand-written list would.)*

---

## Bottom Line

If you're standing up a new project today and want the friendliest possible terrain for an AI agent to work in, **the data points toward compiler-verified, high-locality rendering layers — Elm if you can afford its ecosystem, Svelte or Solid if you can't** — designs where a feature lives in one file *and* a type checker stands between the agent and runtime. The strongest *application framework* picks (Remix, SvelteKit) both carry caveats the table makes explicit: Remix is mid-rewrite, and SvelteKit trades locality for its filename conventions.

If explicitness and a single, server-centric mental model matter more to you than type coverage, **Phoenix LiveView** remains the corpus's data-flow-traceability champion — exactly the pattern [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md) draws on for its own design proposal. Elm's and Phoenix's familiarity gap is real, but as the 2026 LLM-capability research notes, that gap is *shrinking* — which is the whole bet behind that design proposal in the first place.

And if you're choosing a state-management layer independent of your framework, the top of List 2 is a three-way tie that resolves by job, not rank: **TanStack Query** for server state, **Jotai or Zustand** for client state — minimal API surface, explicit boundaries, and code short enough to hold entirely in view.

---

*This ranking is a snapshot, not a verdict. Frameworks evolve, models improve, and the "best" answer six months from now may look different — that's exactly why the methodology above is written to be rerun, not just read.*
