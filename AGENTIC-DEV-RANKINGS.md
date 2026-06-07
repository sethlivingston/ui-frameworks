# The Best UI Frameworks for Agentic Development

This is the synthesis this whole research project was building toward: given everything we've learned reviewing 24 frameworks/libraries and tracking how frontier LLMs have evolved, **which of these would you actually want an AI agent building your UI in today?**

> **Ranking version:** v1 — 2026-06-07
> **Inputs:** The 24 reviews in `/research`, their frontmatter scores, and the 2026 frontier-LLM-capability findings synthesized in [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md).
> **Reviewed by:** Claude Sonnet 4.6

---

## Methodology (read this first — and reuse it next time)

The goal of writing this section first is so that **six months from now, someone (human or AI) can re-run this exercise and produce a comparable v2** — and the *differences* between v1 and v2 become a signal in themselves (did the framework change, or did the models?).

### Scope: two lists, not one

Ranking Astro against Zustand is comparing a house to a doorknob — they solve different problems. So this doc produces **two ranked lists**:

1. **Full/meta-frameworks & rendering libraries** — the "what do I build the UI in" decision (18 entries)
2. **State-management libraries** — the "what do I reach for when the framework doesn't dictate this" decision (6 entries)

`vanilla-js` is included in list 1 as the baseline "no framework" option — useful as a floor to measure everything else against.

### A visible "what kind of thing is this" tag

While building this list, it became clear that "Full Frameworks, Meta-Frameworks & Rendering Libraries" still spans tools that do meaningfully different *jobs* — Astro optimizes for content sites rather than applications, Svelte and React are rendering layers that typically pair with a meta-framework (SvelteKit, Next.js) to become a full app stack, htmx and Alpine.js augment a backend rather than replacing one, and so on. Rather than dropping any of them — their scores are still real data points — **every entry now carries a short `Type` tag** so the rank order can't be misread as "18 interchangeable options for the same job":

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

### The five factors

Each framework/library is scored 0–10 on five factors, then combined into a weighted composite. The weights reflect a judgment call: **AI-friendliness matters most because it's the most holistic existing measure** (it already encodes explicitness, locality, and predictability from the original reviews); the other four factors are new lenses specific to *agentic* development that the original reviews didn't explicitly score for.

| # | Factor | Weight | What it measures | Where the score comes from |
|---|--------|--------|------------------|----------------------------|
| 1 | **AI-Friendliness** | 30% | Overall explicitness, locality of behavior, predictability — the holistic quality the original reviews were built to capture | Pulled directly from `ai_friendliness_score` in frontmatter. **Re-run note:** seven files (`react`, `solid`, `svelte`, `vue`, `jotai`, `tanstack-query`, `vanilla-js`) had `null` in frontmatter; for those, this score is the average of the "Overall AI-Friendliness," "Overall Rendering AI-Friendliness," and "Overall Event Handling AI-Friendliness" lines found in the review body. **Fix opportunity:** run `npm run extract-scores` to close this gap before the next pass. |
| 2 | **Training-data familiarity** | 20% | How much of the model's pretraining priors it can lean on — older, more popular, more-discussed frameworks give the model more to work with before it ever reads your code | Estimated tier based on ecosystem size, age (`first_released`), maintainer profile, and general knowledge of how much public code/discussion exists. **This is the softest of the five factors** — there's no API for "tokens of training data per framework." Re-scoring this in 6 months means re-asking: *"would a model trained today have seen a lot of this, a little, or none?"* |
| 3 | **Verifiability-loop quality** | 20% | How fast and unambiguous the compile→test→run feedback an agent gets is — this is the dimension the 2026 LLM-capability research surfaced as newly important, since agents now run code and self-correct rather than generating blind | Extracted from each review's "Developer Experience" / "DevTools" / "Debugging" subsections: native vs. community TypeScript support, compile-time error quality, test tooling, hot-reload speed |
| 4 | **Token efficiency / boilerplate density** | 15% | How much code (and therefore how many generation + context tokens) a typical small feature costs — leaner code means fewer chances for an agent to introduce inconsistency across a file, and cheaper iteration loops | Extracted from representative code samples and explicit "Boilerplate: low/medium/high" callouts in each review; scored 0–10 where 10 = least boilerplate |
| 5 | **Convention strength & stability** | 15% | How strongly the framework constrains *how* you build things (fewer valid approaches = smaller search space for an agent to reason over), penalized for being mid-rewrite right now | Base score from how opinionated the "Philosophy & Mental Model" section describes the framework as being, **minus a stability penalty** for frameworks currently shipping a breaking rewrite (see the 2026 framework-landscape section of NEXT-GEN-FRAMEWORK.md — Remix 3, Solid 2.0, Qwik 2.0, Vue Vapor Mode, htmx 4.0 all took a penalty here) |

**Composite score** = `0.30×AIF + 0.20×Familiarity + 0.20×Verifiability + 0.15×Efficiency + 0.15×Convention`

### Caveats — read before trusting any single number

- **Factor 2 (training-data familiarity) is an estimate, not a measurement.** No one outside the model labs can audit pretraining corpora. Treat the tiering as "informed judgment," and feel free to substitute a better proxy if one becomes available (e.g., GitHub repo counts, Stack Overflow question volume, npm download trends).
- **Several frameworks are mid-rewrite right now** (Remix 3, Solid 2.0, Qwik 2.0, Vue 3.6 Vapor Mode, htmx 4.0 — all in beta as of this writing). Their scores reflect *today's* stable release with a stability penalty applied; their position will likely shift — in either direction — once those land. Don't read their rank as a permanent verdict.
- **The weights are a judgment call**, not a derived constant. If you think token efficiency should matter more than training-data familiarity, change the weights and recompute — the per-factor scores in the tables below are there so you can do exactly that without redoing the extraction work.
- **A high score here means "good raw material for an agent to work with," not "good for your project."** Team familiarity, hiring, ecosystem maturity for your specific domain, and a dozen other factors that have nothing to do with AI assistance still matter for real decisions.

### How to re-run this in six months

1. Re-run `npm run extract-scores && npm run normalize && npm run sync && npm run index` so frontmatter `ai_friendliness_score` is complete (closes the gap noted in Factor 1).
2. Re-spot-check the frameworks that were flagged as "mid-rewrite" — have Remix 3 / Solid 2.0 / Qwik 2.0 / Vue Vapor / htmx 4.0 gone stable? Re-score factors 4 and 5 against the new stable release, and lift the stability penalty.
3. Re-derive Factor 2 (familiarity) — has anything's popularity meaningfully shifted? New frameworks worth adding to the corpus entirely?
4. Re-derive Factor 3 (verifiability) — this is the factor most likely to be reshaped by *model* improvements rather than *framework* improvements (e.g., if agentic tooling gets good enough at running any framework's dev server and reading its errors, the gap between "good DX" and "great DX" frameworks may compress).
5. Recompute the composite, re-rank, and **diff v1 vs. v2** — the motion is the interesting part.

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
| 10 | **React** | Rendering library | **7.29** | 7.7 | 10.0 | 7.0 | 6.5 | 4.0 |
| 11 | **Solid** | Rendering library | **7.18** | 8.5 | 5.0 | 8.0 | 9.0 | 4.5 |
| 12 | **Laravel Livewire** | App framework | **7.15** | 8.0 | 6.5 | 6.0 | 6.0 | 9.0 |
| 13 | **htmx** | Enhancement utility | **6.93** | 8.5 | 5.5 | 4.0 | 9.5 | 7.0 |
| 14 | **Qwik** | App framework | **6.85** | 8.0 | 4.0 | 7.0 | 8.0 | 7.0 |
| 15 | **Stencil** | Web-components compiler | **6.73** | 7.5 | 4.0 | 7.5 | 6.5 | 8.0 |
| 16 | **Lit** | Web-components library | **6.53** | 7.5 | 5.0 | 7.0 | 7.0 | 5.5 |
| 17 | **Alpine.js** | Enhancement utility | **6.30** | 8.0 | 5.0 | 4.0 | 10.0 | 4.0 |
| 18 | **Vanilla JS** | Baseline | **5.13** | 6.0 | 9.0 | 5.0 | 2.5 | 1.0 |

### Notes on the top 5

**1. SvelteKit** wins on the strength of *everything lining up at once*: the highest convention score in the list (file-based routing, `+page.server.ts` naming makes execution context explicit at a glance — exactly the "intent obvious from filename" pattern the original synthesis flagged as AI-gold), near-best token efficiency, and a verifiability loop sweetened by auto-generated `./$types.d.ts` files that remove a whole class of manual type-matching errors. Its one soft spot is training-data familiarity — it's well-documented but smaller than the React/Next ecosystem.

**2. Svelte** edges out Astro on raw token efficiency (the review clocks a counter at 4–5 lines with *no imports* — runes are language-level) and AI-friendliness, though it trails Astro slightly on conventions since Svelte-the-language is more flexible about component patterns than Astro-the-meta-framework is about page structure.

**3. Astro** is the highest-scoring framework on *both* token efficiency and convention strength simultaneously — "zero JS by default" plus Islands Architecture means there's usually one obvious way to build a page, and that page is short. Its familiarity score is its main drag; it's well-loved but not (yet) ubiquitous.

**4. Elm** posts the single highest verifiability score (10/10) and convention score (10/10) of anything reviewed — "if it compiles, it works" is *the* agentic-development dream, and Model-Update-View leaves no ambiguity about where anything lives. It's held back almost entirely by training-data familiarity: it's a 2012 language with a small, devoted community, which is exactly the gap [LANGUAGE-DESIGN.md](./LANGUAGE-DESIGN.md)'s StrictTS is trying to close — Elm's guarantees, TypeScript's training-data gravity.

**5. Phoenix LiveView** is the highest-scoring *full-stack* framework on AI-friendliness (9.5 — still the top score in the entire 24-framework corpus) and backs it with genuinely excellent verifiability (the review highlights immediate compiler feedback and headless tests that don't need a browser). Its familiarity score is the tax for choosing Elixir — a fantastic language that most training corpora have seen comparatively little of.

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

These five are mid-rewrite as of this ranking — the version reviewed and scored is the *current stable* release, with a stability penalty applied to Factor 5. Revisit them specifically once their next major version stabilizes:

- **Remix 3** (beta) — drops React entirely for its own web-standards component model. This isn't an iteration, it's a different framework wearing a familiar name; expect familiarity and convention scores to reset closer to zero on launch, then rebuild.
- **Solid 2.0** (beta) — reworked async model (`createMemo` gets first-class Promises, redesigned Suspense). Could meaningfully change the verifiability and token-efficiency story for async-heavy UIs.
- **Qwik 2.0** (beta) — near-rewrite with new package scope and primitives. Resumability — Qwik's whole reason for existing — extends into new territory (`worker$`, `useAsyncComputed$`).
- **Vue 3.6 "Vapor Mode"** (beta) — compiles away the virtual DOM entirely. If it ships, Vue's `rendering_strategy` classification itself changes, which could shift its verifiability and efficiency scores upward.
- **htmx 4.0** (beta) — makes attribute inheritance *explicit* via `:inherited` (previously implicit). This is a rare case where a beta change should *improve* a framework's AI-friendliness score on arrival — it's removing exactly the kind of implicit behavior this whole research project flags as friction.

---

## Bottom Line

If you're standing up a new project today and want the friendliest possible terrain for an AI agent to work in, **the data points toward the Svelte ecosystem (SvelteKit/Svelte) and Astro** — both combine small, explicit surface areas with conventions strong enough to narrow an agent's search space, backed by compilers that catch mistakes early and code that's short enough to stay legible across a long agentic session.

If type-system guarantees and a single, server-centric mental model matter more to you than ecosystem size, **Elm and Phoenix LiveView** remain the purest expressions of "if it compiles, it works" and "everything lives in one place" — exactly the patterns [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md) draws on for its own design proposal. Their familiarity gap is real, but as the 2026 LLM-capability research notes, that gap is *shrinking* — which is the whole bet behind inventing something like StrictTS in the first place.

And if you're choosing a state-management layer independent of your framework, **TanStack Query** for server state and **Jotai or Zustand** for client state form a combination that's hard to beat on the metrics that matter to an agent: minimal API surface, explicit boundaries, and code that's short enough to hold entirely in view.

---

*This ranking is a snapshot, not a verdict. Frameworks evolve, models improve, and the "best" answer six months from now may look different — that's exactly why the methodology above is written to be rerun, not just read.*
