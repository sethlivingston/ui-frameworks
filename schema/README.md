# Framework Review Schema

This directory contains the schema definition for UI framework/library reviews in the research project.

## Files

- `framework-review.schema.json` - JSON Schema (machine-readable)
- `README.md` - This file (human-readable documentation)

## Overview

Every markdown file in `/research/` must have YAML frontmatter that conforms to this schema. The frontmatter appears at the top of each file between `---` delimiters.

## Required Fields

These fields must be present in every framework review:

- **name** (string) - Official name (framework, library, tool, language, etc.)
- **category** (string) - Classification (see allowed values below)
- **github_url** (string) - GitHub repository URL
- **docs_url** (string) - Official documentation URL
- **implementation_language** (string) - Primary implementation language
- **status** (string) - Current maintenance status
- **type_system_score** (number or null) - Type-system integration (0-10)
- **compiler_feedback_score** (number or null) - Compiler/build feedback quality (0-10)
- **locality_score** (number or null) - Locality of behavior (0-10)
- **explicitness_score** (number or null) - Explicitness / data-flow traceability (0-10)
- **convention_strength_score** (number or null) - Convention strength (0-10)
- **token_efficiency_score** (number or null) - Token efficiency / boilerplate density (0-10)
- **familiarity_score** (number or null) - Familiarity composite (0-10)
- **stability_score** (number or null) - Stability / convention durability (0-10)
- **tooling_score** (number or null) - Ecosystem tooling facts (0-10)

These nine are required-but-nullable: the field must be present so the rubric stays
complete and queryable, but `null` is permitted so a freshly-scaffolded review can
validate before evidence-gathering completes. Each non-null score should be backed
by a `### Evidence: <Dimension Name>` section in the body, linked by naming
convention (e.g. `locality_score` ↔ `### Evidence: Locality of behavior`).

## Recommended Fields

These fields should be filled in when applicable:

- **version** - Current/reviewed version number
- **type** - More specific type (e.g., "React Framework", "State Machine Library")
- **npm_package** - NPM package name
- **components** - Array of technology identifiers, present only on combo files
  (e.g. `["lit", "preact"]`) — keeps `rg "components:.*lit"` surfacing every file
  that touches a technology, standalone or paired
- **next_release** - Tracked, ranking-neutral info about an upcoming release:
  `{ name, status, changes, anticipated_impact, stability_penalty }`. This is the
  evidence source the `stability_score` dimension's `### Evidence:` section cites
- **ai_tooling** - Tracked, ranking-neutral facts about AI-tooling investment:
  `{ mcp_server: { available, url, party }, guidelines, llms_txt, style_guides,
  observed_delta }`
- **supersedes** / **superseded_by** - Framework name or filename references that
  link a rewrite (e.g. AngularJS → Angular) to its predecessor/successor review
- **typescript_support** - Level of TypeScript support
- **license** - Open source license
- **runtime** - Where the framework can run
- **capabilities** - Object describing what the framework handles
  - `state_management` (boolean)
  - `rendering` (boolean)
  - `event_handling` (boolean)
- **paradigm** - Programming paradigm (declarative, reactive, imperative, etc.)
- **state_model** - How state is managed (immutable, mutable, signals, atoms, etc.)
- **rendering_strategy** - How rendering works (virtual-dom, fine-grained, compiler, etc.)
- **maintainer** - Primary maintainer or organization
- **first_released** - Year of first release
- **reviewed_date** - Date review was completed (YYYY-MM-DD)
- **reviewed_by_model** - AI model used for review
- **reviewer_notes** - Optional notes about the review

## Category Enum

When choosing a category, use one of these kebab-case values:

- `full-framework` - Complete application framework (React, Vue, Angular, Svelte)
- `meta-framework` - Framework that extends another framework (Next.js, Remix, SvelteKit)
- `state-library` - State management library (Redux, Zustand, Jotai)
- `rendering-library` - Rendering-focused library (Lit, Preact)
- `reactive-primitive` - Reactive building block (Solid, Qwik, Alpine)
- `web-components-library` - Web components library (Lit, Shoelace)
- `web-components-compiler` - Compiler that generates web components (Stencil)
- `server-framework` - Server-side framework (Phoenix, Laravel Livewire)
- `utility-library` - Utility/helper library (TanStack Query, htmx)
- `language` - Full programming language (Elm)
- `no-framework` - Vanilla JavaScript / no framework

**Note:** Normalization script will map free-text categories (e.g., "Library", "State Management Library") to these enum values.

## Implementation Language Enum

- JavaScript
- TypeScript
- Rust
- Go
- Python
- Java
- Elixir
- PHP
- Haskell

## TypeScript Support Enum

- `native` - Written in TypeScript, full TS support out of the box
- `types-package` - Separate `@types/` or `.d.ts` package available
- `community-types` - Community-maintained type definitions
- `none` - No TypeScript support

## Paradigm Enum

- `declarative` - Describe what you want, framework handles how
- `reactive` - Automatic reactivity to state changes
- `imperative` - Tell the framework exactly what to do
- `functional` - Functional programming approach

## State Model Enum

- `immutable` - State is immutable, updates create new objects (React, Jotai)
- `mutable` - State is mutable, direct mutation triggers updates (Vue, MobX)
- `signals` - Signals are fine-grained reactive values (Solid, Angular)
- `observables` - RxJS-style observable streams
- `atoms` - Atomic units of state (Jotai)
- `reducers` - Redux-style action/reducer pattern
- `queries` - Server state as queries (TanStack Query)
- `reactive-properties` - Reactive object properties
- `streams` - Functional reactive streams

## Rendering Strategy Enum

- `virtual-dom` - Virtual DOM diffing (React, Vue)
- `fine-grained` - Fine-grained reactivity to track specific changes (Solid)
- `compiler` - Compile-time optimizations (Svelte, Qwik)
- `direct-dom` - Direct DOM manipulation (Alpine, htmx)
- `server-side` - Server-side rendering (Astro, Remix)
- `hydration` - Hydrate server-rendered HTML (Next.js, SvelteKit)
- `resumable` - Resume execution instead of hydrate (Qwik)

## Runtime Enum

- `browser` - Client-side browser only
- `node` - Node.js server only
- `both` - Works in both browser and Node.js
- `deno` - Deno runtime
- `bun` - Bun runtime
- `server` - Generic server environment

## Status Enum

- `active` - Actively maintained with recent updates
- `maintenance` - Maintained but not actively developed
- `deprecated` - Officially deprecated, moving to something else
- `archived` - No longer maintained

## Example: Complete Frontmatter

```yaml
---
name: "React"
version: "19.2.1"
category: "full-framework"
type: "UI Framework"

github_url: "https://github.com/facebook/react"
docs_url: "https://react.dev"
npm_package: "react"

# Technical metadata
implementation_language: "JavaScript"
typescript_support: "types-package"
license: "MIT"
runtime: "browser"

# Capabilities
capabilities:
  state_management: true
  rendering: true
  event_handling: true

# Classification (for searching)
paradigm: "declarative"
state_model: "immutable"
rendering_strategy: "virtual-dom"

# Maintenance
maintainer: "Meta"
first_released: "2013"
status: "active"

# Rubric scores (0-10, null until evidence-gathering completes)
type_system_score: 6.0
compiler_feedback_score: 7.0
locality_score: 5.5
explicitness_score: 6.5
convention_strength_score: 6.0
token_efficiency_score: 6.5
familiarity_score: 9.5
stability_score: 7.0
tooling_score: 9.0

# On the Horizon (tracked, ranking-neutral)
next_release:
  name: "React 19.x"
  status: "rfc"
  changes: "Compiler-driven memoization (React Compiler)"
  anticipated_impact: "Reduces manual useMemo/useCallback boilerplate"
  stability_penalty: false

ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: null

supersedes: null
superseded_by: null

# Review metadata
reviewed_date: "2025-12-06"
reviewed_by_model: "Claude Sonnet 4.5"
reviewer_notes: "Comprehensive review of React state, rendering, and event systems."
---
```

## Example: Minimal Frontmatter (only required fields)

```yaml
---
name: "MyProject"
category: "full-framework"
github_url: "https://github.com/..."
docs_url: "https://..."
implementation_language: "JavaScript"
status: "active"
type_system_score: null
compiler_feedback_score: null
locality_score: null
explicitness_score: null
convention_strength_score: null
token_efficiency_score: null
familiarity_score: null
stability_score: null
tooling_score: null
---
```

## Validation

The `framework-review.schema.json` file can be used to validate frontmatter:

- **JSON Schema validators** - Use any JSON Schema v7 validator
- **IDE plugins** - Many editors support JSON Schema validation for YAML
- **Build scripts** - The `build-index.js` script validates against this schema

To validate all files:

```bash
npm run index
```

This will generate a validation report showing any files with missing or invalid fields.

## Using the Schema in Your Editor

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "yaml.schemas": {
    "./schema/framework-review.schema.json": "/research/*.md"
  }
}
```

This enables schema validation and autocomplete in YAML frontmatter!

### Running Validation & Normalization

```bash
# Validate all files and generate index
npm run index

# Normalize frontmatter (fixes field names, categories, etc.)
npm run normalize
```

## Notes

- Use `null` for optional fields that don't apply to a framework
- Scores must be between 0 and 10 (decimals allowed: 7.5, 8.3, etc.)
- Dates must be in YYYY-MM-DD format
- URLs must be valid URIs
- Framework names should use official capitalization (React, Vue, Svelte, etc.)
