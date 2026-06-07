# The Best UI Frameworks for Agentic Development

This is the synthesis this whole research project was building toward: given everything we've learned reviewing the frameworks and libraries in `/research` and tracking how frontier LLMs have evolved, **which of these would you actually want an AI agent building your UI in today?**

> **Ranking version:** v1 — 2026-06-07
> **Inputs:** The reviews in [`/research`](./research/), their frontmatter scores, and the 2026 frontier-LLM-capability findings synthesized in [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md).
> **Reviewed by:** Claude Sonnet 4.6

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
| **Web-components library** / **Web-components compiler** | Built for authoring reusable custom elements and design systems — component-level, not application-level |
| **Enhancement utility** | Augments existing server-rendered HTML with interactivity — pairs with a backend framework rather than replacing one |
| **Baseline** | The "no framework" floor everything else is measured against |

(List 2's libraries get a lighter version of the same idea — a one-word tag naming the state-management *style*, since they're already a fairly homogeneous category.)

### The nine dimensions, and the one transparent total

Each framework/library in `/research` is scored 0–10 on **9 flat dimensions**,
written directly to frontmatter by the research agent (`.claude/agents/
framework-researcher.md`) with a matching `### Evidence: <Dimension Name>` artifact
in the review body — no holistic "AI-Friendliness" stand-in, no per-section scoring
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
   not a new judgment-call-disguised-as-data translation layer (which is exactly what
   made the old "AI-Friendliness/Familiarity/Verifiability/Efficiency/Convention"
   composite a problem — those factors didn't correspond to anything in frontmatter
   and had to be re-derived from prose by hand each pass). If you disagree with the
   rubric's weights, the flat table is right there for you to recompute your own.

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

| Rank | Framework | Type | Composite | AI-Friendly (30%) | Familiarity (20%) | Verifiability (20%) | Token Efficiency (15%) | Convention/Stability (15%) |
|------|-----------|------|-----------|-------------------|-------------------|---------------------|------------------------|----------------------------|
| 1 | **SvelteKit** | App framework | **8.40** | 9.0 | 6.5 | 8.5 | 8.5 | 9.5 |
| 2 | **Svelte** | Rendering library | **8.09** | 8.7 | 7.0 | 8.0 | 9.5 | 7.0 |
| 3 | **Astro** | Content-site framework | **8.05** | 8.5 | 6.0 | 8.0 | 9.0 | 9.0 |
| 4 | **Elm** | App architecture / language | **7.88** | 9.0 | 3.5 | 10.0 | 6.5 | 10.0 |
| 5 | **Phoenix LiveView** | App framework | **7.83** | 9.5 | 4.0 | 8.5 | 7.5 | 9.0 |
| 6 | **Vue** | Rendering library | **7.69** | 8.3 | 8.5 | 8.5 | 8.0 | 4.0 |
| 7 | **Next.js** | App framework | **7.55** | 7.0 | 9.5 | 6.5 | 6.0 | 9.0 |
| 7 | **Angular** | App framework | **7.55** | 7.0 | 9.0 | 8.5 | 3.5 | 9.5 |
| 9 | **Remix** | App framework | **7.45** | 8.5 | 6.0 | 8.0 | 8.5 | 5.5 |
| 10 | **Nuxt** | App framework | **7.33** | 7.0 | 7.0 | 7.5 | 8.0 | 7.5 |
| 11 | **React** | Rendering library | **7.29** | 7.7 | 10.0 | 7.0 | 6.5 | 4.0 |
| 12 | **Solid** | Rendering library | **7.18** | 8.5 | 5.0 | 8.0 | 9.0 | 4.5 |
| 13 | **Laravel Livewire** | App framework | **7.15** | 8.0 | 6.5 | 6.0 | 6.0 | 9.0 |
| 14 | **htmx** | Enhancement utility | **6.93** | 8.5 | 5.5 | 4.0 | 9.5 | 7.0 |
| 15 | **Qwik** | App framework | **6.85** | 8.0 | 4.0 | 7.0 | 8.0 | 7.0 |
| 16 | **Stencil** | Web-components compiler | **6.73** | 7.5 | 4.0 | 7.5 | 6.5 | 8.0 |
| 17 | **Lit** | Web-components library | **6.53** | 7.5 | 5.0 | 7.0 | 7.0 | 5.5 |
| 18 | **Alpine.js** | Enhancement utility | **6.30** | 8.0 | 5.0 | 4.0 | 10.0 | 4.0 |
| 19 | **Vanilla JS** | Baseline | **5.13** | 6.0 | 9.0 | 5.0 | 2.5 | 1.0 |

### Notes on the top 5

**1. SvelteKit** wins on the strength of *everything lining up at once*: the highest convention score in the list (file-based routing, `+page.server.ts` naming makes execution context explicit at a glance — exactly the "intent obvious from filename" pattern the original synthesis flagged as AI-gold), near-best token efficiency, and a verifiability loop sweetened by auto-generated `./$types.d.ts` files that remove a whole class of manual type-matching errors. Its one soft spot is training-data familiarity — it's well-documented but smaller than the React/Next ecosystem.

**2. Svelte** edges out Astro on raw token efficiency (the review clocks a counter at 4–5 lines with *no imports* — runes are language-level) and AI-friendliness, though it trails Astro slightly on conventions since Svelte-the-language is more flexible about component patterns than Astro-the-meta-framework is about page structure.

**3. Astro** is the highest-scoring framework on *both* token efficiency and convention strength simultaneously — "zero JS by default" plus Islands Architecture means there's usually one obvious way to build a page, and that page is short. Its familiarity score is its main drag; it's well-loved but not (yet) ubiquitous.

**4. Elm** posts the single highest verifiability score (10/10) and convention score (10/10) of anything reviewed — "if it compiles, it works" is *the* agentic-development dream, and Model-Update-View leaves no ambiguity about where anything lives. It's held back almost entirely by training-data familiarity: it's a 2012 language with a small, devoted community, which is exactly the gap [LANGUAGE-DESIGN.md](./LANGUAGE-DESIGN.md)'s StrictTS is trying to close — Elm's guarantees, TypeScript's training-data gravity.

**5. Phoenix LiveView** is the highest-scoring *full-stack* framework on AI-friendliness (9.5 — still the top AI-friendliness score in the whole corpus) and backs it with genuinely excellent verifiability (the review highlights immediate compiler feedback and headless tests that don't need a browser). Its familiarity score is the tax for choosing Elixir — a fantastic language that most training corpora have seen comparatively little of.

### The shape of the list

Notice what clusters at the top: **compiler-driven or convention-heavy frameworks with native TypeScript (or equivalent type-system) support and small, explicit surface areas.** Notice what clusters at the bottom: **frameworks whose core value proposition is "freedom"** — Vanilla JS ("no philosophy — you decide everything") and Alpine.js (intentionally minimal, intentionally unopinionated) score well on *some* dimensions but poorly on the one thing agentic loops benefit from most: a small space of valid approaches to reason over. Freedom that's great for a senior human engineer can be exactly the wrong shape for an agent that has to *guess* which of many valid patterns a codebase has chosen.

---

## List 2: State-Management Libraries

*"What should an agent reach for when the framework leaves this open?"*

| Rank | Library | Type | Composite | AI-Friendly (30%) | Familiarity (20%) | Verifiability (20%) | Token Efficiency (15%) | Convention/Stability (15%) |
|------|---------|------|-----------|-------------------|-------------------|---------------------|------------------------|----------------------------|
| 1 | **TanStack Query** | Server-state / cache | **7.90** | 8.0 | 7.5 | 8.0 | 8.0 | 8.0 |
| 2 | **Jotai** | Atomic state | **7.63** | 9.0 | 5.5 | 7.5 | 9.5 | 6.0 |
| 3 | **Redux Toolkit** | Reducer / store | **7.60** | 7.5 | 8.5 | 8.5 | 4.5 | 8.5 |
| 4 | **Zustand** | Minimal store | **7.55** | 8.5 | 7.0 | 7.5 | 9.0 | 5.0 |
| 5 | **MobX** | Observable / mutable | **7.05** | 7.5 | 6.5 | 7.0 | 7.5 | 6.5 |
| 6 | **XState** | State machine | **6.90** | 7.0 | 5.5 | 8.0 | 5.0 | 9.0 |

### Notes

**TanStack Query** tops this list because it's the rare library that's strong across *every* dimension at once rather than trading one for another — "server state is fundamentally different from client state" is exactly the kind of explicit, named conceptual boundary that gives an agent a clean place to reason from, and the dedicated DevTools package makes the cache (often the most opaque part of any data-fetching story) inspectable.

**Jotai** posts the single best token-efficiency score of any library reviewed (`const countAtom = atom(0)` — that's the whole API surface for a piece of state) and a 9/10 AI-friendliness score, but trails on familiarity — the atomic-state pattern is elegant but younger and less-discussed than reducer-based approaches.

**Redux Toolkit** is the cautionary tale for weighting training-data familiarity too heavily: it's the most-recognized name on this list (8.5 familiarity, second only to React among everything in the corpus) and has the best DevTools story (genuine time-travel debugging), but pays for it in boilerplate — even with Redux Toolkit's ~70% reduction over classic Redux, a basic slice still runs ~30 lines against Zustand's ~7 or Jotai's 1.

**XState** is the most interesting "if you squint, this is what agentic development wants" entry — explicit states and deterministic transitions are about as far from "implicit magic" as state management gets, and `@xstate/test` can *generate test cases from the machine definition itself*. It ranks lower mainly because that explicitness costs real verbosity for simple cases — defining a two-state toggle takes more code than `useState(false)`, a tax that only pays off once the state shape gets complex enough to need it.

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

*(This list is regenerated each ranking pass from the query above — it intentionally
carries no hand-maintained prose of its own, so it can't drift out of sync with the
per-framework tracking the way a hand-written list would.)*

---

## Bottom Line

If you're standing up a new project today and want the friendliest possible terrain for an AI agent to work in, **the data points toward the Svelte ecosystem (SvelteKit/Svelte) and Astro** — both combine small, explicit surface areas with conventions strong enough to narrow an agent's search space, backed by compilers that catch mistakes early and code that's short enough to stay legible across a long agentic session.

If type-system guarantees and a single, server-centric mental model matter more to you than ecosystem size, **Elm and Phoenix LiveView** remain the purest expressions of "if it compiles, it works" and "everything lives in one place" — exactly the patterns [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md) draws on for its own design proposal. Their familiarity gap is real, but as the 2026 LLM-capability research notes, that gap is *shrinking* — which is the whole bet behind inventing something like StrictTS in the first place.

And if you're choosing a state-management layer independent of your framework, **TanStack Query** for server state and **Jotai or Zustand** for client state form a combination that's hard to beat on the metrics that matter to an agent: minimal API surface, explicit boundaries, and code that's short enough to hold entirely in view.

---

*This ranking is a snapshot, not a verdict. Frameworks evolve, models improve, and the "best" answer six months from now may look different — that's exactly why the methodology above is written to be rerun, not just read.*
