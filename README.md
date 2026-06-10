# UI Framework Research

Research toward a next-generation UI framework optimized for AI-assisted development. See [CLAUDE.md](./CLAUDE.md) for the full project brief and methodology.

## Where to start

- **[research/](./research/)** — One review per framework/library (state management, rendering, event handling), scored against a flat 9-dimension agentic-development rubric with a per-dimension evidence section backing each score. Searchable with ripgrep; see [CLAUDE.md](./CLAUDE.md) for example queries. [research/frameworks.json](./research/frameworks.json) is a generated index of all reviews.
- **[AGENTIC-DEV-RANKINGS.md](./AGENTIC-DEV-RANKINGS.md)** — Synthesis ranking the reviewed frameworks for agentic/AI-driven development, with the methodology for reproducing or updating the ranking.
- **[NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md)** — Design principles for an AI-first UI framework, synthesized from the framework reviews.
- **[WORKFLOW.md](./WORKFLOW.md)** — How to add or update framework reviews and keep the index/frontmatter in sync (`npm run` scripts).
- **[schema/](./schema/)** — JSON Schema for review frontmatter.
