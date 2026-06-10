# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This repository is a research project for building a next-generation UI framework optimized for AI-assisted development. The research involves reviewing existing UI frameworks and libraries to understand their approaches to:

1. **State management** - How data flows and updates in the framework
2. **Rendering** - How the framework translates state to UI
3. **Event handling** - How user interactions are captured and processed

Note: Not all frameworks/libraries implement all three aspects. Document what exists.

The ultimate goal is to identify patterns and build new paradigms that work better with AI assistance, moving beyond patterns designed primarily for human cognitive constraints.

## Documentation Structure

Store each framework review as a structured markdown file with YAML frontmatter. Use ripgrep for fast searching - at the scale of this research (hundreds of frameworks), ripgrep is faster and simpler than maintaining a database.

**Directory structure:**
```
research/
  react.md
  vue.md
  svelte.md
  solid.md
  htmx-html.md
  lit-preact.md
  ...
schema/
  framework-review.schema.json
```

Each framework gets one markdown file. Code examples are inline with syntax highlighting. If you later need separate example files for a specific framework, refactor to nested structure on demand.

**Combo files — naturally-paired technologies:** Some technologies have no coherent
standalone review (htmx and Alpine.js have no rendering or component model of their
own — scoring them in isolation would distort the rubric against dimensions that
don't really exist for them). For these, write **one complete file per pairing**
(e.g. `htmx-html.md`, `lit-preact.md`, `lit-stencil.md`) — its own full rubric run,
its own ranking row, scored as the unit a developer actually uses. A technology can
appear in as many combo files as make sense; there's no "pick the canonical pairing"
problem. Each combo file sets a `components: ["htmx", "html"]`-style frontmatter
field listing every technology it covers, so `rg "components:.*lit"` surfaces every
file that touches a technology — standalone or paired — keeping the corpus
ripgrep-searchable across both shapes.

**Frontmatter schema (YAML):**
```yaml
---
framework: "React"
version: "18.x"
category: "full-framework" | "state-library" | "rendering-library" | "reactive-primitive"

# Links & Resources
github_url: "https://github.com/facebook/react"
docs_url: "https://react.dev"
npm_package: "react"
ai_tooling:
  mcp_server:
    available: true/false
    url: "mcp server package/repo if exists"
    party: "first-party" | "third-party" | "community" | null
  guidelines: "curated AI-facing guidelines, e.g. a Laravel-Boost-style package, or null"
  llms_txt: true/false
  style_guides: "AI-specific style guides, or null"
  observed_delta: "what changed running the canonical exercise with vs. without this tooling, or null"

# Technical metadata
implementation_language: "JavaScript" | "TypeScript" | "Rust" | "Go" | etc.
typescript_support: "native" | "types-package" | "community-types" | "none"
license: "MIT" | "Apache-2.0" | etc.
runtime: "browser" | "node" | "both" | "deno" | "bun"

# Capabilities
capabilities:
  state_management: true/false
  rendering: true/false
  event_handling: true/false

# Classification (for searching)
paradigm: "declarative" | "reactive" | "imperative"
state_model: "immutable" | "mutable" | "signals" | "observables" | "atoms" | null
rendering_strategy: "virtual-dom" | "fine-grained" | "compiler" | "direct-dom" | null

# Maintenance
maintainer: "Meta" | "Vercel" | "Community" | etc.
first_released: "2013"
status: "active" | "maintenance" | "deprecated"

# Rubric scores (0-10, or null until evidence-gathering completes — see "Rubric
# Evidence" in the Review Template; each non-null score pairs with a body
# `### Evidence: <Dimension Name>` section by naming convention)
type_system_score: 7.0
compiler_feedback_score: 7.0
locality_score: 6.0
explicitness_score: 6.5
convention_strength_score: 6.0
token_efficiency_score: 6.5
familiarity_score: 9.0
stability_score: 7.0
tooling_score: 9.0

# On the Horizon (tracked, ranking-neutral — see "On the Horizon" in the Review
# Template; next_release is the evidence source the Stability dimension cites)
next_release:
  name: "..."
  status: "alpha" | "beta" | "rfc" | "announced" | null
  changes: "..."
  anticipated_impact: "..."
  stability_penalty: true/false

# Combo files only (see "Documentation Structure" below)
components: ["lit", "preact"]

# Rewrite-detection links (the Angular 1->2 problem)
supersedes: "framework-name-or-filename" | null
superseded_by: "framework-name-or-filename" | null

# Review metadata
reviewed_date: "YYYY-MM-DD"
reviewed_by_model: "Claude Sonnet 4.5" | "Claude Opus 4.5" | "GPT-4" | etc.
reviewer_notes: "any important context about this review"
---
```

**Benefits:**
- Single source of truth (no database sync issues)
- Human and AI readable
- YAML frontmatter enables structured queries via ripgrep
- Code examples embedded with syntax highlighting
- Easy to version control and diff
- Ripgrep searches entire corpus in milliseconds

**Example searches with ripgrep:**
```bash
# Find frameworks with state management
rg "state_management: true" research/ --type md

# Find fine-grained reactive frameworks
rg "rendering_strategy: \"fine-grained\"" research/ --type md

# Complex: frameworks with signals AND fine-grained rendering
rg -l "state_model: \"signals\"" research/ | xargs rg -l "rendering_strategy: \"fine-grained\""

# Count frameworks by paradigm
rg "^paradigm:" research/ --no-filename | sort | uniq -c

# Full-text search in reviews
rg "virtual dom" research/ -A 3 -B 3
```

## Synthesis Documents

On top of the per-framework reviews, the repo root holds a small set of synthesis documents that draw conclusions across the corpus:

- **README.md** - Entry point pointing visitors to the right document for what they need.
- **AGENTIC-DEV-RANKINGS.md** - Ranks the reviewed frameworks/libraries for agentic development. Designed to be re-run periodically (its own Methodology section explains how) so that v1, v2, v3, etc. stay comparable over time.
- **NEXT-GEN-FRAMEWORK.md** - Design principles for an AI-first UI framework, synthesized from the reviews.

**Writing guidance for these (and any future periodically-updated synthesis doc):** because they get revisited and re-run every several months, avoid prose that's tied to the moment it was written:
- No hardcoded counts that will drift ("24 frameworks," "18 entries") - reference the directory or describe the set instead.
- No narration of in-the-moment decisions ("while building this list, it became clear...", "X now carries a tag") - state the resulting design as a standing fact.
- No "as of this writing" / "right now" framing duplicated across sections - if a doc has a dedicated section for time-sensitive state (e.g., "Frameworks to Watch"), point to it from elsewhere rather than repeating the specifics in two places that can drift apart.
- TODOs about *this pass's* data gaps (e.g., "these files still have null scores, run X to fix") belong in a scratch note or the methodology's "how to re-run" steps - not narrated inline as if they're permanent facts about the data.

## Review Template

Each framework review should follow this structure. Use consistent headers for AI searchability. Not all sections apply to all frameworks - document what exists.

### State Management

```markdown
## State Management

### Philosophy & Mental Model
What's the core idea? How should developers think about state?
- [Bullet points describing the paradigm]
- [Single store vs distributed? Immutable vs mutable? Local vs global?]

### Core Primitives
What are the fundamental building blocks?
- [List primitives: atoms, stores, signals, reducers, observables, etc.]
- [What does each primitive do?]

### Update Mechanism
How does state change? What's the code pattern?
- [Describe the API and pattern]
- [Direct setter? Action/reducer? Signal assignment?]
- [Code snippet showing basic update]

### Read Pattern
How do components access/subscribe to state?
- [Describe access pattern: hooks, selectors, direct access, etc.]
- [Code snippet showing state consumption]

### Reactivity & Granularity
What re-renders when state changes?
- [Component-level? Selector-level? Fine-grained? Whole tree?]
- [How are unnecessary re-renders prevented?]
- [Automatic vs manual optimization?]

### Async Handling
How are async operations (data fetching, etc.) managed?
- [Built-in? Manual with useEffect? Middleware? Async primitives?]
- [Code snippet of async pattern]

### Derived State
How do you compute values from existing state?
- [Memoized selectors? Computed values? Derived atoms? Inline computation?]
- [Code snippet]

### Developer Experience
- **Boilerplate:** [high/medium/low with explanation]
- **DevTools:** [what's available for inspection/debugging]
- **Debugging:** [how easy to trace state changes]
- **Time travel:** [yes/no/with-utility]
```

### Rendering

```markdown
## Rendering

### Philosophy & Approach
What's the core rendering strategy?
- [Virtual DOM? Fine-grained reactivity? Compiled? Direct DOM manipulation?]
- [Declarative vs imperative?]

### Update Strategy
When and how does the UI update?
- [Reactive (automatic)? Manual? Batched? Scheduled?]
- [What triggers a render?]

### Reconciliation
How are changes detected and applied to the DOM?
- [Diffing algorithm? Dirty checking? Reactive dependencies? No diffing?]
- [How does it know what changed?]

### Templating & Syntax
How do you describe UI structure?
- [JSX? Template strings? HTML templates? Hyperscript? Tagged templates?]
- [Code snippet showing component syntax]

### Component Model
How are UI components structured?
- [Functions? Classes? Custom elements? Compiler output?]
- [Props/attributes pattern?]
- [Code snippet of basic component]

### Performance Optimizations
What's available to optimize rendering?
- [Memoization? Keys? Batching? Lazy loading? Suspense?]
- [Manual vs automatic optimization?]
- [What does the developer need to think about?]

### Developer Experience
- **Learning curve:** [easy/medium/hard with explanation]
- **DevTools:** [component inspection, render tracking, etc.]
- **Hot reload:** [support and quality]
```

### Event Handling

```markdown
## Event Handling

### Philosophy & Approach
How does the framework think about events?
- [Synthetic events? Native DOM events? Custom event system?]
- [Event delegation? Direct binding?]

### Event Binding
How do you attach event handlers to elements?
- [Inline in template? Separate registration? Directives?]
- [Code snippet showing event binding]

### Event Flow
How do events propagate?
- [Standard bubbling/capturing? Custom flow? No propagation?]
- [Can you stop propagation? How?]

### Event Object
What do handlers receive?
- [Synthetic event wrapper? Native event? Custom object?]
- [What properties are available?]
- [Code snippet showing event handler signature]

### Common Patterns
How do you handle typical scenarios?
- [Passing data to handlers]
- [Accessing component state in handlers]
- [Preventing default behavior]
- [Code snippets of common patterns]

### Performance Considerations
What should you know about event performance?
- [Event delegation used? Should you manually delegate?]
- [Handler cleanup required?]
- [Memory leak concerns?]

### Developer Experience
- **Debugging:** [how to debug event issues]
- **Type safety:** [event typing support]
```

### Rubric Evidence

Score once per framework, flat — not once per capability area. A real feature (a
counter, a todo list with add/remove) inherently crosses state → render → event
boundaries, so the evidence-gathering the rubric specifies (trace a feature, trace a
state change end-to-end) is cross-cutting by nature; per-area scoring would impose an
artificial boundary that doesn't match how the evidence is actually collected.

**Score lives in frontmatter, evidence lives in the body, linked by naming
convention** — frontmatter key `locality_score` pairs with body heading `### Evidence:
Locality of behavior` purely by matching names (no literal pointer field, which would
itself go stale the moment someone edits the doc). This is the whole mechanism behind
`rg -A 5 "Evidence: Locality"`-style queries and the `frontmatter score ↔ body
Evidence section` pairing — a naming mismatch silently breaks both. **Derive these
heading names directly from the `*_score` field list in
`schema/framework-review.schema.json`** — don't re-derive them independently from any
other prose description of the rubric (that would create exactly the
two-places-that-can-drift situation this file already warns against elsewhere).

```markdown
## Rubric Evidence

### Evidence: Type-system integration
Categorical fact (native/types-package/community/none) + a sample type error.
[What does the type checker actually catch? Show a deliberate type mistake and the
error it produces.]

### Evidence: Compiler/build feedback quality
Write a deliberately-broken example, capture the real error message.
[Paste the actual error transcript. Is it actionable? Does it point at the real
cause or somewhere else?]

### Evidence: Locality of behavior
Trace a representative feature, count the touchpoints.
[Pick one real feature (e.g. a counter or todo list). List every file/concept you
had to open to understand or change it, and the count.]

### Evidence: Explicitness / data-flow traceability
Trace one state change end-to-end, count implicit vs. explicit hops.
[Walk a single user action from trigger to render. For each hop, is it an explicit
call you can follow, or implicit framework magic?]

### Evidence: Convention strength
Grep docs/examples for alternative approaches to one canonical task, count them.
[Pick one common task (e.g. "fetch data on mount"). How many different
idiomatic-looking ways does the ecosystem actually do it?]

### Evidence: Token efficiency / boilerplate density
Implement (or cite) a canonical feature, count lines/tokens. Prefer a TodoMVC-style
canonical reference implementation when one exists — these are written and vetted by
people who know the framework well, building to an identical spec, which is far more
apples-to-apples than a freehand attempt. Only write a fresh minimal implementation
when no canonical reference exists, following the official style guide/idioms as
closely as possible.
[Cite the source (canonical repo or your own implementation + the style guide you
followed) and the line/token count.]

### Evidence: Familiarity composite
Age-weighted SO/community volume + GitHub activity + ecosystem-appropriate registry
trend (direction, not magnitude) + `first_released`. Note any structural undercount
(e.g. CDN/script-tag-distributed tools like htmx/Alpine.js whose registry numbers
don't reflect real usage — lean on GitHub stars/community volume for those).
[Show the four proxies and how they triangulate into the score.]

### Evidence: Stability / convention durability
Check changelog/roadmap/RFCs for announced breaking changes, cite + categorize. This
is the one dimension that should explicitly cite the framework's `next_release`
frontmatter — one source of truth for "this is mid-rewrite," rather than two
disconnected places asserting the same thing.
[Cite the changelog/roadmap/RFC entry. State whether it triggers the
`next_release.stability_penalty` flag and why.]

### Evidence: Ecosystem tooling facts
Checklist: yes/no + links — devtools, test utilities, IDE/LSP support.
[List what exists, with links. This is verification-side infrastructure, distinct
from the AI-tooling investment tracked in "On the Horizon" below.]
```

### On the Horizon

Tracked, surfaced, but **ranking-neutral** — these facts matter for understanding
where a framework is headed and what AI-tooling investment looks like today, but
neither should move the rubric scores directly (next-release info already feeds the
Stability dimension's evidence above; AI-tooling investment is tracked as an observed
fact, not weighted — see the brief in `.claude/agents/framework-researcher.md` for
why).

```markdown
## On the Horizon

### Next release
- **Name/version:** [what's coming]
- **Status:** alpha | beta | rfc | announced
- **What's changing:** [summary]
- **Anticipated impact:** [how this could change the rubric evidence above]
- **Stability penalty:** yes/no — [why, linking back to the Stability evidence]

### AI-tooling investment
- **What exists:** [official MCP server, curated guidelines (Boost-style), `llms.txt`,
  AI-specific style guides — link each]
- **Observed delta:** [run the canonical exercise from "Token efficiency" once with
  this tooling active and once without; record what actually changed — not just
  whether the tooling exists]
```

**Note documentation friction explicitly when it shapes evidence-gathering** — e.g.
"spent unusual effort locating the canonical state-update pattern; docs were
scattered across three guides with conflicting examples." Doc quality diffuses into
the evidence for several dimensions (convention strength via grepping docs, stability
via changelogs, code samples requiring docs to be idiomatic) rather than getting its
own rubric slot — but that argument only holds if friction actually shows up in the
evidence instead of being silently smoothed over by an agent that just tries harder
until it finds the answer. Calling it out explicitly is what keeps it visible.

Consistent structure enables AI to quickly locate specific information across all framework reviews.

## Research Methodology

When documenting a new framework:
1. Read official documentation and source code
2. Create practical examples demonstrating each capability — prefer a canonical
   reference implementation (TodoMVC-style) where one exists; see "Token efficiency"
   in the Rubric Evidence template
3. Score the framework against the 9-dimension flat rubric and write the evidence —
   see the `## Rubric Evidence` section of the Review Template above for the
   dimension list and what artifact each one needs (the canonical table lives in
   `AGENTIC-DEV-RANKINGS.md`'s methodology — don't re-derive the dimension list here)
4. Document anti-patterns from human-era thinking
5. Identify transferable patterns for next-gen framework

For the full research-agent brief — including the initial-vs-follow-on decision gate,
verification-as-front-half-of-follow-on, and the AI-tooling delta-capture protocol —
see `.claude/agents/framework-researcher.md`.
