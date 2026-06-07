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
  ...
schema/
  framework-review.schema.json
```

Each framework gets one markdown file. Code examples are inline with syntax highlighting. If you later need separate example files for a specific framework, refactor to nested structure on demand.

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
mcp_server:
  available: true/false
  url: "mcp server package/repo if exists"
  party: "first-party" | "third-party" | "community" | null

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
- **LANGUAGE-DESIGN.md** - A companion language proposal (StrictTS) for pairing with the framework design.

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

### AI-Friendly Assessment
- What makes this approach easy/hard for AI to work with?
- Explicitness vs implicit magic
- Locality of behavior (can you understand state by reading one file?)
- Predictability of data flow
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

### AI-Friendly Assessment
- How explicit is the render boundary?
- Can you predict what will render by reading code?
- How much framework-specific knowledge is required?
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

### AI-Friendly Assessment
- How explicit is event wiring?
- Can you find all handlers for an element by reading code?
- How much magic vs explicitness?
```

### Overall Assessment

```markdown
## AI-Assisted Development Considerations

### What Works Well with AI
- [Patterns that are explicit and predictable]
- [Good locality of behavior]
- [Clear cause and effect]

### What Creates Friction
- [Implicit behavior or magic]
- [Action at a distance]
- [Framework-specific mental models]

### Opportunities for Improvement
- [What could make this more AI-friendly?]
- [What human-era constraints could be removed?]
```

Consistent structure enables AI to quickly locate specific information across all framework reviews.

## Research Methodology

When documenting a new framework:
1. Read official documentation and source code
2. Create practical examples demonstrating each capability
3. Rate AI-friendliness based on:
   - Explicitness over implicitness
   - Locality of behavior
   - Predictability of patterns
   - Amount of boilerplate
   - Debugging clarity
4. Document anti-patterns from human-era thinking
5. Identify transferable patterns for next-gen framework
