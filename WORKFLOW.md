# Research Workflow

This document describes the proper workflow for maintaining the UI frameworks research project.

## Quick Reference: Available Commands

```bash
# Normalize all frontmatter to match schema (fixes field names, categories, missing fields)
npm run normalize

# Sync all markdown files' frontmatter with the generated index
npm run sync

# Build the searchable index and validate all frontmatter
npm run index
```

## Complete Workflow

### After Adding or Updating Framework Reviews

When you add a new framework review or update an existing one:

1. **Normalize frontmatter** (to ensure consistency with schema)
   ```bash
   npm run normalize
   ```
   This:
   - Fixes field names (e.g., `framework` → `name`)
   - Normalizes categories (e.g., "State Management Library" → "state-library")
   - Adds missing required fields
   - Reorders fields for readability

2. **Build index and validate**
   ```bash
   npm run index
   ```
   This:
   - Generates `/research/frameworks.json` with all structured data
   - Validates all frontmatter against the schema
   - Reports any errors or warnings
   - Shows statistics (paradigms, state models, rendering strategies)

3. **Sync markdown files with index**
   ```bash
   npm run sync
   ```
   This updates each markdown file's frontmatter to match exactly what's in the index. Ensures single source of truth.

### Recommended: Single Command for Everything

If you want to do all steps at once:

```bash
npm run normalize && npm run index && npm run sync
```

Or in reverse order if you're confident your frontmatter is clean:

```bash
npm run normalize && npm run sync && npm run index
```

## Frontmatter: Source of Truth

The relationship between markdown files and the index:

```
Markdown files (source)
    ↓
    ├─ Normalize to schema
    └─ Sync with index
    ↓
frameworks.json (single source of truth)
    ├─ Used for querying
    ├─ Used for validation
    └─ Synced back to markdown files
```

**Key principle**: The index is generated FROM the markdown frontmatter, but then synced BACK to keep everything in sync.

## Schema Compliance

All frontmatter must conform to `/schema/framework-review.schema.json`:

**Required fields:**
- `name` - Official name of framework/library/tool/language
- `category` - One of: full-framework, meta-framework, state-library, etc.
- `github_url` - GitHub repository URL
- `docs_url` - Official documentation URL
- `implementation_language` - Programming language
- `status` - active, maintenance, deprecated, archived
- `type_system_score` - Number 0-10 or null (Type-system integration)
- `compiler_feedback_score` - Number 0-10 or null (Compiler/build feedback quality)
- `locality_score` - Number 0-10 or null (Locality of behavior)
- `explicitness_score` - Number 0-10 or null (Explicitness / data-flow traceability)
- `convention_strength_score` - Number 0-10 or null (Convention strength)
- `token_efficiency_score` - Number 0-10 or null (Token efficiency / boilerplate density)
- `familiarity_score` - Number 0-10 or null (Familiarity composite)
- `stability_score` - Number 0-10 or null (Stability / convention durability)
- `tooling_score` - Number 0-10 or null (Ecosystem tooling facts)

`null` is permitted on the score fields so a freshly-scaffolded review can validate
before evidence-gathering completes — each non-null score should be backed by a
matching `### Evidence: <Dimension Name>` section in the body.

**Recommended fields:**
- `version` - Current reviewed version
- `npm_package` - NPM package name
- `components` - Array of technology identifiers, present only on combo files (e.g. `["lit", "preact"]`)
- `next_release` - Tracked next-release info: `{ name, status, changes, anticipated_impact, stability_penalty }`
- `ai_tooling` - Tracked AI-tooling investment: `{ mcp_server, guidelines, llms_txt, style_guides, observed_delta }`
- `supersedes` / `superseded_by` - Framework name or filename references linking rewrite-detection chains
- `typescript_support` - native, types-package, community-types, none
- `license` - MIT, Apache-2.0, etc.
- `runtime` - browser, node, both, deno, bun, server
- `capabilities` - Object with state_management, rendering, event_handling
- `paradigm` - declarative, reactive, imperative, functional
- `state_model` - immutable, mutable, signals, observables, atoms, reducers, queries, etc.
- `rendering_strategy` - virtual-dom, fine-grained, compiler, direct-dom, server-side, hydration, resumable
- `maintainer` - Who maintains it
- `first_released` - Year
- `reviewed_date` - YYYY-MM-DD format
- `reviewed_by_model` - AI model used for review

See `/schema/README.md` for complete documentation.

## Editing Workflow

Research agents write the 9 rubric scores straight to frontmatter (no body→frontmatter
extraction step exists or is needed) — the body's `### Evidence: <Dimension Name>`
sections hold the supporting artifact, linked to the score by naming convention.

1. Edit the markdown content (state mgmt, rendering, event handling sections, and
   the `## Rubric Evidence` / `## On the Horizon` sections, including frontmatter
   scores)
2. Run `npm run normalize` to fix any issues
3. Run `npm run index && npm run sync` to update index

## Validation Output

When you run `npm run index`, you'll see:

```
✅ react.md           # Valid with no warnings
⚠️  vanilla-js.md     # Valid but has warnings
❌ some-file.md       # Errors (missing required fields)
```

Followed by a summary:
```
📋 Validation Report:
   ✅ Valid: 24
   ⚠️  Warnings: 0
```

**Zero errors and warnings is the goal.**

## IDE Integration: VS Code

Add schema validation to `.vscode/settings.json`:

```json
{
  "yaml.schemas": {
    "./schema/framework-review.schema.json": "/research/*.md"
  }
}
```

This enables:
- Real-time validation while editing
- Autocomplete for field names
- Documentation on hover
- Error highlighting for invalid values

## Committing to Git

Good workflow before committing:

1. Make changes to framework reviews
2. Run: `npm run normalize && npm run sync && npm run index`
3. Verify validation report shows all files valid with no errors
4. Review changes with `git diff`
5. Commit

The `.gitignore` includes:
- `/research/frameworks.json` (generated)
- `node_modules/` (generated)
- `.claude/` (user-specific config)

So you only commit:
- `/research/*.md` files (source reviews)
- `/schema/` (schema definition)
- `/scripts/` (build scripts)
- `package.json`, `package-lock.json`
- `CLAUDE.md`, `WORKFLOW.md`, `.gitignore`

## Troubleshooting

### "Validation Report: ❌ Errors: X"

The error message will tell you what's wrong. Common issues:

- `Missing required field: name` - Frontmatter has `framework` instead of `name`
- `category: "X" not in allowed values` - Category isn't in the enum (run normalize)
- `Missing required field: status` - Add `status: "active"` to frontmatter

**Fix with**: `npm run normalize`

### "Frontmatter mismatch between markdown and index"

This shouldn't happen if you run the workflow in order, but if it does:

**Fix with**: `npm run sync` (always syncs index → markdown files)

### Index shows null values for fields I'm sure I added

This is expected behavior. The sync script only includes fields that have non-null values in the index. Null values are omitted from the markdown frontmatter to keep files clean.

If you want a field to show up, make sure it has a value in the index:

1. Edit the markdown frontmatter directly
2. Run `npm run normalize && npm run sync && npm run index`

## Next Steps

Once frontmatter is standardized and validated:

- Build a comparison/search UI
- Analyze patterns in state models, paradigms, rendering strategies
- Generate reports on the 9-dimension rubric scores across different categories
- Identify frameworks suitable for specific use cases
