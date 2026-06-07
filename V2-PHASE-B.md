# v2 Phase B — queued (seed for the next planning pass)

Phase A (the v2 machinery: rubric schema, tooling pipeline, `CLAUDE.md` template,
`.claude/agents/framework-researcher.md`, and `AGENTIC-DEV-RANKINGS.md` methodology)
is complete — see `git log` for the commits that landed it. This file survives that
cleanup specifically to record what's still owed: **a separate planning pass for the
corpus work the new machinery exists to drive.**

In the order the original v2 discussion settled on:

1. **Corpus-completeness sweep** (deliberately sequenced first) — cross-reference
   commonly-discussed current UI frameworks/libraries against `research/`'s existing
   entries; look for thin categories (meta-frameworks, signal-based libraries,
   compiler-output frameworks, etc.)
2. **New corpus entries**: Preact (standalone and/or paired), plus combo files for
   htmx+HTML, Alpine.js+HTML, Lit+Preact, Lit+Stencil, and whatever the sweep
   surfaces
3. **From-scratch rewrite of all existing reviews** under the new 9-dimension rubric
   (confirmed approach — not remap/salvage; v1 stays diffable via git history)
4. **Skills/agents for *ongoing* maintenance** (original v2 goal #5, beyond the
   research agent itself) — deliberately deferred until the brief in
   `.claude/agents/framework-researcher.md` existed (it now does), since it clarifies
   what maintenance workflows actually need

Once a real plan exists for this work and is underway, this file can be retired for good.
